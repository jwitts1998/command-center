import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import type { AgentSession } from '@/lib/db/client';
import type { CreateSessionInput } from '@/types/session';

// GET /api/sessions - List all sessions with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let queryText = 'SELECT * FROM agent_sessions';
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (projectId) {
      conditions.push(`project_id = $${paramIndex++}`);
      params.push(projectId);
    }

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ` ORDER BY started_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const sessions = await query<AgentSession>(queryText, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM agent_sessions';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const countResult = await queryOne<{ total: number }>(
      countQuery,
      params.slice(0, -2) // Remove limit and offset
    );

    return NextResponse.json({
      success: true,
      data: sessions,
      pagination: {
        total: countResult?.total || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sessions',
      },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const body: CreateSessionInput = await request.json();

    const {
      project_id,
      agent_type,
      task_id,
      user_prompt,
      enriched_prompt,
      model_used,
    } = body;

    if (!project_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'project_id is required',
        },
        { status: 400 }
      );
    }

    const result = await queryOne<AgentSession>(
      `INSERT INTO agent_sessions (
        project_id, agent_type, task_id, user_prompt,
        enriched_prompt, model_used, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        project_id,
        agent_type || null,
        task_id || null,
        user_prompt || null,
        enriched_prompt || null,
        model_used || null,
        'running',
      ]
    );

    if (!result) {
      throw new Error('Failed to create session');
    }

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create session',
      },
      { status: 500 }
    );
  }
}
