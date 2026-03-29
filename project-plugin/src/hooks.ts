/**
 * Hook Integration for Command Center Plugin
 *
 * Provides functions for integrating with Claude Code hooks system.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createPlugin, interactiveEnrich } from './plugin.js';
import { findProjectRoot, isConfigured, getConfigDir } from './config.js';
import type { ClarificationQuestion, EnrichmentResult } from './types.js';

/**
 * Hook handler for prompt enrichment
 * Called before agent execution to enrich the user prompt
 */
export async function onPromptSubmit(userPrompt: string): Promise<string> {
  // Skip if not configured
  if (!isConfigured()) {
    return userPrompt;
  }

  const plugin = createPlugin();

  try {
    const result = await plugin.enrichPrompt(userPrompt);

    if (result.needsClarification) {
      // In CLI context, we can't do interactive clarification
      // Return original prompt with a note
      console.log('\n[Command Center] Clarification needed but running in non-interactive mode');
      console.log('[Command Center] Using original prompt\n');
      return userPrompt;
    }

    if (result.enrichedPrompt) {
      console.log('\n[Command Center] Prompt enriched');
      if (result.contextApplied && result.contextApplied.length > 0) {
        console.log(`[Command Center] Context: ${result.contextApplied.join(', ')}`);
      }
      if (result.patternsApplied && result.patternsApplied.length > 0) {
        console.log(`[Command Center] Patterns: ${result.patternsApplied.join(', ')}`);
      }
      console.log('');
      return result.enrichedPrompt;
    }

    return userPrompt;
  } catch (error) {
    console.error('[Command Center] Enrichment failed:', error);
    return userPrompt;
  }
}

/**
 * Hook handler for session start
 * Called when an agent session starts
 */
export async function onSessionStart(sessionInfo: {
  agentType?: string;
  taskId?: string;
  userPrompt?: string;
}): Promise<void> {
  if (!isConfigured()) {
    return;
  }

  const plugin = createPlugin();

  try {
    await plugin.recordSession({
      projectId: '', // Will be filled from config
      agentType: sessionInfo.agentType,
      taskId: sessionInfo.taskId,
      status: 'started',
      userPrompt: sessionInfo.userPrompt,
    });
  } catch (error) {
    // Silent fail - don't block agent execution
  }
}

/**
 * Hook handler for session end
 * Called when an agent session completes
 */
export async function onSessionEnd(sessionInfo: {
  agentType?: string;
  taskId?: string;
  userPrompt?: string;
  enrichedPrompt?: string;
  tokensInput?: number;
  tokensOutput?: number;
  modelUsed?: string;
  status: 'completed' | 'failed';
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isConfigured()) {
    return;
  }

  const plugin = createPlugin();

  try {
    await plugin.recordSession({
      projectId: '', // Will be filled from config
      agentType: sessionInfo.agentType,
      taskId: sessionInfo.taskId,
      status: sessionInfo.status,
      userPrompt: sessionInfo.userPrompt,
      enrichedPrompt: sessionInfo.enrichedPrompt,
      tokensInput: sessionInfo.tokensInput,
      tokensOutput: sessionInfo.tokensOutput,
      modelUsed: sessionInfo.modelUsed,
      metadata: sessionInfo.metadata,
    });
  } catch (error) {
    // Silent fail
  }
}

/**
 * Install hooks into a project's .claude directory
 */
export function installHooks(projectRoot?: string): void {
  const root = projectRoot || findProjectRoot() || process.cwd();
  const hooksDir = path.join(root, '.claude', 'hooks');

  // Create hooks directory if needed
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  // Create prompt enrichment hook
  const enrichHookPath = path.join(hooksDir, 'command-center-enrich.sh');
  const enrichHookContent = `#!/bin/bash
# Command Center Prompt Enrichment Hook
# Auto-generated - do not edit manually

PLUGIN_DIR="\$(dirname "\$0")/../command-center"

if [ -f "\$PLUGIN_DIR/config.json" ]; then
    COMMAND_CENTER_URL=\$(grep -o '"commandCenterUrl": *"[^"]*"' "\$PLUGIN_DIR/config.json" | cut -d'"' -f4)
    API_KEY=\$(grep -o '"apiKey": *"[^"]*"' "\$PLUGIN_DIR/config.json" | cut -d'"' -f4)
    PROJECT_ID=\$(grep -o '"projectId": *"[^"]*"' "\$PLUGIN_DIR/config.json" | cut -d'"' -f4)
fi

# Skip if not configured
if [ -z "\$API_KEY" ] || [ -z "\$PROJECT_ID" ]; then
    echo "\$1"
    exit 0
fi

USER_PROMPT="\$1"
if [ -z "\$USER_PROMPT" ]; then
    exit 0
fi

# Call Command Center API
RESPONSE=\$(curl -s -X POST "\$COMMAND_CENTER_URL/api/enrich-prompt" \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer \$API_KEY" \\
    -d "{\\"project_id\\": \\"\$PROJECT_ID\\", \\"user_prompt\\": \\"\$USER_PROMPT\\", \\"skip_clarification\\": true}" \\
    --max-time 10 2>/dev/null)

# Extract enriched prompt or fall back to original
if echo "\$RESPONSE" | grep -q '"success":true'; then
    ENRICHED=\$(echo "\$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('enriched_prompt',''))" 2>/dev/null)
    if [ -n "\$ENRICHED" ]; then
        echo "\$ENRICHED"
        exit 0
    fi
fi

echo "\$USER_PROMPT"
`;

  fs.writeFileSync(enrichHookPath, enrichHookContent);
  fs.chmodSync(enrichHookPath, '755');

  // Create session logging hook
  const sessionHookPath = path.join(hooksDir, 'command-center-session.sh');
  const sessionHookContent = `#!/bin/bash
# Command Center Session Logging Hook
# Auto-generated - do not edit manually

PLUGIN_DIR="\$(dirname "\$0")/../command-center"

if [ -f "\$PLUGIN_DIR/config.json" ]; then
    COMMAND_CENTER_URL=\$(grep -o '"commandCenterUrl": *"[^"]*"' "\$PLUGIN_DIR/config.json" | cut -d'"' -f4)
    API_KEY=\$(grep -o '"apiKey": *"[^"]*"' "\$PLUGIN_DIR/config.json" | cut -d'"' -f4)
    PROJECT_ID=\$(grep -o '"projectId": *"[^"]*"' "\$PLUGIN_DIR/config.json" | cut -d'"' -f4)
fi

# Skip if not configured
if [ -z "\$API_KEY" ] || [ -z "\$PROJECT_ID" ]; then
    exit 0
fi

# Session data from environment or arguments
STATUS="\${1:-completed}"
USER_PROMPT="\${2:-}"
TOKENS_INPUT="\${3:-0}"
TOKENS_OUTPUT="\${4:-0}"
MODEL="\${5:-unknown}"

# Record session to Command Center
curl -s -X POST "\$COMMAND_CENTER_URL/api/sessions" \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer \$API_KEY" \\
    -d "{\\"project_id\\": \\"\$PROJECT_ID\\", \\"status\\": \\"\$STATUS\\", \\"user_prompt\\": \\"\$USER_PROMPT\\", \\"tokens_input\\": \$TOKENS_INPUT, \\"tokens_output\\": \$TOKENS_OUTPUT, \\"model_used\\": \\"\$MODEL\\"}" \\
    --max-time 5 2>/dev/null &

exit 0
`;

  fs.writeFileSync(sessionHookPath, sessionHookContent);
  fs.chmodSync(sessionHookPath, '755');

  console.log(`Hooks installed to ${hooksDir}`);
}

/**
 * Uninstall hooks from a project
 */
export function uninstallHooks(projectRoot?: string): void {
  const root = projectRoot || findProjectRoot() || process.cwd();
  const hooksDir = path.join(root, '.claude', 'hooks');

  const enrichHookPath = path.join(hooksDir, 'command-center-enrich.sh');
  const sessionHookPath = path.join(hooksDir, 'command-center-session.sh');

  if (fs.existsSync(enrichHookPath)) {
    fs.unlinkSync(enrichHookPath);
  }
  if (fs.existsSync(sessionHookPath)) {
    fs.unlinkSync(sessionHookPath);
  }

  console.log('Hooks uninstalled');
}
