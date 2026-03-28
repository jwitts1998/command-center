/**
 * PatternDetector Service
 *
 * Analyzes project sessions and context to detect reusable patterns.
 * Patterns are learned from:
 * - User clarification preferences
 * - Tech stack choices
 * - Common architecture decisions
 * - Code style patterns
 */

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { query, queryOne } from '@/lib/db/client';

const DetectedPatternsSchema = z.object({
  patterns: z.array(
    z.object({
      type: z.enum([
        'clarification_preference',
        'tech_stack',
        'architecture',
        'code_style',
        'workflow',
      ]),
      name: z.string().describe('Short descriptive name for the pattern'),
      description: z.string().describe('Detailed description of what this pattern represents'),
      confidence: z.number().min(0).max(1).describe('Confidence score 0-1'),
      evidence: z.array(z.string()).describe('Evidence that supports this pattern'),
      applicableTo: z.object({
        techStacks: z.array(z.string()).optional(),
        projectTypes: z.array(z.string()).optional(),
        conditions: z.array(z.string()).optional(),
      }),
      autoApply: z.boolean().describe('Whether this pattern should be auto-applied'),
      riskLevel: z.enum(['low', 'medium', 'high']).describe('Risk level of applying this pattern'),
    })
  ),
});

type DetectedPatterns = z.infer<typeof DetectedPatternsSchema>;
type PatternType = DetectedPatterns['patterns'][number]['type'];

interface PatternData {
  type: PatternType;
  name: string;
  description: string;
  confidence: number;
  evidence: string[];
  applicableTo: {
    techStacks?: string[];
    projectTypes?: string[];
    conditions?: string[];
  };
  autoApply: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

interface StoredPattern {
  id: string;
  patternType: string;
  name: string;
  description: string;
  patternData: any;
  sourceProjects: string[];
  applicableTo: any;
  confidence: number;
  autoApply: boolean;
  timesApplied: number;
  timesRejected: number;
  createdAt: string;
  updatedAt: string;
}

export class PatternDetector {
  private model = anthropic('claude-sonnet-4-20250514');

  /**
   * Detect patterns from a project's session history
   */
  async detectPatternsFromSessions(projectId: string): Promise<PatternData[]> {
    // Get recent sessions with clarification data
    const sessions = await query<{
      id: string;
      user_prompt: string;
      enriched_prompt: string;
      metadata: any;
    }>(
      `SELECT s.id, s.user_prompt, s.enriched_prompt, s.metadata
       FROM agent_sessions s
       WHERE s.project_id = $1
         AND s.user_prompt IS NOT NULL
         AND s.enriched_prompt IS NOT NULL
       ORDER BY s.started_at DESC
       LIMIT 50`,
      [projectId]
    );

    if (sessions.length < 3) {
      return []; // Not enough data for pattern detection
    }

    // Get clarification sessions
    const clarifications = await query<{
      user_prompt: string;
      questions: any;
      answers: any;
    }>(
      `SELECT user_prompt, questions, answers
       FROM clarification_sessions
       WHERE project_id = $1
         AND status = 'completed'
       ORDER BY created_at DESC
       LIMIT 30`,
      [projectId]
    );

    // Get project context
    const project = await queryOne<{
      name: string;
      tech_stack: any;
    }>(
      `SELECT name, tech_stack FROM projects WHERE id = $1`,
      [projectId]
    );

    const sessionSummary = sessions.map((s) => ({
      prompt: s.user_prompt,
      enriched: s.enriched_prompt?.substring(0, 500),
    }));

    const clarificationSummary = clarifications.map((c) => ({
      prompt: c.user_prompt,
      questions: c.questions,
      answers: c.answers,
    }));

    const { object: result } = await generateObject({
      model: this.model,
      schema: DetectedPatternsSchema,
      prompt: `Analyze this project's session and clarification history to detect reusable patterns.

Project: ${project?.name}
Tech Stack: ${JSON.stringify(project?.tech_stack || {})}

Recent Sessions (${sessions.length} total):
${JSON.stringify(sessionSummary.slice(0, 10), null, 2)}

Clarification History (${clarifications.length} total):
${JSON.stringify(clarificationSummary.slice(0, 10), null, 2)}

Detect patterns in:
1. **Clarification Preferences**: How the user typically answers clarification questions
   - Do they prefer certain tech choices?
   - Do they have consistent scope preferences?
   - What are their testing preferences?

2. **Tech Stack Patterns**: Consistent technology choices
   - Preferred libraries and frameworks
   - Styling approaches (Tailwind, CSS modules, etc.)
   - State management choices

3. **Architecture Patterns**: Common architectural decisions
   - File organization preferences
   - Component structure patterns
   - API design patterns

4. **Code Style Patterns**: Consistent coding style
   - Naming conventions
   - Comment style
   - Documentation patterns

5. **Workflow Patterns**: Development workflow preferences
   - Testing requirements
   - Review preferences
   - Deployment considerations

Only return patterns with:
- At least 2-3 pieces of evidence
- Confidence > 0.5 (50%)
- Clear applicability conditions

Set autoApply=true only for low-risk patterns (naming, formatting).
Set autoApply=false for medium/high risk patterns (architecture, features).`,
    });

    return result.patterns.map((p) => ({
      type: p.type,
      name: p.name,
      description: p.description,
      confidence: p.confidence,
      evidence: p.evidence,
      applicableTo: p.applicableTo,
      autoApply: p.autoApply,
      riskLevel: p.riskLevel,
    }));
  }

  /**
   * Detect cross-project patterns
   */
  async detectCrossProjectPatterns(): Promise<PatternData[]> {
    // Get all projects with their tech stacks
    const projects = await query<{
      id: string;
      name: string;
      tech_stack: any;
    }>(
      `SELECT id, name, tech_stack FROM projects WHERE status = 'active'`
    );

    if (projects.length < 2) {
      return []; // Need at least 2 projects
    }

    // Get all user preferences
    const preferences = await query<{
      preference_type: string;
      key: string;
      value: any;
      confidence: number;
    }>(
      `SELECT preference_type, key, value, confidence
       FROM user_preferences
       WHERE confidence > 0.5
       ORDER BY confidence DESC
       LIMIT 50`
    );

    const { object: result } = await generateObject({
      model: this.model,
      schema: DetectedPatternsSchema,
      prompt: `Analyze patterns across multiple projects to find cross-project patterns.

Projects:
${JSON.stringify(projects.map((p) => ({ name: p.name, techStack: p.tech_stack })), null, 2)}

User Preferences (learned):
${JSON.stringify(preferences, null, 2)}

Identify patterns that:
1. Apply across multiple projects
2. Are consistent user preferences
3. Could be auto-applied to new projects

Focus on:
- Technology choices that work well together
- Preferences that indicate user style
- Patterns that reduce clarification questions

Set autoApply=true only for patterns with confidence > 0.8 and low risk.`,
    });

    return result.patterns.map((p) => ({
      type: p.type,
      name: p.name,
      description: p.description,
      confidence: p.confidence,
      evidence: p.evidence,
      applicableTo: p.applicableTo,
      autoApply: p.autoApply,
      riskLevel: p.riskLevel,
    }));
  }

  /**
   * Store detected patterns in the database
   */
  async storePatterns(
    patterns: PatternData[],
    sourceProjectIds: string[]
  ): Promise<StoredPattern[]> {
    const stored: StoredPattern[] = [];

    for (const pattern of patterns) {
      // Check if similar pattern exists
      const existing = await queryOne<{ id: string; confidence: number }>(
        `SELECT id, confidence FROM patterns
         WHERE pattern_type = $1 AND name = $2`,
        [pattern.type, pattern.name]
      );

      if (existing) {
        // Update existing pattern if new confidence is higher
        if (pattern.confidence > Number(existing.confidence)) {
          await query(
            `UPDATE patterns
             SET confidence = $1,
                 pattern_data = $2,
                 source_projects = array_cat(source_projects, $3::uuid[]),
                 updated_at = NOW()
             WHERE id = $4`,
            [
              pattern.confidence,
              JSON.stringify(pattern),
              sourceProjectIds,
              existing.id,
            ]
          );
        }
      } else {
        // Insert new pattern
        const result = await query<StoredPattern>(
          `INSERT INTO patterns (
            pattern_type, name, description, pattern_data,
            source_projects, applicable_to, confidence, auto_apply
          ) VALUES ($1, $2, $3, $4, $5::uuid[], $6, $7, $8)
          RETURNING *`,
          [
            pattern.type,
            pattern.name,
            pattern.description,
            JSON.stringify(pattern),
            sourceProjectIds,
            JSON.stringify(pattern.applicableTo),
            pattern.confidence,
            pattern.autoApply,
          ]
        );

        if (result.length > 0) {
          stored.push(result[0]);
        }
      }
    }

    return stored;
  }

  /**
   * Get all stored patterns
   */
  async getPatterns(options?: {
    type?: PatternType;
    minConfidence?: number;
    autoApplyOnly?: boolean;
  }): Promise<StoredPattern[]> {
    let sql = `SELECT * FROM patterns WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (options?.type) {
      sql += ` AND pattern_type = $${paramIndex++}`;
      params.push(options.type);
    }

    if (options?.minConfidence !== undefined) {
      sql += ` AND confidence >= $${paramIndex++}`;
      params.push(options.minConfidence);
    }

    if (options?.autoApplyOnly) {
      sql += ` AND auto_apply = true`;
    }

    sql += ` ORDER BY confidence DESC, times_applied DESC`;

    return query<StoredPattern>(sql, params);
  }

  /**
   * Record pattern application
   */
  async recordPatternApplication(
    patternId: string,
    applied: boolean
  ): Promise<void> {
    if (applied) {
      await query(
        `UPDATE patterns SET times_applied = times_applied + 1 WHERE id = $1`,
        [patternId]
      );
    } else {
      await query(
        `UPDATE patterns SET times_rejected = times_rejected + 1 WHERE id = $1`,
        [patternId]
      );
    }
  }
}

export const patternDetector = new PatternDetector();
