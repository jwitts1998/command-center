import { NextRequest, NextResponse } from 'next/server';
import { delegationTracker } from '@/lib/services/DelegationTracker';
import { query } from '@/lib/db/client';
import type { Delegation } from '@/lib/db/client';
import type { CreateDelegationInput } from '@/types/team';

// GET /api/delegations - List delegations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');
    const fromAgentId = searchParams.get('from_agent_id');
    const toAgentId = searchParams.get('to_agent_id');
    const status = searchParams.get('status');

    let queryText = 'SELECT * FROM delegations WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (taskId) {
      queryText += ` AND task_id = $${paramIndex++}`;
      params.push(taskId);
    }
    if (fromAgentId) {
      queryText += ` AND from_agent_id = $${paramIndex++}`;
      params.push(fromAgentId);
    }
    if (toAgentId) {
      queryText += ` AND to_agent_id = $${paramIndex++}`;
      params.push(toAgentId);
    }
    if (status) {
      queryText += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    queryText += ' ORDER BY delegated_at DESC';

    const delegations = await query<Delegation>(queryText, params.length > 0 ? params : undefined);

    return NextResponse.json({
      success: true,
      data: delegations,
      total: delegations.length,
    });
  } catch (error) {
    console.error('Error fetching delegations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch delegations' },
      { status: 500 }
    );
  }
}

// POST /api/delegations - Create a delegation
export async function POST(request: NextRequest) {
  try {
    const body: CreateDelegationInput = await request.json();

    const { task_id, from_agent_id, to_agent_id, reason } = body;

    if (!task_id || !from_agent_id || !to_agent_id) {
      return NextResponse.json(
        { success: false, error: 'task_id, from_agent_id, and to_agent_id are required' },
        { status: 400 }
      );
    }

    const result = await delegationTracker.delegate({
      task_id,
      from_agent_id,
      to_agent_id,
      reason,
    });

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating delegation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create delegation',
      },
      { status: 500 }
    );
  }
}
