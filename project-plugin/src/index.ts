/**
 * Command Center Plugin
 *
 * Prompt enrichment plugin for project repositories.
 */

// Core plugin
export { CommandCenterPlugin, createPlugin, enrichPrompt, interactiveEnrich } from './plugin.js';

// Configuration
export {
  findProjectRoot,
  getConfigDir,
  getConfigPath,
  isConfigured,
  loadConfig,
  saveConfig,
  loadProjectContext,
  getEnvConfig,
  getConfig,
} from './config.js';

// Hooks
export {
  onPromptSubmit,
  onSessionStart,
  onSessionEnd,
  installHooks,
  uninstallHooks,
} from './hooks.js';

// Types
export type {
  PluginConfig,
  ProjectContext,
  ClarificationQuestion,
  SuggestedPattern,
  EnrichmentResult,
  SessionData,
  AnswerClarificationInput,
  PluginStatus,
} from './types.js';
