/**
 * Command Center Plugin
 *
 * Core plugin functions for prompt enrichment and session tracking.
 */
import type { EnrichmentResult, SessionData, AnswerClarificationInput, PluginStatus, ClarificationQuestion } from './types.js';
/**
 * Command Center Plugin Client
 */
export declare class CommandCenterPlugin {
    private config;
    private projectRoot?;
    constructor(projectRoot?: string);
    /**
     * Check if the plugin is properly configured
     */
    isConfigured(): boolean;
    /**
     * Test connection to Command Center
     */
    testConnection(): Promise<PluginStatus>;
    /**
     * Enrich a user prompt with project context
     */
    enrichPrompt(userPrompt: string): Promise<EnrichmentResult>;
    /**
     * Submit answers to clarification questions
     */
    submitClarificationAnswers(input: AnswerClarificationInput): Promise<EnrichmentResult>;
    /**
     * Record a session to Command Center
     */
    recordSession(session: SessionData): Promise<void>;
    /**
     * Get project context from local files
     */
    getProjectContext(): import("./types.js").ProjectContext;
    /**
     * Offline enrichment fallback
     */
    private offlineEnrich;
    /**
     * Store session for later sync (offline mode)
     */
    private storeOfflineSession;
    /**
     * Fetch wrapper with auth and timeout
     */
    private fetch;
}
/**
 * Create a plugin instance
 */
export declare function createPlugin(projectRoot?: string): CommandCenterPlugin;
/**
 * Quick enrichment function for simple use cases
 */
export declare function enrichPrompt(userPrompt: string): Promise<EnrichmentResult>;
/**
 * Interactive enrichment with clarification handling
 */
export declare function interactiveEnrich(userPrompt: string, answerQuestion: (question: ClarificationQuestion) => Promise<string>): Promise<string>;
export default CommandCenterPlugin;
//# sourceMappingURL=plugin.d.ts.map