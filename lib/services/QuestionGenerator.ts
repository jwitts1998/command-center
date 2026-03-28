import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { QuestionGenerationResultSchema, type QuestionGenerationResult } from '@/lib/ai/schemas';
import type { Ambiguity } from '@/types/clarification';

export class QuestionGenerator {
  private model = anthropic('claude-sonnet-4-20250514');

  /**
   * Generates clarification questions based on detected ambiguities
   */
  async generateQuestions(
    userPrompt: string,
    ambiguities: Ambiguity[],
    projectContext: {
      techStack?: Record<string, any>;
      patterns?: string[];
      recentSessions?: string[];
    }
  ): Promise<QuestionGenerationResult> {
    try {
      const prompt = this.buildQuestionGenerationPrompt(
        userPrompt,
        ambiguities,
        projectContext
      );

      const result = await generateObject({
        model: this.model,
        schema: QuestionGenerationResultSchema,
        prompt,
      });

      return result.object;
    } catch (error) {
      console.error('Error generating questions:', error);

      // Fallback: generate basic questions from ambiguities
      return {
        questions: ambiguities.slice(0, 4).map((amb, idx) => ({
          id: `q${idx + 1}`,
          question: `How should we handle: ${amb.description}?`,
          header: amb.type,
          options: [
            {
              value: 'default',
              label: 'Use default approach',
              description: 'Proceed with standard implementation',
              isRecommended: true,
            },
            {
              value: 'custom',
              label: 'Custom implementation',
              description: 'Specify custom approach',
            },
          ],
        })),
        total_questions: Math.min(ambiguities.length, 4),
        estimated_resolution_time: '2-3 minutes',
      };
    }
  }

  private buildQuestionGenerationPrompt(
    userPrompt: string,
    ambiguities: Ambiguity[],
    projectContext: Record<string, any>
  ): string {
    return `You are an expert AI assistant helping to generate clarification questions for software development tasks.

USER PROMPT:
${userPrompt}

DETECTED AMBIGUITIES:
${JSON.stringify(ambiguities, null, 2)}

PROJECT CONTEXT:
${JSON.stringify(projectContext, null, 2)}

Your job is to generate 1-4 multiple-choice questions that will help clarify the ambiguities.

QUESTION GUIDELINES:
1. Each question should address one specific ambiguity
2. Provide 2-4 clear, mutually exclusive options
3. Mark one option as recommended based on:
   - Project context (tech stack, existing patterns)
   - Common best practices
   - User's likely intent
4. Each option should have a clear label and description
5. Use concise headers (max 12 chars) for visual tagging

QUESTION STRUCTURE:
- id: Unique identifier (q1, q2, etc.)
- question: Clear, specific question (ends with ?)
- header: Short label (e.g., "Scope", "Library", "Approach")
- options: Array of 2-4 options
  - value: Machine-readable value
  - label: Human-readable label (1-5 words)
  - description: Explanation of this option
  - isRecommended: true for one option per question
- recommended: Value of the recommended option
- reasoning: Why this option is recommended

PRIORITY:
- Focus on high-impact ambiguities first
- Limit to 4 questions maximum
- Make questions actionable and specific
- Avoid asking about minor details that can be inferred

Generate clear, helpful questions that will enable effective prompt enrichment.`;
  }

  /**
   * Validates generated questions to ensure quality
   */
  validateQuestions(result: QuestionGenerationResult): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (result.questions.length === 0) {
      issues.push('No questions generated');
    }

    if (result.questions.length > 4) {
      issues.push('Too many questions (max 4)');
    }

    result.questions.forEach((q, idx) => {
      if (!q.question.endsWith('?')) {
        issues.push(`Question ${idx + 1} doesn't end with question mark`);
      }

      if (q.options.length < 2) {
        issues.push(`Question ${idx + 1} has fewer than 2 options`);
      }

      if (q.options.length > 4) {
        issues.push(`Question ${idx + 1} has more than 4 options`);
      }

      const recommendedCount = q.options.filter(o => o.isRecommended).length;
      if (recommendedCount !== 1) {
        issues.push(`Question ${idx + 1} should have exactly 1 recommended option`);
      }
    });

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Formats questions for display in UI
   */
  formatQuestionsForUI(result: QuestionGenerationResult) {
    return {
      ...result,
      questions: result.questions.map(q => ({
        ...q,
        options: q.options.map(opt => ({
          ...opt,
          displayLabel: opt.isRecommended ? `${opt.label} (Recommended)` : opt.label,
        })),
      })),
    };
  }
}

// Export singleton instance
export const questionGenerator = new QuestionGenerator();
