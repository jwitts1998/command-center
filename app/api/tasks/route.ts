import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import type { Task } from '@/lib/db/client';
import type { CreateTaskInput } from '@/types/task';

// GET /api/tasks - List tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goal_id');
    const status = searchParams.get('status');
    const assignedAgentId = searchParams.get('assigned_agent_id');
    const parentTaskId = searchParams.get('parent_task_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let queryText = 'SELECT * FROM tasks WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (goalId) {
      queryText += ` AND goal_id = $${paramIndex++}`;
      params.push(goalId);
    }

    if (status) {
      queryText += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (assignedAgentId) {
      queryText += ` AND assigned_agent_id = $${paramIndex++}`;
      params.push(assignedAgentId);
    }

    if (parentTaskId === 'null') {
      queryText += ' AND parent_task_id IS NULL';
    } else if (parentTaskId) {
      queryText += ` AND parent_task_id = $${paramIndex++}`;
      params.push(parentTaskId);
    }

    queryText += ` ORDER BY priority DESC, created_at ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const tasks = await query<Task>(queryText, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM tasks WHERE 1=1';
    const countParams: unknown[] = [];
    let countIndex = 1;

    if (goalId) {
      countQuery += ` AND goal_id = $${countIndex++}`;
      countParams.push(goalId);
    }
    if (status) {
      countQuery += ` AND status = $${countIndex++}`;
      countParams.push(status);
    }

    const countResult = await queryOne<{ total: string }>(countQuery, countParams);

    return NextResponse.json({
      success: true,
      data: tasks,
      total: parseInt(countResult?.total || '0'),
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body: CreateTaskInput = await request.json();

    const { title, description, goal_id, parent_task_id, priority, complexity, estimated_cost_usd } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Task title is required' },
        { status: 400 }
      );
    }

    // Calculate depth
    let depth = 0;
    if (parent_task_id) {
      const parent = await queryOne<{ depth: number }>(
        'SELECT depth FROM tasks WHERE id = $1',
        [parent_task_id]
      );
      if (parent) {
        depth = parent.depth + 1;
      }
    }

    const result = await queryOne<Task>(
      `INSERT INTO tasks (title, description, goal_id, parent_task_id, priority, complexity, estimated_cost_usd, depth)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title,
        description || null,
        goal_id || null,
        parent_task_id || null,
        priority || 'medium',
        complexity || null,
        estimated_cost_usd || null,
        depth,
      ]
    );

    if (!result) {
      throw new Error('Failed to create task');
    }

    // Log to audit
    await query(
      `INSERT INTO task_audit_log (task_id, action, actor_type, actor_id, new_state)
       VALUES ($1, 'created', 'user', 'api', $2)`,
      [result.id, JSON.stringify({ title, description, priority, complexity })]
    );

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
