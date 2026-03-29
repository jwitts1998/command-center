#!/usr/bin/env node

/**
 * Command Center Plugin CLI
 *
 * Setup and management commands for the plugin.
 */

import { program } from 'commander';
import { createInterface } from 'readline';
import {
  findProjectRoot,
  getConfigDir,
  saveConfig,
  loadConfig,
  isConfigured,
  loadProjectContext,
} from './config.js';
import { createPlugin } from './plugin.js';
import type { PluginConfig } from './types.js';

const VERSION = '1.0.0';

// ANSI colors (basic, no chalk dependency for now)
const colors = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

/**
 * Prompt user for input
 */
function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Setup command - configure the plugin
 */
async function setup(options: { url?: string; key?: string; project?: string }) {
  console.log(colors.bold('\nCommand Center Plugin Setup\n'));

  // Find project root
  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    console.log(colors.yellow('Warning: No .claude directory found.'));
    console.log('Creating .claude/command-center in current directory...\n');
  }

  // Get existing config
  const existingConfig = loadConfig(projectRoot || undefined);

  // Prompt for values
  const commandCenterUrl =
    options.url ||
    (await prompt(
      `Command Center URL [${existingConfig.commandCenterUrl}]: `
    )) ||
    existingConfig.commandCenterUrl;

  const apiKey =
    options.key ||
    (await prompt(`API Key${existingConfig.apiKey ? ' [****]' : ''}: `)) ||
    existingConfig.apiKey;

  const projectId =
    options.project ||
    (await prompt(`Project ID [${existingConfig.projectId}]: `)) ||
    existingConfig.projectId;

  // Validate inputs
  if (!apiKey) {
    console.log(colors.red('\nError: API Key is required'));
    process.exit(1);
  }

  if (!projectId) {
    console.log(colors.red('\nError: Project ID is required'));
    console.log(colors.dim('Get your Project ID from the Command Center dashboard'));
    process.exit(1);
  }

  // Save config
  const config: Partial<PluginConfig> = {
    commandCenterUrl,
    apiKey,
    projectId,
    autoEnrich: true,
    skipClarification: false,
    timeout: 30000,
    offlineMode: true,
  };

  saveConfig(config, projectRoot || undefined);

  console.log(colors.green('\n✓ Configuration saved'));
  console.log(colors.dim(`  Config: ${getConfigDir(projectRoot || undefined)}/config.json`));

  // Test connection
  console.log('\nTesting connection...');
  const plugin = createPlugin(projectRoot || undefined);
  const status = await plugin.testConnection();

  if (status.connected) {
    console.log(colors.green('✓ Connected to Command Center'));
    if (status.project) {
      console.log(colors.dim(`  Project: ${status.project.name} (${status.project.status})`));
    }
  } else {
    console.log(colors.yellow('⚠ Could not connect to Command Center'));
    console.log(colors.dim(`  ${status.error}`));
    console.log(colors.dim('  Plugin will work in offline mode'));
  }

  console.log(colors.green('\n✓ Setup complete!\n'));
}

/**
 * Test command - test the plugin connection and enrichment
 */
async function test(options: { prompt?: string }) {
  console.log(colors.bold('\nCommand Center Plugin Test\n'));

  if (!isConfigured()) {
    console.log(colors.red('Error: Plugin not configured'));
    console.log(colors.dim('Run: cc-plugin setup'));
    process.exit(1);
  }

  const plugin = createPlugin();

  // Test connection
  console.log('Testing connection...');
  const status = await plugin.testConnection();

  if (status.connected) {
    console.log(colors.green('✓ Connected to Command Center'));
    if (status.project) {
      console.log(colors.dim(`  Project: ${status.project.name}`));
    }
  } else {
    console.log(colors.yellow('⚠ Connection failed'));
    console.log(colors.dim(`  ${status.error}`));
  }

  // Test enrichment
  if (options.prompt) {
    console.log('\nTesting enrichment...');
    try {
      const result = await plugin.enrichPrompt(options.prompt);

      if (result.needsClarification) {
        console.log(colors.yellow('⚠ Clarification needed'));
        console.log(colors.dim(`  ${result.questions?.length || 0} questions`));
      } else {
        console.log(colors.green('✓ Enrichment successful'));
        console.log(colors.dim(`  Context applied: ${result.contextApplied?.join(', ') || 'none'}`));
        console.log(colors.dim(`  Patterns applied: ${result.patternsApplied?.join(', ') || 'none'}`));
      }
    } catch (error) {
      console.log(colors.red('✗ Enrichment failed'));
      console.log(colors.dim(`  ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  console.log('');
}

/**
 * Status command - show current configuration and status
 */
async function status() {
  console.log(colors.bold('\nCommand Center Plugin Status\n'));

  const projectRoot = findProjectRoot();
  const configured = isConfigured(projectRoot || undefined);

  console.log(`Configuration: ${configured ? colors.green('Found') : colors.yellow('Not configured')}`);

  if (configured) {
    const config = loadConfig(projectRoot || undefined);
    console.log(colors.dim(`  URL: ${config.commandCenterUrl}`));
    console.log(colors.dim(`  Project ID: ${config.projectId}`));
    console.log(colors.dim(`  Auto Enrich: ${config.autoEnrich}`));
    console.log(colors.dim(`  Offline Mode: ${config.offlineMode}`));

    const plugin = createPlugin(projectRoot || undefined);
    const connStatus = await plugin.testConnection();

    console.log(`\nConnection: ${connStatus.connected ? colors.green('Connected') : colors.yellow('Disconnected')}`);
    if (connStatus.project) {
      console.log(colors.dim(`  Project: ${connStatus.project.name} (${connStatus.project.status})`));
    }
    if (connStatus.error) {
      console.log(colors.dim(`  Error: ${connStatus.error}`));
    }
  }

  // Show project context
  console.log('\nProject Context:');
  const context = loadProjectContext(projectRoot || undefined);
  console.log(colors.dim(`  Name: ${context.name}`));
  console.log(colors.dim(`  Path: ${context.repoPath}`));
  if (Object.keys(context.techStack).length > 0) {
    for (const [key, value] of Object.entries(context.techStack)) {
      console.log(colors.dim(`  ${key}: ${(value as string[]).join(', ')}`));
    }
  }

  console.log('');
}

/**
 * Enrich command - enrich a prompt from CLI
 */
async function enrich(promptText: string, options: { json?: boolean }) {
  if (!isConfigured()) {
    console.error('Error: Plugin not configured. Run: cc-plugin setup');
    process.exit(1);
  }

  const plugin = createPlugin();

  try {
    const result = await plugin.enrichPrompt(promptText);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    if (result.needsClarification) {
      console.log('\nClarification needed:\n');
      for (const q of result.questions || []) {
        console.log(colors.bold(`${q.header}: ${q.question}`));
        for (const opt of q.options) {
          const marker = opt.isRecommended ? colors.green('→') : ' ';
          console.log(`  ${marker} ${opt.label}: ${opt.description}`);
        }
        console.log('');
      }
      console.log(colors.dim(`Session ID: ${result.sessionId}`));
    } else {
      console.log('\n' + colors.bold('Enriched Prompt:') + '\n');
      console.log(result.enrichedPrompt);

      if (result.contextApplied && result.contextApplied.length > 0) {
        console.log('\n' + colors.dim('Context: ' + result.contextApplied.join(', ')));
      }
      if (result.patternsApplied && result.patternsApplied.length > 0) {
        console.log(colors.dim('Patterns: ' + result.patternsApplied.join(', ')));
      }
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// CLI program
program
  .name('cc-plugin')
  .description('Command Center Plugin CLI')
  .version(VERSION);

program
  .command('setup')
  .description('Configure the Command Center plugin')
  .option('-u, --url <url>', 'Command Center URL')
  .option('-k, --key <key>', 'API Key')
  .option('-p, --project <id>', 'Project ID')
  .action(setup);

program
  .command('test')
  .description('Test plugin connection and enrichment')
  .option('-p, --prompt <text>', 'Test prompt to enrich')
  .action(test);

program
  .command('status')
  .description('Show plugin status and configuration')
  .action(status);

program
  .command('enrich <prompt>')
  .description('Enrich a prompt')
  .option('--json', 'Output as JSON')
  .action(enrich);

program.parse();
