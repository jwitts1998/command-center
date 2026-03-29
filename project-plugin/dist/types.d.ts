/**
 * Command Center Plugin Types
 */
export interface PluginConfig {
    /** Command Center API URL */
    commandCenterUrl: string;
    /** API key for authentication */
    apiKey: string;
    /** Project ID in Command Center */
    projectId: string;
    /** Whether to auto-enrich prompts */
    autoEnrich: boolean;
    /** Skip clarification and always direct enrich */
    skipClarification: boolean;
    /** Timeout for API calls in ms */
    timeout: number;
    /** Enable offline mode (graceful degradation) */
    offlineMode: boolean;
}
export interface ProjectContext {
    /** Project name */
    name: string;
    /** Project description */
    description?: string;
    /** Tech stack information */
    techStack: Record<string, string[]>;
    /** Repository path */
    repoPath: string;
}
export interface ClarificationQuestion {
    id: string;
    question: string;
    header: string;
    options: {
        value: string;
        label: string;
        description: string;
        isRecommended?: boolean;
    }[];
    recommended?: string;
    reasoning?: string;
}
export interface SuggestedPattern {
    patternId: string;
    patternName: string;
    patternType: string;
    relevance: number;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
    confidence: number;
}
export interface EnrichmentResult {
    /** Whether clarification is needed */
    needsClarification: boolean;
    /** Clarification questions if needed */
    questions?: ClarificationQuestion[];
    /** Session ID for clarification flow */
    sessionId?: string;
    /** Enriched prompt if no clarification needed */
    enrichedPrompt?: string;
    /** Context that was applied */
    contextApplied?: string[];
    /** Patterns that were applied */
    patternsApplied?: string[];
    /** Estimated cost range */
    estimatedCost?: {
        min_usd: number;
        max_usd: number;
    };
    /** Suggested agents for execution */
    suggestedAgents?: string[];
    /** Suggested patterns for user to consider */
    suggestedPatterns?: SuggestedPattern[];
}
export interface SessionData {
    /** Project ID */
    projectId: string;
    /** Agent type used */
    agentType?: string;
    /** Task ID if applicable */
    taskId?: string;
    /** Session status */
    status: 'started' | 'completed' | 'failed';
    /** Original user prompt */
    userPrompt?: string;
    /** Enriched prompt */
    enrichedPrompt?: string;
    /** Input tokens used */
    tokensInput?: number;
    /** Output tokens used */
    tokensOutput?: number;
    /** Model used */
    modelUsed?: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
export interface AnswerClarificationInput {
    /** Session ID from enrichment */
    sessionId: string;
    /** Answers to clarification questions */
    answers: Record<string, string>;
}
export interface PluginStatus {
    /** Whether plugin is configured */
    configured: boolean;
    /** Whether Command Center is reachable */
    connected: boolean;
    /** Project info from Command Center */
    project?: {
        id: string;
        name: string;
        status: string;
    };
    /** Error message if any */
    error?: string;
}
//# sourceMappingURL=types.d.ts.map