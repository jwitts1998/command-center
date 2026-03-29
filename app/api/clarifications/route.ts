import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db/client';
import { promptEnricher } from '@/lib/services/PromptEnricher';
import type { ClarificationSession } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/clarifications?session_id=xxx
 * Gets a clarification session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'session_id is required',
        },
        { status: 400 }
      );
    }

    const session = await queryOne<ClarificationSession>(
      'SELECT * FROM clarification_sessions WHERE id = $1',
      [sessionId]
    );

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error fetching clarification session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch session',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clarifications
 * Submits answers to clarification questions and gets enriched prompt
 *
 * Body:
 * {
 *   session_id: string,
 *   answers: Record<string, string>
 * }
 *
 * Response:
 * {
 *   enriched_prompt: string,
 *   context_applied: string[],
 *   patterns_applied: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, answers } = body;

    if (!session_id || !answers) {
      return NextResponse.json(
        {
          success: false,
          error: 'session_id and answers are required',
        },
        { status: 400 }
      );
    }

    // Get the clarification session
    const session = await queryOne<ClarificationSession>(
      'SELECT * FROM clarification_sessions WHERE id = $1',
      [session_id]
    );

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
        },
        { status: 404 }
      );
    }

    if (session.status !== 'pending_questions') {
      return NextResponse.json(
        {
          success: false,
          error: 'Session is not in pending_questions state',
        },
        { status: 400 }
      );
    }

    // Enrich the prompt with answers
    const enrichmentResult = await promptEnricher.enrichWithAnswers(
      session.project_id,
      session.user_prompt,
      answers
    );

    // Update the session
    const updatedSession = await queryOne<ClarificationSession>(
      `UPDATE clarification_sessions
       SET answers = $1,
           enriched_prompt = $2,
           status = $3,
           completed_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        JSON.stringify(answers),
        enrichmentResult.enrichedPrompt,
        'enriched',
        session_id,
      ]
    );

    // Create an agent session to track this enrichment
    await queryOne(
      `INSERT INTO agent_sessions (
        project_id, user_prompt, enriched_prompt, status
      )
      VALUES ($1, $2, $3, $4)`,
      [
        session.project_id,
        session.user_prompt,
        enrichmentResult.enrichedPrompt,
        'completed',
      ]
    );

    return NextResponse.json({
      success: true,
      data: {
        session: updatedSession,
        enriched_prompt: enrichmentResult.enrichedPrompt,
        context_applied: enrichmentResult.contextApplied || [],
        patterns_applied: enrichmentResult.patternsApplied || [],
        estimated_cost: enrichmentResult.estimatedCost,
        suggested_agents: enrichmentResult.suggestedAgents || [],
        suggested_patterns: enrichmentResult.suggestedPatterns || [],
      },
    });
  } catch (error) {
    console.error('Error processing clarifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process clarifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
