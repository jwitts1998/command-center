import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import type { Task as DbTask } from '@/lib/db/client';
import type { UpdateTaskInput, Task } from '@/types/task';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/tasks/[id] - Get task details with subtasks
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const task = await queryOne<DbTask>(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Fetch subtasks (cast to typed Task)
    const subtasks = await query<DbTask>(
      'SELECT * FROM tasks WHERE parent_task_id = $1 ORDER BY priority DESC, created_at',
      [id]
    ) as unknown as Task[];

    const taskWithSubtasks = {
      ...task,
      subtasks,
      subtask_count: subtasks.length,
      completed_subtask_count: subtasks.filter(t => t.status === 'completed').length,
    };

    return NextResponse.json({
      success: true,
      data: taskWithSubtasks,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Update a task
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateTaskInput = await request.json();

    // Get previous state for audit log
    const previousTask = await queryOne<DbTask>(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );

    if (!previousTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(body.title);
    }
    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(body.description);
    }
    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(body.status);
      if (body.status === 'completed' || body.status === 'failed' || body.status === 'cancelled') {
        updates.push(`completed_at = NOW()`);
      }
      if (body.status === 'in_progress' && !previousTask.started_at) {
        updates.push(`started_at = NOW()`);
      }
    }
    if (body.priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(body.priority);
    }
    if (body.complexity !== undefined) {
      updates.push(`complexity = $${paramIndex++}`);
      values.push(body.complexity);
    }
    if (body.estimated_cost_usd !== undefined) {
      updates.push(`estimated_cost_usd = $${paramIndex++}`);
      values.push(body.estimated_cost_usd);
    }
    if (body.assigned_agent_id !== undefined) {
      updates.push(`assigned_agent_id = $${paramIndex++}`);
      values.push(body.assigned_agent_id);
    }
    if (body.run_id !== undefined) {
      updates.push(`run_id = $${paramIndex++}`);
      values.push(body.run_id);
    }
    if (body.actual_cost_usd !== undefined) {
      updates.push(`actual_cost_usd = $${paramIndex++}`);
      values.push(body.actual_cost_usd);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      );
    }

    values.push(id);
    const result = await queryOne<Task>(
      `UPDATE tasks SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    // Log to audit
    await query(
      `INSERT INTO task_audit_log (task_id, action, actor_type, actor_id, previous_state, new_state)
       VALUES ($1, 'updated', 'user', 'api', $2, $3)`,
      [id, JSON.stringify(previousTask), JSON.stringify(result)]
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const result = await queryOne<{ id: string }>(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true, id },
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
