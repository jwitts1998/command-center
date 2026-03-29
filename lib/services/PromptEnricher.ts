import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { EnrichedPromptResultSchema, type EnrichedPromptResult } from '@/lib/ai/schemas';
import { buildEnrichmentPrompt } from '@/lib/ai/prompts/enrichment';
import { ambiguityDetector } from './AmbiguityDetector';
import { questionGenerator } from './QuestionGenerator';
import { contextBuilder, type ProjectContext } from './ContextBuilder';
import { patternApplicator } from './PatternApplicator';
import type { ClarificationQuestion, EnrichmentResult, SuggestedPattern } from '@/types/clarification';

export interface EnrichmentRequest {
  projectId: string;
  userPrompt: string;
  skipClarification?: boolean;
}

export interface EnrichmentResponse {
  needsClarification: boolean;
  questions?: ClarificationQuestion[];
  enrichedPrompt?: string;
  contextApplied?: string[];
  patternsApplied?: string[];
  estimatedCost?: { min_usd: number; max_usd: number };
  suggestedAgents?: string[];
  suggestedPatterns?: SuggestedPattern[];
  sessionId?: string;
}

export class PromptEnricher {
  private model = anthropic('claude-sonnet-4-20250514');

  /**
   * Main enrichment workflow
   * 1. Detect ambiguities
   * 2. Generate questions if needed
   * 3. OR skip to enrichment if clear
   */
  async enrichPrompt(request: EnrichmentRequest): Promise<EnrichmentResponse> {
    try {
      // Build project context
      const context = await contextBuilder.buildContext(request.projectId);

      // Quick check first (saves API costs)
      if (!request.skipClarification) {
        const quickCheck = ambiguityDetector.quickCheck(request.userPrompt);

        if (!quickCheck.likelyNeedsClarification) {
          // Prompt is clear, skip ambiguity detection
          return await this.directEnrichment(request.userPrompt, context, {});
        }
      }

      // Detailed ambiguity detection
      if (!request.skipClarification) {
        const ambiguities = await ambiguityDetector.detectAmbiguities(
          request.userPrompt,
          {
            techStack: context.techStack,
            patterns: context.patterns.map(p => p.name),
            recentSessions: context.recentSessions.map(s => s.user_prompt),
          }
        );

        // Filter to high-confidence, medium+ impact ambiguities
        const significantAmbiguities = ambiguityDetector.filterByConfidence(
          ambiguityDetector.filterByImpact(ambiguities.ambiguities, 'medium'),
          0.6
        );

        if (ambiguities.needs_clarification && significantAmbiguities.length > 0) {
          // Generate clarification questions
          const questionResult = await questionGenerator.generateQuestions(
            request.userPrompt,
            significantAmbiguities,
            {
              techStack: context.techStack,
              patterns: context.patterns.map(p => p.name),
            }
          );

          return {
            needsClarification: true,
            questions: questionResult.questions,
          };
        }
      }

      // No significant ambiguities, proceed with enrichment
      return await this.directEnrichment(request.userPrompt, context, {});
    } catch (error) {
      console.error('Error in enrichment workflow:', error);
      throw error;
    }
  }

  /**
   * Enriches a prompt after clarification questions are answered
   */
  async enrichWithAnswers(
    projectId: string,
    userPrompt: string,
    answers: Record<string, string>
  ): Promise<EnrichmentResult> {
    const context = await contextBuilder.buildContext(projectId);
    return await this.directEnrichment(userPrompt, context, answers);
  }

  /**
   * Direct enrichment without clarification
   */
  private async directEnrichment(
    userPrompt: string,
    context: ProjectContext,
    answers: Record<string, string>
  ): Promise<EnrichmentResult> {
    try {
      // Find applicable patterns using PatternApplicator
      const patternResult = await patternApplicator.findApplicablePatterns(
        context.project.id,
        userPrompt
      );

      // Apply auto-applied patterns to the prompt
      let enhancedPrompt = userPrompt;
      const appliedPatternNames: string[] = [];

      if (patternResult.autoAppliedPatterns.length > 0 || patternResult.contextEnhancements.length > 0) {
        enhancedPrompt = await patternApplicator.applyPatternsToPrompt(
          userPrompt,
          patternResult.autoAppliedPatterns,
          patternResult.contextEnhancements
        );
        appliedPatternNames.push(
          ...patternResult.autoAppliedPatterns.map(p => p.patternName)
        );
      }

      const prompt = buildEnrichmentPrompt(
        enhancedPrompt,
        answers,
        {
          techStack: context.techStack,
          patterns: context.patterns.map(p => p.description),
          preferences: context.userPreferences,
          recentSessions: context.recentSessions.map(s => s.user_prompt),
        }
      );

      const result = await generateObject({
        model: this.model,
        schema: EnrichedPromptResultSchema,
        prompt,
      });

      // Map suggested patterns to response format
      const suggestedPatterns: SuggestedPattern[] = patternResult.suggestedPatterns.map(p => ({
        patternId: p.patternId,
        patternName: p.patternName,
        patternType: p.patternType,
        relevance: p.relevance,
        suggestion: p.suggestion,
        priority: p.priority,
        confidence: p.confidence,
      }));

      return {
        enrichedPrompt: result.object.enriched_prompt,
        contextApplied: result.object.context_applied,
        patternsApplied: [...result.object.patterns_applied, ...appliedPatternNames],
        estimatedCost: result.object.estimated_cost_range,
        suggestedAgents: result.object.suggested_agents,
        suggestedPatterns: suggestedPatterns.length > 0 ? suggestedPatterns : undefined,
        needsClarification: false,
      };
    } catch (error) {
      console.error('Error in direct enrichment:', error);

      // Fallback: basic enrichment without LLM
      return {
        enrichedPrompt: this.buildFallbackEnrichment(userPrompt, context, answers),
        contextApplied: ['Tech Stack', 'Project Context'],
        patternsApplied: [],
        needsClarification: false,
      };
    }
  }

  /**
   * Builds a basic enriched prompt without LLM (fallback)
   */
  private buildFallbackEnrichment(
    userPrompt: string,
    context: ProjectContext,
    answers: Record<string, string>
  ): string {
    let enriched = `${userPrompt}\n\nProject Context:\n`;

    // Add tech stack
    const techStackItems = Object.entries(context.techStack)
      .map(([category, items]) => `${category}: ${(items as string[]).join(', ')}`)
      .join('\n');

    if (techStackItems) {
      enriched += `Tech Stack:\n${techStackItems}\n\n`;
    }

    // Add answers
    if (Object.keys(answers).length > 0) {
      enriched += `\nClarifications:\n`;
      Object.entries(answers).forEach(([key, value]) => {
        enriched += `- ${key}: ${value}\n`;
      });
    }

    // Add top patterns
    if (context.patterns.length > 0) {
      enriched += `\nRelevant Patterns:\n`;
      context.patterns.slice(0, 3).forEach(p => {
        enriched += `- ${p.name}: ${p.description}\n`;
      });
    }

    return enriched;
  }

  /**
   * Estimates the cost of enrichment (in tokens and USD)
   */
  estimateCost(userPrompt: string, contextSize: number): {
    estimatedTokens: number;
    estimatedCostUSD: number;
  } {
    // Rough estimation: 1 token ≈ 4 characters
    const promptTokens = Math.ceil(userPrompt.length / 4);
    const contextTokens = Math.ceil(contextSize / 4);
    const outputTokens = 500; // Estimated enriched prompt size

    const totalTokens = promptTokens + contextTokens + outputTokens;

    // Claude Sonnet 4 pricing (approximate)
    const inputCostPer1kTokens = 0.003; // $3 per 1M tokens
    const outputCostPer1kTokens = 0.015; // $15 per 1M tokens

    const inputCost = (promptTokens + contextTokens) * inputCostPer1kTokens / 1000;
    const outputCost = outputTokens * outputCostPer1kTokens / 1000;

    return {
      estimatedTokens: totalTokens,
      estimatedCostUSD: inputCost + outputCost,
    };
  }
}

// Export singleton instance
export const promptEnricher = new PromptEnricher();
