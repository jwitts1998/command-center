/**
 * Hook Integration for Command Center Plugin
 *
 * Provides functions for integrating with Claude Code hooks system.
 */
/**
 * Hook handler for prompt enrichment
 * Called before agent execution to enrich the user prompt
 */
export declare function onPromptSubmit(userPrompt: string): Promise<string>;
/**
 * Hook handler for session start
 * Called when an agent session starts
 */
export declare function onSessionStart(sessionInfo: {
    agentType?: string;
    taskId?: string;
    userPrompt?: string;
}): Promise<void>;
/**
 * Hook handler for session end
 * Called when an agent session completes
 */
export declare function onSessionEnd(sessionInfo: {
    agentType?: string;
    taskId?: string;
    userPrompt?: string;
    enrichedPrompt?: string;
    tokensInput?: number;
    tokensOutput?: number;
    modelUsed?: string;
    status: 'completed' | 'failed';
    metadata?: Record<string, unknown>;
}): Promise<void>;
/**
 * Install hooks into a project's .claude directory
 */
export declare function installHooks(projectRoot?: string): void;
/**
 * Uninstall hooks from a project
 */
export declare function uninstallHooks(projectRoot?: string): void;
//# sourceMappingURL=hooks.d.ts.map