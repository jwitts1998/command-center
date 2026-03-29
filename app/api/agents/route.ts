import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import type { Agent } from '@/lib/db/client';
import type { CreateAgentInput } from '@/types/agent';

// GET /api/agents - List all agents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role');

    let queryText = 'SELECT * FROM agents WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status) {
      queryText += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (role) {
      queryText += ` AND role = $${paramIndex++}`;
      params.push(role);
    }

    queryText += ' ORDER BY role, name';

    const agents = await query<Agent>(queryText, params.length > 0 ? params : undefined);

    // Get workload for each agent
    const agentsWithWorkload = await Promise.all(
      agents.map(async (agent) => {
        const workload = await queryOne<{ active_tasks: string; completed_today: string }>(
          `SELECT
             (SELECT COUNT(*) FROM tasks WHERE assigned_agent_id = $1 AND status = 'in_progress') as active_tasks,
             (SELECT COUNT(*) FROM tasks WHERE assigned_agent_id = $1 AND completed_at >= CURRENT_DATE) as completed_today`,
          [agent.id]
        );
        return {
          ...agent,
          active_tasks: parseInt(workload?.active_tasks || '0'),
          completed_today: parseInt(workload?.completed_today || '0'),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: agentsWithWorkload,
      total: agentsWithWorkload.length,
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Register a new agent
export async function POST(request: NextRequest) {
  try {
    const body: CreateAgentInput = await request.json();

    const {
      slug,
      name,
      description,
      role,
      capabilities,
      specializations,
      system_prompt_path,
      adapter_type,
      adapter_config,
      reports_to,
      heartbeat_mode,
      heartbeat_interval_seconds,
      monthly_budget_usd,
    } = body;

    if (!slug || !name || !role) {
      return NextResponse.json(
        { success: false, error: 'slug, name, and role are required' },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM agents WHERE slug = $1',
      [slug]
    );

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Agent with this slug already exists' },
        { status: 409 }
      );
    }

    const result = await queryOne<Agent>(
      `INSERT INTO agents (
        slug, name, description, role, capabilities, specializations,
        system_prompt_path, adapter_type, adapter_config, reports_to,
        heartbeat_mode, heartbeat_interval_seconds, monthly_budget_usd
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        slug,
        name,
        description || null,
        role,
        JSON.stringify(capabilities || []),
        JSON.stringify(specializations || []),
        system_prompt_path || null,
        adapter_type || 'claude',
        JSON.stringify(adapter_config || {}),
        reports_to || null,
        heartbeat_mode || 'on_demand',
        heartbeat_interval_seconds || 300,
        monthly_budget_usd || null,
      ]
    );

    if (!result) {
      throw new Error('Failed to create agent');
    }

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
