/**
 * Configuration handling for Command Center Plugin
 */

import * as fs from 'fs';
import * as path from 'path';
import type { PluginConfig, ProjectContext } from './types.js';

const CONFIG_DIR = '.claude/command-center';
const CONFIG_FILE = 'config.json';

const DEFAULT_CONFIG: PluginConfig = {
  commandCenterUrl: 'http://localhost:3000',
  apiKey: '',
  projectId: '',
  autoEnrich: true,
  skipClarification: false,
  timeout: 30000,
  offlineMode: true,
};

/**
 * Find the project root by looking for .claude directory
 */
export function findProjectRoot(startPath: string = process.cwd()): string | null {
  let currentPath = startPath;

  while (currentPath !== '/') {
    const claudeDir = path.join(currentPath, '.claude');
    if (fs.existsSync(claudeDir)) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }

  return null;
}

/**
 * Get the config directory path
 */
export function getConfigDir(projectRoot?: string): string {
  const root = projectRoot || findProjectRoot() || process.cwd();
  return path.join(root, CONFIG_DIR);
}

/**
 * Get the config file path
 */
export function getConfigPath(projectRoot?: string): string {
  return path.join(getConfigDir(projectRoot), CONFIG_FILE);
}

/**
 * Check if plugin is configured
 */
export function isConfigured(projectRoot?: string): boolean {
  const configPath = getConfigPath(projectRoot);
  return fs.existsSync(configPath);
}

/**
 * Load plugin configuration
 */
export function loadConfig(projectRoot?: string): PluginConfig {
  const configPath = getConfigPath(projectRoot);

  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    console.error('Error loading config:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Save plugin configuration
 */
export function saveConfig(config: Partial<PluginConfig>, projectRoot?: string): void {
  const configDir = getConfigDir(projectRoot);
  const configPath = getConfigPath(projectRoot);

  // Create directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Merge with existing config
  const existingConfig = loadConfig(projectRoot);
  const newConfig = { ...existingConfig, ...config };

  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
}

/**
 * Load project context from .claude directory
 */
export function loadProjectContext(projectRoot?: string): ProjectContext {
  const root = projectRoot || findProjectRoot() || process.cwd();

  // Try to load from CLAUDE.md
  const claudeMdPath = path.join(root, 'CLAUDE.md');
  let description = '';

  if (fs.existsSync(claudeMdPath)) {
    const content = fs.readFileSync(claudeMdPath, 'utf-8');
    // Extract first paragraph as description
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    description = lines.slice(0, 3).join(' ').substring(0, 500);
  }

  // Try to detect tech stack from package.json
  const techStack: Record<string, string[]> = {};
  const packageJsonPath = path.join(root, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      // Detect frameworks from dependencies
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const frameworks: string[] = [];
      const languages: string[] = ['TypeScript', 'JavaScript'];

      if (deps.next) frameworks.push('Next.js');
      if (deps.react) frameworks.push('React');
      if (deps.vue) frameworks.push('Vue');
      if (deps.angular) frameworks.push('Angular');
      if (deps.express) frameworks.push('Express');
      if (deps.fastify) frameworks.push('Fastify');
      if (deps.tailwindcss) frameworks.push('Tailwind CSS');

      if (frameworks.length > 0) techStack.frameworks = frameworks;
      techStack.languages = languages;
    } catch {
      // Ignore package.json parse errors
    }
  }

  // Check for other language indicators
  if (fs.existsSync(path.join(root, 'pubspec.yaml'))) {
    techStack.languages = ['Dart'];
    techStack.frameworks = ['Flutter'];
  }
  if (fs.existsSync(path.join(root, 'Cargo.toml'))) {
    techStack.languages = ['Rust'];
  }
  if (fs.existsSync(path.join(root, 'go.mod'))) {
    techStack.languages = ['Go'];
  }
  if (fs.existsSync(path.join(root, 'requirements.txt')) || fs.existsSync(path.join(root, 'pyproject.toml'))) {
    techStack.languages = ['Python'];
  }

  return {
    name: path.basename(root),
    description,
    techStack,
    repoPath: root,
  };
}

/**
 * Get config from environment variables (fallback)
 */
export function getEnvConfig(): Partial<PluginConfig> {
  const config: Partial<PluginConfig> = {};

  if (process.env.COMMAND_CENTER_URL) {
    config.commandCenterUrl = process.env.COMMAND_CENTER_URL;
  }
  if (process.env.COMMAND_CENTER_API_KEY) {
    config.apiKey = process.env.COMMAND_CENTER_API_KEY;
  }
  if (process.env.COMMAND_CENTER_PROJECT_ID) {
    config.projectId = process.env.COMMAND_CENTER_PROJECT_ID;
  }

  return config;
}

/**
 * Get merged config (file + env)
 */
export function getConfig(projectRoot?: string): PluginConfig {
  const fileConfig = loadConfig(projectRoot);
  const envConfig = getEnvConfig();
  return { ...fileConfig, ...envConfig };
}
