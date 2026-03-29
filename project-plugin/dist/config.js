"use strict";
/**
 * Configuration handling for Command Center Plugin
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.findProjectRoot = findProjectRoot;
exports.getConfigDir = getConfigDir;
exports.getConfigPath = getConfigPath;
exports.isConfigured = isConfigured;
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.loadProjectContext = loadProjectContext;
exports.getEnvConfig = getEnvConfig;
exports.getConfig = getConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const CONFIG_DIR = '.claude/command-center';
const CONFIG_FILE = 'config.json';
const DEFAULT_CONFIG = {
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
function findProjectRoot(startPath = process.cwd()) {
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
function getConfigDir(projectRoot) {
    const root = projectRoot || findProjectRoot() || process.cwd();
    return path.join(root, CONFIG_DIR);
}
/**
 * Get the config file path
 */
function getConfigPath(projectRoot) {
    return path.join(getConfigDir(projectRoot), CONFIG_FILE);
}
/**
 * Check if plugin is configured
 */
function isConfigured(projectRoot) {
    const configPath = getConfigPath(projectRoot);
    return fs.existsSync(configPath);
}
/**
 * Load plugin configuration
 */
function loadConfig(projectRoot) {
    const configPath = getConfigPath(projectRoot);
    if (!fs.existsSync(configPath)) {
        return DEFAULT_CONFIG;
    }
    try {
        const content = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content);
        return { ...DEFAULT_CONFIG, ...config };
    }
    catch (error) {
        console.error('Error loading config:', error);
        return DEFAULT_CONFIG;
    }
}
/**
 * Save plugin configuration
 */
function saveConfig(config, projectRoot) {
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
function loadProjectContext(projectRoot) {
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
    const techStack = {};
    const packageJsonPath = path.join(root, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            // Detect frameworks from dependencies
            const deps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
            };
            const frameworks = [];
            const languages = ['TypeScript', 'JavaScript'];
            if (deps.next)
                frameworks.push('Next.js');
            if (deps.react)
                frameworks.push('React');
            if (deps.vue)
                frameworks.push('Vue');
            if (deps.angular)
                frameworks.push('Angular');
            if (deps.express)
                frameworks.push('Express');
            if (deps.fastify)
                frameworks.push('Fastify');
            if (deps.tailwindcss)
                frameworks.push('Tailwind CSS');
            if (frameworks.length > 0)
                techStack.frameworks = frameworks;
            techStack.languages = languages;
        }
        catch {
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
function getEnvConfig() {
    const config = {};
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
function getConfig(projectRoot) {
    const fileConfig = loadConfig(projectRoot);
    const envConfig = getEnvConfig();
    return { ...fileConfig, ...envConfig };
}
//# sourceMappingURL=config.js.map