import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db/client';
import type { AgentSession } from '@/lib/db/client';
import type { UpdateSessionInput } from '@/types/session';

// GET /api/sessions/[id] - Get a single session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const session = await queryOne<AgentSession>(
      'SELECT * FROM agent_sessions WHERE id = $1',
      [id]
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
    console.error('Error fetching session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch session',
      },
      { status: 500 }
    );
  }
}

// PUT /api/sessions/[id] - Update a session
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body: UpdateSessionInput = await request.json();

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(body.status);
    }
    if (body.completed_at !== undefined) {
      updates.push(`completed_at = $${paramIndex++}`);
      values.push(body.completed_at);
    }
    if (body.tokens_input !== undefined) {
      updates.push(`tokens_input = $${paramIndex++}`);
      values.push(body.tokens_input);
    }
    if (body.tokens_output !== undefined) {
      updates.push(`tokens_output = $${paramIndex++}`);
      values.push(body.tokens_output);
    }
    if (body.cost_usd !== undefined) {
      updates.push(`cost_usd = $${paramIndex++}`);
      values.push(body.cost_usd);
    }
    if (body.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(body.metadata));
    }

    if (updates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No fields to update',
        },
        { status: 400 }
      );
    }

    values.push(id);

    const result = await queryOne<AgentSession>(
      `UPDATE agent_sessions
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
        },
        { status: 404 }
      );
    }

    // If session completed, update cost budget
    if (body.status === 'completed' && body.cost_usd !== undefined) {
      const session = result;
      const month = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

      await queryOne(
        `INSERT INTO cost_budgets (project_id, month, spent_usd)
         VALUES ($1, $2, $3)
         ON CONFLICT (project_id, month)
         DO UPDATE SET spent_usd = cost_budgets.spent_usd + $3`,
        [session.project_id, month, body.cost_usd]
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update session',
      },
      { status: 500 }
    );
  }
}
