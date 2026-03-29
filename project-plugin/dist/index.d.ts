/**
 * Command Center Plugin
 *
 * Prompt enrichment plugin for project repositories.
 */
export { CommandCenterPlugin, createPlugin, enrichPrompt, interactiveEnrich } from './plugin.js';
export { findProjectRoot, getConfigDir, getConfigPath, isConfigured, loadConfig, saveConfig, loadProjectContext, getEnvConfig, getConfig, } from './config.js';
export { onPromptSubmit, onSessionStart, onSessionEnd, installHooks, uninstallHooks, } from './hooks.js';
export type { PluginConfig, ProjectContext, ClarificationQuestion, SuggestedPattern, EnrichmentResult, SessionData, AnswerClarificationInput, PluginStatus, } from './types.js';
//# sourceMappingURL=index.d.ts.map