/**
 * Command Center Project Plugin
 *
 * Integrates individual projects with the Command Center for:
 * - Prompt enrichment (bare prompts → contextual prompts)
 * - Session tracking
 * - Cost monitoring
 *
 * Installation: Copy this directory to .claude/command-center/ in your project
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface ProjectConfig {
  projectId: string;
  apiKey: string;
  commandCenterUrl: string;
  projectName?: string;
  autoEnrich?: boolean;
  techStack?: string[];
}

interface ClarificationQuestion {
  id: string;
  question: string;
  options: Array<{
    id: string;
    label: string;
    description?: string;
    recommended?: boolean;
  }>;
  allowOther?: boolean;
}

interface EnrichmentResult {
  success: boolean;
  needsClarification?: boolean;
  questions?: ClarificationQuestion[];
  sessionId?: string;
  enrichedPrompt?: string;
  metadata?: {
    ambiguitiesFound?: number;
    contextApplied?: string[];
    estimatedTokens?: number;
  };
  error?: string;
}

interface SessionData {
  sessionId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  tokensInput?: number;
  tokensOutput?: number;
  model?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

/**
 * Command Center Plugin
 *
 * Usage:
 * ```typescript
 * const plugin = new CommandCenterPlugin();
 *
 * // Enrich a prompt
 * const result = await plugin.enrichPrompt('Add dark mode');
 * if (result.needsClarification) {
 *   // Handle clarification questions
 *   const answers = await askUserQuestions(result.questions);
 *   const enriched = await plugin.submitClarifications(result.sessionId, answers);
 * }
 *
 * // Record session data
 * await plugin.recordSession({ sessionId: '...', status: 'completed', ... });
 * ```
 */
export class CommandCenterPlugin {
  private config: ProjectConfig;
  private configPath: string;

  constructor(projectRoot?: string) {
    const root = projectRoot || process.cwd();
    this.configPath = path.join(root, '.claude', 'command-center', 'config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): ProjectConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn('[CommandCenter] Failed to load config:', error);
    }

    // Fall back to environment variables
    return {
      projectId: process.env.COMMAND_CENTER_PROJECT_ID || '',
      apiKey: process.env.COMMAND_CENTER_API_KEY || '',
      commandCenterUrl: process.env.COMMAND_CENTER_URL || 'http://localhost:3000',
      autoEnrich: process.env.COMMAND_CENTER_AUTO_ENRICH !== 'false',
    };
  }

  private saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('[CommandCenter] Failed to save config:', error);
    }
  }

  /**
   * Check if the plugin is configured and ready to use
   */
  isConfigured(): boolean {
    return !!(this.config.projectId && this.config.apiKey && this.config.commandCenterUrl);
  }

  /**
   * Get project context from local .claude/ directory
   */
  getProjectContext(): Record<string, any> {
    const projectRoot = path.dirname(path.dirname(this.configPath));
    const claudeDir = path.join(projectRoot, '.claude');

    const context: Record<string, any> = {
      projectName: this.config.projectName,
      techStack: this.config.techStack || [],
    };

    // Try to read local config files
    const rulesPath = path.join(claudeDir, 'rules');
    if (fs.existsSync(rulesPath)) {
      try {
        const rules = fs.readdirSync(rulesPath)
          .filter(f => f.endsWith('.md') || f.endsWith('.txt'))
          .map(f => fs.readFileSync(path.join(rulesPath, f), 'utf-8'));
        context.localRules = rules;
      } catch (error) {
        // Ignore read errors
      }
    }

    // Read package.json for tech stack detection
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        context.dependencies = Object.keys(pkg.dependencies || {});
        context.devDependencies = Object.keys(pkg.devDependencies || {});
      } catch (error) {
        // Ignore read errors
      }
    }

    return context;
  }

  /**
   * Enrich a user prompt with project context
   *
   * @param userPrompt The bare prompt from the user
   * @returns Enrichment result with either questions or enriched prompt
   */
  async enrichPrompt(userPrompt: string): Promise<EnrichmentResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Plugin not configured. Run setup first.',
      };
    }

    try {
      const response = await fetch(`${this.config.commandCenterUrl}/api/enrich-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          projectId: this.config.projectId,
          userPrompt,
          context: this.getProjectContext(),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `API error: ${response.status} - ${error}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        ...data,
      };
    } catch (error) {
      // Graceful degradation - return original prompt if Command Center is unavailable
      console.warn('[CommandCenter] Failed to enrich prompt, using original:', error);
      return {
        success: true,
        needsClarification: false,
        enrichedPrompt: userPrompt,
        metadata: {
          contextApplied: ['offline-fallback'],
        },
      };
    }
  }

  /**
   * Submit clarification answers and get enriched prompt
   *
   * @param sessionId The session ID from the initial enrichment
   * @param answers Map of question IDs to answer IDs
   * @returns Enriched prompt
   */
  async submitClarifications(
    sessionId: string,
    answers: Record<string, string>
  ): Promise<EnrichmentResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Plugin not configured. Run setup first.',
      };
    }

    try {
      const response = await fetch(`${this.config.commandCenterUrl}/api/clarifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          sessionId,
          answers,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `API error: ${response.status} - ${error}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        ...data,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to submit clarifications: ${error}`,
      };
    }
  }

  /**
   * Record session data back to Command Center
   *
   * @param sessionData Session metrics and status
   */
  async recordSession(sessionData: SessionData): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Plugin not configured' };
    }

    try {
      const response = await fetch(
        `${this.config.commandCenterUrl}/api/sessions/${sessionData.sessionId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(sessionData),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `API error: ${response.status} - ${error}` };
      }

      return { success: true };
    } catch (error) {
      console.warn('[CommandCenter] Failed to record session:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Configure the plugin interactively
   */
  async setup(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (prompt: string): Promise<string> =>
      new Promise((resolve) => rl.question(prompt, resolve));

    console.log('\n=== Command Center Plugin Setup ===\n');

    this.config.commandCenterUrl =
      (await question(`Command Center URL [${this.config.commandCenterUrl || 'http://localhost:3000'}]: `)) ||
      this.config.commandCenterUrl ||
      'http://localhost:3000';

    this.config.projectId =
      (await question(`Project ID [${this.config.projectId || 'from Command Center dashboard'}]: `)) ||
      this.config.projectId;

    this.config.apiKey =
      (await question(`API Key [${this.config.apiKey ? '********' : 'from Command Center dashboard'}]: `)) ||
      this.config.apiKey;

    this.config.projectName =
      (await question(`Project Name [${this.config.projectName || 'optional'}]: `)) ||
      this.config.projectName;

    const techStackInput = await question(
      `Tech Stack (comma-separated) [${this.config.techStack?.join(', ') || 'e.g., react,typescript,tailwind'}]: `
    );
    if (techStackInput) {
      this.config.techStack = techStackInput.split(',').map((s) => s.trim());
    }

    rl.close();

    this.saveConfig();
    console.log('\nConfiguration saved to', this.configPath);

    // Verify connection
    console.log('\nVerifying connection to Command Center...');
    try {
      const response = await fetch(`${this.config.commandCenterUrl}/api/projects/${this.config.projectId}`, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
      });
      if (response.ok) {
        const project = await response.json();
        console.log(`Connected! Project: ${project.data?.name || this.config.projectId}`);
      } else {
        console.warn('Warning: Could not verify project connection. Check your credentials.');
      }
    } catch (error) {
      console.warn('Warning: Could not reach Command Center. It may be offline.');
    }

    console.log('\nSetup complete! You can now use the plugin.\n');
  }
}

// CLI interface when run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const plugin = new CommandCenterPlugin();

  if (args[0] === 'setup') {
    plugin.setup();
  } else if (args[0] === 'enrich') {
    const prompt = args.slice(1).join(' ');
    if (!prompt) {
      console.error('Usage: plugin.ts enrich <prompt>');
      process.exit(1);
    }
    plugin.enrichPrompt(prompt).then((result) => {
      console.log(JSON.stringify(result, null, 2));
    });
  } else if (args[0] === 'context') {
    console.log(JSON.stringify(plugin.getProjectContext(), null, 2));
  } else {
    console.log(`
Command Center Plugin CLI

Usage:
  ts-node plugin.ts setup              Configure the plugin
  ts-node plugin.ts enrich <prompt>    Enrich a prompt
  ts-node plugin.ts context            Show local project context

Environment Variables:
  COMMAND_CENTER_URL        URL of the Command Center
  COMMAND_CENTER_PROJECT_ID Project ID from Command Center
  COMMAND_CENTER_API_KEY    API key for authentication
`);
  }
}

export default CommandCenterPlugin;
