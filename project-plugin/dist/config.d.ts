/**
 * Configuration handling for Command Center Plugin
 */
import type { PluginConfig, ProjectContext } from './types.js';
/**
 * Find the project root by looking for .claude directory
 */
export declare function findProjectRoot(startPath?: string): string | null;
/**
 * Get the config directory path
 */
export declare function getConfigDir(projectRoot?: string): string;
/**
 * Get the config file path
 */
export declare function getConfigPath(projectRoot?: string): string;
/**
 * Check if plugin is configured
 */
export declare function isConfigured(projectRoot?: string): boolean;
/**
 * Load plugin configuration
 */
export declare function loadConfig(projectRoot?: string): PluginConfig;
/**
 * Save plugin configuration
 */
export declare function saveConfig(config: Partial<PluginConfig>, projectRoot?: string): void;
/**
 * Load project context from .claude directory
 */
export declare function loadProjectContext(projectRoot?: string): ProjectContext;
/**
 * Get config from environment variables (fallback)
 */
export declare function getEnvConfig(): Partial<PluginConfig>;
/**
 * Get merged config (file + env)
 */
export declare function getConfig(projectRoot?: string): PluginConfig;
//# sourceMappingURL=config.d.ts.map