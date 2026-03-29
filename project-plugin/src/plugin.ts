/**
 * Command Center Plugin
 *
 * Core plugin functions for prompt enrichment and session tracking.
 */

import { getConfig, loadProjectContext, isConfigured } from './config.js';
import type {
  PluginConfig,
  EnrichmentResult,
  SessionData,
  AnswerClarificationInput,
  PluginStatus,
  ClarificationQuestion,
  SuggestedPattern,
} from './types.js';

// API Response types
interface ProjectApiResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    status: string;
  };
  error?: string;
}

interface EnrichApiResponse {
  success: boolean;
  needs_clarification?: boolean;
  questions?: ClarificationQuestion[];
  session_id?: string;
  enriched_prompt?: string;
  context_applied?: string[];
  patterns_applied?: string[];
  estimated_cost?: { min_usd: number; max_usd: number };
  suggested_agents?: string[];
  suggested_patterns?: SuggestedPattern[];
  error?: string;
}

interface ClarificationApiResponse {
  success: boolean;
  data?: {
    enriched_prompt: string;
    context_applied?: string[];
    patterns_applied?: string[];
    estimated_cost?: { min_usd: number; max_usd: number };
    suggested_agents?: string[];
    suggested_patterns?: SuggestedPattern[];
  };
  error?: string;
}

/**
 * Command Center Plugin Client
 */
export class CommandCenterPlugin {
  private config: PluginConfig;
  private projectRoot?: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot;
    this.config = getConfig(projectRoot);
  }

  /**
   * Check if the plugin is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.projectId && this.config.commandCenterUrl);
  }

  /**
   * Test connection to Command Center
   */
  async testConnection(): Promise<PluginStatus> {
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

      const data = await response.json() as ProjectApiResponse;

      return {
        configured: true,
        connected: true,
        project: data.success && data.data ? {
          id: data.data.id,
          name: data.data.name,
          status: data.data.status,
        } : undefined,
      };
    } catch (error) {
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
  async enrichPrompt(userPrompt: string): Promise<EnrichmentResult> {
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

      const data = await response.json() as EnrichApiResponse;

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
    } catch (error) {
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
  async submitClarificationAnswers(input: AnswerClarificationInput): Promise<EnrichmentResult> {
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

    const data = await response.json() as ClarificationApiResponse;

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
  async recordSession(session: SessionData): Promise<void> {
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
    } catch (error) {
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
    return loadProjectContext(this.projectRoot);
  }

  /**
   * Offline enrichment fallback
   */
  private offlineEnrich(userPrompt: string): EnrichmentResult {
    const context = this.getProjectContext();

    // Build a basic enriched prompt with local context
    let enriched = userPrompt;

    if (Object.keys(context.techStack).length > 0) {
      enriched += '\n\n---\n**Project Context (Offline):**\n';

      for (const [category, items] of Object.entries(context.techStack)) {
        enriched += `- ${category}: ${(items as string[]).join(', ')}\n`;
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
  private storeOfflineSession(session: SessionData): void {
    // In a real implementation, this would store to a local file
    // that gets synced when connection is restored
    console.log('Stored session for later sync:', session.status);
  }

  /**
   * Fetch wrapper with auth and timeout
   */
  private async fetch(
    path: string,
    options: RequestInit = {}
  ): Promise<Response> {
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
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Create a plugin instance
 */
export function createPlugin(projectRoot?: string): CommandCenterPlugin {
  return new CommandCenterPlugin(projectRoot);
}

/**
 * Quick enrichment function for simple use cases
 */
export async function enrichPrompt(userPrompt: string): Promise<EnrichmentResult> {
  const plugin = createPlugin();
  return plugin.enrichPrompt(userPrompt);
}

/**
 * Interactive enrichment with clarification handling
 */
export async function interactiveEnrich(
  userPrompt: string,
  answerQuestion: (question: ClarificationQuestion) => Promise<string>
): Promise<string> {
  const plugin = createPlugin();

  let result = await plugin.enrichPrompt(userPrompt);

  // Handle clarification loop
  while (result.needsClarification && result.questions && result.sessionId) {
    const answers: Record<string, string> = {};

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
export default CommandCenterPlugin;
