import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import type { Agent } from '@/lib/db/client';
import type { UpdateAgentInput } from '@/types/agent';
import { agentRouter } from '@/lib/services/AgentRouter';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/agents/[id] - Get agent details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Support both UUID and slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const agent = await queryOne<Agent>(
      isUuid
        ? 'SELECT * FROM agents WHERE id = $1'
        : 'SELECT * FROM agents WHERE slug = $1',
      [id]
    );

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get workload stats
    const workload = await agentRouter.getAgentWorkload(agent.id);

    // Get subordinates
    const subordinates = await query<Agent>(
      'SELECT * FROM agents WHERE reports_to = $1',
      [agent.id]
    );

    // Get manager
    const manager = agent.reports_to
      ? await queryOne<Agent>('SELECT * FROM agents WHERE id = $1', [agent.reports_to])
      : null;

    return NextResponse.json({
      success: true,
      data: {
        ...agent,
        workload,
        subordinates,
        manager,
      },
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}

// PUT /api/agents/[id] - Update an agent
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateAgentInput = await request.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(body.name);
    }
    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(body.description);
    }
    if (body.role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(body.role);
    }
    if (body.capabilities !== undefined) {
      updates.push(`capabilities = $${paramIndex++}`);
      values.push(JSON.stringify(body.capabilities));
    }
    if (body.specializations !== undefined) {
      updates.push(`specializations = $${paramIndex++}`);
      values.push(JSON.stringify(body.specializations));
    }
    if (body.system_prompt_path !== undefined) {
      updates.push(`system_prompt_path = $${paramIndex++}`);
      values.push(body.system_prompt_path);
    }
    if (body.adapter_type !== undefined) {
      updates.push(`adapter_type = $${paramIndex++}`);
      values.push(body.adapter_type);
    }
    if (body.adapter_config !== undefined) {
      updates.push(`adapter_config = $${paramIndex++}`);
      values.push(JSON.stringify(body.adapter_config));
    }
    if (body.reports_to !== undefined) {
      updates.push(`reports_to = $${paramIndex++}`);
      values.push(body.reports_to);
    }
    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(body.status);
    }
    if (body.heartbeat_mode !== undefined) {
      updates.push(`heartbeat_mode = $${paramIndex++}`);
      values.push(body.heartbeat_mode);
    }
    if (body.heartbeat_interval_seconds !== undefined) {
      updates.push(`heartbeat_interval_seconds = $${paramIndex++}`);
      values.push(body.heartbeat_interval_seconds);
    }
    if (body.monthly_budget_usd !== undefined) {
      updates.push(`monthly_budget_usd = $${paramIndex++}`);
      values.push(body.monthly_budget_usd);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      );
    }

    values.push(id);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const result = await queryOne<Agent>(
      `UPDATE agents SET ${updates.join(', ')}, updated_at = NOW()
       WHERE ${isUuid ? 'id' : 'slug'} = $${paramIndex}
       RETURNING *`,
      values
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[id] - Delete an agent
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const result = await queryOne<{ id: string }>(
      `DELETE FROM agents WHERE ${isUuid ? 'id' : 'slug'} = $1 RETURNING id`,
      [id]
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true, id: result.id },
    });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}
