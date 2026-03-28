import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { AmbiguityDetectionResultSchema, type AmbiguityDetectionResult } from '@/lib/ai/schemas';
import { buildAmbiguityDetectionPrompt } from '@/lib/ai/prompts/ambiguity-detection';

export class AmbiguityDetector {
  private model = anthropic('claude-sonnet-4-20250514');

  /**
   * Analyzes a user prompt to detect ambiguities and missing context
   */
  async detectAmbiguities(
    userPrompt: string,
    projectContext: {
      techStack?: Record<string, any>;
      patterns?: string[];
      recentSessions?: string[];
    }
  ): Promise<AmbiguityDetectionResult> {
    try {
      const prompt = buildAmbiguityDetectionPrompt(userPrompt, projectContext);

      const result = await generateObject({
        model: this.model,
        schema: AmbiguityDetectionResultSchema,
        prompt,
      });

      return result.object;
    } catch (error) {
      console.error('Error detecting ambiguities:', error);

      // Fallback response if LLM fails
      return {
        has_ambiguities: false,
        ambiguities: [],
        overall_clarity_score: 0.7,
        needs_clarification: false,
        reasoning: 'Unable to analyze prompt due to an error. Proceeding without enrichment.',
      };
    }
  }

  /**
   * Quick check if a prompt likely needs clarification
   * Based on length, specificity, and common patterns
   */
  quickCheck(userPrompt: string): { likelyNeedsClarification: boolean; reason: string } {
    const trimmed = userPrompt.trim();

    // Very short prompts often need clarification
    if (trimmed.length < 20) {
      return {
        likelyNeedsClarification: true,
        reason: 'Prompt is very brief and likely missing context',
      };
    }

    // Check for vague action words without specifics
    const vaguePatterns = [
      /^(add|implement|create|build|make)\s+\w+\s*$/i,
      /^(fix|update|change|modify)\s+\w+\s*$/i,
    ];

    for (const pattern of vaguePatterns) {
      if (pattern.test(trimmed)) {
        return {
          likelyNeedsClarification: true,
          reason: 'Prompt uses vague action words without specifics',
        };
      }
    }

    // Prompts with detailed instructions likely don't need clarification
    if (trimmed.length > 200 && trimmed.includes(' and ') && trimmed.includes(' the ')) {
      return {
        likelyNeedsClarification: false,
        reason: 'Prompt is detailed with specific instructions',
      };
    }

    // Default: might need clarification, proceed with LLM analysis
    return {
      likelyNeedsClarification: true,
      reason: 'Prompt requires LLM analysis to determine ambiguities',
    };
  }

  /**
   * Filters ambiguities by impact to prioritize which ones to address
   */
  filterByImpact(
    ambiguities: AmbiguityDetectionResult['ambiguities'],
    minImpact: 'low' | 'medium' | 'high' = 'medium'
  ): AmbiguityDetectionResult['ambiguities'] {
    const impactOrder = { low: 0, medium: 1, high: 2 };
    const threshold = impactOrder[minImpact];

    return ambiguities.filter(
      (amb) => impactOrder[amb.impact] >= threshold
    );
  }

  /**
   * Filters ambiguities by confidence to avoid false positives
   */
  filterByConfidence(
    ambiguities: AmbiguityDetectionResult['ambiguities'],
    minConfidence: number = 0.6
  ): AmbiguityDetectionResult['ambiguities'] {
    return ambiguities.filter((amb) => amb.confidence >= minConfidence);
  }
}

// Export singleton instance
export const ambiguityDetector = new AmbiguityDetector();
