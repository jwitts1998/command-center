/**
 * PatternApplicator Service
 *
 * Matches and applies learned patterns to projects and prompts.
 * Handles pattern suggestion, auto-application, and user approval flow.
 */

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { query, queryOne } from '@/lib/db/client';
import { patternDetector } from './PatternDetector';

const PatternApplicationSchema = z.object({
  applicablePatterns: z.array(
    z.object({
      patternId: z.string(),
      relevance: z.number().min(0).max(1).describe('How relevant this pattern is to the current context'),
      suggestion: z.string().describe('How to apply this pattern to the current prompt'),
      priority: z.enum(['high', 'medium', 'low']),
    })
  ),
  contextEnhancements: z.array(
    z.object({
      type: z.string(),
      content: z.string().describe('Context to add to the prompt based on patterns'),
    })
  ),
});

interface ApplicablePattern {
  patternId: string;
  patternName: string;
  patternType: string;
  relevance: number;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  autoApply: boolean;
  confidence: number;
}

interface PatternApplicationResult {
  applicablePatterns: ApplicablePattern[];
  autoAppliedPatterns: ApplicablePattern[];
  suggestedPatterns: ApplicablePattern[];
  contextEnhancements: Array<{ type: string; content: string }>;
}

interface StoredPattern {
  id: string;
  pattern_type: string;
  name: string;
  description: string;
  pattern_data: any;
  applicable_to: any;
  confidence: number;
  auto_apply: boolean;
  times_applied: number;
  times_rejected: number;
}

export class PatternApplicator {
  private model = anthropic('claude-sonnet-4-20250514');

  /**
   * Find and rank applicable patterns for a project and prompt
   */
  async findApplicablePatterns(
    projectId: string,
    userPrompt: string
  ): Promise<PatternApplicationResult> {
    // Get project context
    const project = await queryOne<{
      name: string;
      tech_stack: any;
    }>(
      `SELECT name, tech_stack FROM projects WHERE id = $1`,
      [projectId]
    );

    // Get all high-confidence patterns
    const patterns = await query<StoredPattern>(
      `SELECT * FROM patterns
       WHERE confidence > 0.5
       ORDER BY confidence DESC, times_applied DESC
       LIMIT 20`
    );

    if (patterns.length === 0) {
      return {
        applicablePatterns: [],
        autoAppliedPatterns: [],
        suggestedPatterns: [],
        contextEnhancements: [],
      };
    }

    // Use LLM to determine which patterns apply
    const { object: result } = await generateObject({
      model: this.model,
      schema: PatternApplicationSchema,
      prompt: `Analyze which learned patterns apply to this project and prompt.

Project: ${project?.name}
Tech Stack: ${JSON.stringify(project?.tech_stack || {})}

User Prompt: "${userPrompt}"

Available Patterns:
${JSON.stringify(
  patterns.map((p) => ({
    id: p.id,
    type: p.pattern_type,
    name: p.name,
    description: p.description,
    applicableTo: p.applicable_to,
    confidence: p.confidence,
    autoApply: p.auto_apply,
    timesApplied: p.times_applied,
    timesRejected: p.times_rejected,
  })),
  null,
  2
)}

For each relevant pattern:
1. Assess relevance (0-1) to the current prompt and project
2. Provide specific suggestion on how to apply it
3. Prioritize based on importance (high/medium/low)

Also generate context enhancements - additional context to add to the prompt based on patterns.

Only include patterns with relevance > 0.3.
Priority should be:
- high: Pattern directly addresses part of the prompt
- medium: Pattern provides useful context
- low: Pattern is generally applicable`,
    });

    // Map results back to full pattern data
    const applicablePatterns: ApplicablePattern[] = result.applicablePatterns
      .map((ap) => {
        const pattern = patterns.find((p) => p.id === ap.patternId);
        if (!pattern) return null;

        return {
          patternId: ap.patternId,
          patternName: pattern.name,
          patternType: pattern.pattern_type,
          relevance: ap.relevance,
          suggestion: ap.suggestion,
          priority: ap.priority,
          autoApply: pattern.auto_apply,
          confidence: Number(pattern.confidence),
        };
      })
      .filter((p): p is ApplicablePattern => p !== null)
      .sort((a, b) => b.relevance - a.relevance);

    // Separate auto-apply from suggested
    const autoAppliedPatterns = applicablePatterns.filter(
      (p) => p.autoApply && p.confidence > 0.7 && p.relevance > 0.5
    );
    const suggestedPatterns = applicablePatterns.filter(
      (p) => !p.autoApply || p.confidence <= 0.7 || p.relevance <= 0.5
    );

    return {
      applicablePatterns,
      autoAppliedPatterns,
      suggestedPatterns,
      contextEnhancements: result.contextEnhancements,
    };
  }

  /**
   * Apply patterns to enhance a prompt
   */
  async applyPatternsToPrompt(
    userPrompt: string,
    patterns: ApplicablePattern[],
    contextEnhancements: Array<{ type: string; content: string }>
  ): Promise<string> {
    if (patterns.length === 0 && contextEnhancements.length === 0) {
      return userPrompt;
    }

    const patternContext = patterns
      .map((p) => `- ${p.patternName}: ${p.suggestion}`)
      .join('\n');

    const enhancementContext = contextEnhancements
      .map((e) => `- ${e.type}: ${e.content}`)
      .join('\n');

    return `${userPrompt}

---
**Applied Patterns:**
${patternContext || 'None'}

**Context from Learned Patterns:**
${enhancementContext || 'None'}`;
  }

  /**
   * Accept or reject a pattern suggestion
   */
  async respondToSuggestion(
    patternId: string,
    accepted: boolean,
    projectId?: string
  ): Promise<void> {
    await patternDetector.recordPatternApplication(patternId, accepted);

    // If rejected, potentially adjust auto-apply
    if (!accepted) {
      const pattern = await queryOne<{
        times_rejected: number;
        times_applied: number;
        auto_apply: boolean;
      }>(
        `SELECT times_rejected, times_applied, auto_apply FROM patterns WHERE id = $1`,
        [patternId]
      );

      if (pattern) {
        const total = Number(pattern.times_applied) + Number(pattern.times_rejected);
        const rejectionRate = Number(pattern.times_rejected) / Math.max(total, 1);

        // If rejection rate > 30%, disable auto-apply
        if (rejectionRate > 0.3 && pattern.auto_apply) {
          await query(
            `UPDATE patterns SET auto_apply = false WHERE id = $1`,
            [patternId]
          );
        }
      }
    }
  }

  /**
   * Get pattern suggestions for the patterns page
   */
  async getPatternSuggestions(projectId: string): Promise<ApplicablePattern[]> {
    // Get recent prompts to understand common patterns
    const recentPrompts = await query<{ user_prompt: string }>(
      `SELECT user_prompt FROM agent_sessions
       WHERE project_id = $1 AND user_prompt IS NOT NULL
       ORDER BY started_at DESC
       LIMIT 5`,
      [projectId]
    );

    if (recentPrompts.length === 0) {
      return [];
    }

    // Get patterns that haven't been applied to this project
    const patterns = await query<StoredPattern>(
      `SELECT p.* FROM patterns p
       WHERE p.confidence > 0.5
         AND NOT ($1 = ANY(p.source_projects))
       ORDER BY p.confidence DESC, p.times_applied DESC
       LIMIT 10`,
      [projectId]
    );

    if (patterns.length === 0) {
      return [];
    }

    // Check which patterns would apply to recent prompts
    const combinedPrompt = recentPrompts.map((p) => p.user_prompt).join('\n');
    const result = await this.findApplicablePatterns(projectId, combinedPrompt);

    return result.suggestedPatterns;
  }

  /**
   * Train patterns from a completed session
   */
  async trainFromSession(
    sessionId: string,
    userFeedback?: 'positive' | 'negative'
  ): Promise<void> {
    const session = await queryOne<{
      project_id: string;
      user_prompt: string;
      enriched_prompt: string;
      metadata: any;
    }>(
      `SELECT project_id, user_prompt, enriched_prompt, metadata
       FROM agent_sessions
       WHERE id = $1`,
      [sessionId]
    );

    if (!session || !session.user_prompt) {
      return;
    }

    // If positive feedback and we detected patterns, boost their confidence
    if (userFeedback === 'positive' && session.metadata?.appliedPatterns) {
      for (const patternId of session.metadata.appliedPatterns) {
        await query(
          `UPDATE patterns
           SET confidence = LEAST(confidence + 0.05, 1.0),
               times_applied = times_applied + 1
           WHERE id = $1`,
          [patternId]
        );
      }
    }

    // If negative feedback, reduce confidence
    if (userFeedback === 'negative' && session.metadata?.appliedPatterns) {
      for (const patternId of session.metadata.appliedPatterns) {
        await query(
          `UPDATE patterns
           SET confidence = GREATEST(confidence - 0.1, 0),
               times_rejected = times_rejected + 1
           WHERE id = $1`,
          [patternId]
        );
      }
    }

    // Trigger pattern detection for this project
    const patterns = await patternDetector.detectPatternsFromSessions(session.project_id);
    if (patterns.length > 0) {
      await patternDetector.storePatterns(patterns, [session.project_id]);
    }
  }
}

export const patternApplicator = new PatternApplicator();
