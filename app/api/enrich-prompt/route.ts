import { NextRequest, NextResponse } from 'next/server';
import { promptEnricher } from '@/lib/services/PromptEnricher';
import { queryOne } from '@/lib/db/client';
import type { ClarificationSession } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/enrich-prompt
 * Initiates prompt enrichment workflow
 *
 * Body:
 * {
 *   project_id: string,
 *   user_prompt: string,
 *   skip_clarification?: boolean
 * }
 *
 * Response:
 * - If needs clarification: { needs_clarification: true, questions: [...], session_id: string }
 * - If enriched directly: { needs_clarification: false, enriched_prompt: string, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, user_prompt, skip_clarification } = body;

    if (!project_id || !user_prompt) {
      return NextResponse.json(
        {
          success: false,
          error: 'project_id and user_prompt are required',
        },
        { status: 400 }
      );
    }

    // Start enrichment workflow
    const result = await promptEnricher.enrichPrompt({
      projectId: project_id,
      userPrompt: user_prompt,
      skipClarification: skip_clarification || false,
    });

    // If needs clarification, create a session
    if (result.needsClarification && result.questions) {
      const session = await queryOne<ClarificationSession>(
        `INSERT INTO clarification_sessions (
          project_id, user_prompt, questions, status
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [
          project_id,
          user_prompt,
          JSON.stringify(result.questions),
          'pending_questions',
        ]
      );

      return NextResponse.json({
        success: true,
        needs_clarification: true,
        questions: result.questions,
        session_id: session?.id,
      });
    }

    // Direct enrichment (no clarification needed)
    return NextResponse.json({
      success: true,
      needs_clarification: false,
      enriched_prompt: result.enrichedPrompt,
      context_applied: result.contextApplied || [],
      patterns_applied: result.patternsApplied || [],
      estimated_cost: result.estimatedCost,
      suggested_agents: result.suggestedAgents || [],
      suggested_patterns: result.suggestedPatterns || [],
    });
  } catch (error) {
    console.error('Error in enrich-prompt:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to enrich prompt',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
