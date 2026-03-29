"use strict";
/**
 * Command Center Plugin
 *
 * Core plugin functions for prompt enrichment and session tracking.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandCenterPlugin = void 0;
exports.createPlugin = createPlugin;
exports.enrichPrompt = enrichPrompt;
exports.interactiveEnrich = interactiveEnrich;
const config_js_1 = require("./config.js");
/**
 * Command Center Plugin Client
 */
class CommandCenterPlugin {
    config;
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.config = (0, config_js_1.getConfig)(projectRoot);
    }
    /**
     * Check if the plugin is properly configured
     */
    isConfigured() {
        return !!(this.config.apiKey && this.config.projectId && this.config.commandCenterUrl);
    }
    /**
     * Test connection to Command Center
     */
    async testConnection() {
        if (!this.isConfigured()) {
            return {
                configured: false,
                connected: false,
                error: 'Plugin not configured. Run: cc-plugin setup',
            };
        }
        try {
            const response = await this.fetch(`/api/projects/${this.config.projectId}`, {
                method: 'GET',
            });
            if (!response.ok) {
                return {
                    configured: true,
                    connected: false,
                    error: `API error: ${response.status}`,
                };
            }
            const data = await response.json();
            return {
                configured: true,
                connected: true,
                project: data.success && data.data ? {
                    id: data.data.id,
                    name: data.data.name,
                    status: data.data.status,
                } : undefined,
            };
        }
        catch (error) {
            return {
                configured: true,
                connected: false,
                error: error instanceof Error ? error.message : 'Connection failed',
            };
        }
    }
    /**
     * Enrich a user prompt with project context
     */
    async enrichPrompt(userPrompt) {
        if (!this.isConfigured()) {
            // Offline mode: return original prompt
            if (this.config.offlineMode) {
                return {
                    needsClarification: false,
                    enrichedPrompt: userPrompt,
                    contextApplied: ['Offline mode - no enrichment'],
                    patternsApplied: [],
                };
            }
            throw new Error('Plugin not configured. Run: cc-plugin setup');
        }
        try {
            const response = await this.fetch('/api/enrich-prompt', {
                method: 'POST',
                body: JSON.stringify({
                    project_id: this.config.projectId,
                    user_prompt: userPrompt,
                    skip_clarification: this.config.skipClarification,
                }),
            });
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Enrichment failed');
            }
            if (data.needs_clarification) {
                return {
                    needsClarification: true,
                    questions: data.questions,
                    sessionId: data.session_id,
                };
            }
            return {
                needsClarification: false,
                enrichedPrompt: data.enriched_prompt,
                contextApplied: data.context_applied || [],
                patternsApplied: data.patterns_applied || [],
                estimatedCost: data.estimated_cost,
                suggestedAgents: data.suggested_agents || [],
                suggestedPatterns: data.suggested_patterns || [],
            };
        }
        catch (error) {
            // Offline fallback
            if (this.config.offlineMode) {
                console.warn('Command Center unreachable, using offline mode');
                return this.offlineEnrich(userPrompt);
            }
            throw error;
        }
    }
    /**
     * Submit answers to clarification questions
     */
    async submitClarificationAnswers(input) {
        if (!this.isConfigured()) {
            throw new Error('Plugin not configured');
        }
        const response = await this.fetch('/api/clarifications', {
            method: 'POST',
            body: JSON.stringify({
                session_id: input.sessionId,
                answers: input.answers,
            }),
        });
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        if (!data.success || !data.data) {
            throw new Error(data.error || 'Failed to submit answers');
        }
        return {
            needsClarification: false,
            enrichedPrompt: data.data.enriched_prompt,
            contextApplied: data.data.context_applied || [],
            patternsApplied: data.data.patterns_applied || [],
            estimatedCost: data.data.estimated_cost,
            suggestedAgents: data.data.suggested_agents || [],
            suggestedPatterns: data.data.suggested_patterns || [],
        };
    }
    /**
     * Record a session to Command Center
     */
    async recordSession(session) {
        if (!this.isConfigured()) {
            if (this.config.offlineMode) {
                // Store locally for later sync
                this.storeOfflineSession(session);
                return;
            }
            throw new Error('Plugin not configured');
        }
        try {
            const response = await this.fetch('/api/sessions', {
                method: 'POST',
                body: JSON.stringify({
                    project_id: this.config.projectId,
                    ...session,
                }),
            });
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
        }
        catch (error) {
            if (this.config.offlineMode) {
                this.storeOfflineSession(session);
                return;
            }
            throw error;
        }
    }
    /**
     * Get project context from local files
     */
    getProjectContext() {
        return (0, config_js_1.loadProjectContext)(this.projectRoot);
    }
    /**
     * Offline enrichment fallback
     */
    offlineEnrich(userPrompt) {
        const context = this.getProjectContext();
        // Build a basic enriched prompt with local context
        let enriched = userPrompt;
        if (Object.keys(context.techStack).length > 0) {
            enriched += '\n\n---\n**Project Context (Offline):**\n';
            for (const [category, items] of Object.entries(context.techStack)) {
                enriched += `- ${category}: ${items.join(', ')}\n`;
            }
        }
        return {
            needsClarification: false,
            enrichedPrompt: enriched,
            contextApplied: ['Local project context (offline)'],
            patternsApplied: [],
        };
    }
    /**
     * Store session for later sync (offline mode)
     */
    storeOfflineSession(session) {
        // In a real implementation, this would store to a local file
        // that gets synced when connection is restored
        console.log('Stored session for later sync:', session.status);
    }
    /**
     * Fetch wrapper with auth and timeout
     */
    async fetch(path, options = {}) {
        const url = `${this.config.commandCenterUrl}${path}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeout);
        try {
            return await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    ...options.headers,
                },
            });
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
exports.CommandCenterPlugin = CommandCenterPlugin;
/**
 * Create a plugin instance
 */
function createPlugin(projectRoot) {
    return new CommandCenterPlugin(projectRoot);
}
/**
 * Quick enrichment function for simple use cases
 */
async function enrichPrompt(userPrompt) {
    const plugin = createPlugin();
    return plugin.enrichPrompt(userPrompt);
}
/**
 * Interactive enrichment with clarification handling
 */
async function interactiveEnrich(userPrompt, answerQuestion) {
    const plugin = createPlugin();
    let result = await plugin.enrichPrompt(userPrompt);
    // Handle clarification loop
    while (result.needsClarification && result.questions && result.sessionId) {
        const answers = {};
        for (const question of result.questions) {
            const answer = await answerQuestion(question);
            answers[question.id] = answer;
        }
        result = await plugin.submitClarificationAnswers({
            sessionId: result.sessionId,
            answers,
        });
    }
    return result.enrichedPrompt || userPrompt;
}
// Default export
exports.default = CommandCenterPlugin;
//# sourceMappingURL=plugin.js.map