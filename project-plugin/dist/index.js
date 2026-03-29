"use strict";
/**
 * Command Center Plugin
 *
 * Prompt enrichment plugin for project repositories.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.uninstallHooks = exports.installHooks = exports.onSessionEnd = exports.onSessionStart = exports.onPromptSubmit = exports.getConfig = exports.getEnvConfig = exports.loadProjectContext = exports.saveConfig = exports.loadConfig = exports.isConfigured = exports.getConfigPath = exports.getConfigDir = exports.findProjectRoot = exports.interactiveEnrich = exports.enrichPrompt = exports.createPlugin = exports.CommandCenterPlugin = void 0;
// Core plugin
var plugin_js_1 = require("./plugin.js");
Object.defineProperty(exports, "CommandCenterPlugin", { enumerable: true, get: function () { return plugin_js_1.CommandCenterPlugin; } });
Object.defineProperty(exports, "createPlugin", { enumerable: true, get: function () { return plugin_js_1.createPlugin; } });
Object.defineProperty(exports, "enrichPrompt", { enumerable: true, get: function () { return plugin_js_1.enrichPrompt; } });
Object.defineProperty(exports, "interactiveEnrich", { enumerable: true, get: function () { return plugin_js_1.interactiveEnrich; } });
// Configuration
var config_js_1 = require("./config.js");
Object.defineProperty(exports, "findProjectRoot", { enumerable: true, get: function () { return config_js_1.findProjectRoot; } });
Object.defineProperty(exports, "getConfigDir", { enumerable: true, get: function () { return config_js_1.getConfigDir; } });
Object.defineProperty(exports, "getConfigPath", { enumerable: true, get: function () { return config_js_1.getConfigPath; } });
Object.defineProperty(exports, "isConfigured", { enumerable: true, get: function () { return config_js_1.isConfigured; } });
Object.defineProperty(exports, "loadConfig", { enumerable: true, get: function () { return config_js_1.loadConfig; } });
Object.defineProperty(exports, "saveConfig", { enumerable: true, get: function () { return config_js_1.saveConfig; } });
Object.defineProperty(exports, "loadProjectContext", { enumerable: true, get: function () { return config_js_1.loadProjectContext; } });
Object.defineProperty(exports, "getEnvConfig", { enumerable: true, get: function () { return config_js_1.getEnvConfig; } });
Object.defineProperty(exports, "getConfig", { enumerable: true, get: function () { return config_js_1.getConfig; } });
// Hooks
var hooks_js_1 = require("./hooks.js");
Object.defineProperty(exports, "onPromptSubmit", { enumerable: true, get: function () { return hooks_js_1.onPromptSubmit; } });
Object.defineProperty(exports, "onSessionStart", { enumerable: true, get: function () { return hooks_js_1.onSessionStart; } });
Object.defineProperty(exports, "onSessionEnd", { enumerable: true, get: function () { return hooks_js_1.onSessionEnd; } });
Object.defineProperty(exports, "installHooks", { enumerable: true, get: function () { return hooks_js_1.installHooks; } });
Object.defineProperty(exports, "uninstallHooks", { enumerable: true, get: function () { return hooks_js_1.uninstallHooks; } });
//# sourceMappingURL=index.js.map