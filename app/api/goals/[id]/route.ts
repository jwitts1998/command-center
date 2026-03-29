import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import type { Goal } from '@/lib/db/client';
import type { UpdateGoalInput } from '@/types/goal';
import type { Task } from '@/types/task';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/goals/[id] - Get goal details with tasks
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const goal = await queryOne<Goal>(
      'SELECT * FROM goals WHERE id = $1',
      [id]
    );

    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Fetch tasks for this goal (cast to typed Task)
    const tasks = await query<Task>(
      'SELECT * FROM tasks WHERE goal_id = $1 ORDER BY depth, created_at',
      [id]
    ) as unknown as Task[];

    // Calculate stats
    const taskCount = tasks.length;
    const completedTaskCount = tasks.filter(t => t.status === 'completed').length;
    const totalEstimatedCost = tasks.reduce(
      (sum, t) => sum + parseFloat(String(t.estimated_cost_usd || 0)),
      0
    );
    const totalActualCost = tasks.reduce(
      (sum, t) => sum + parseFloat(String(t.actual_cost_usd || 0)),
      0
    );

    const goalWithTasks = {
      ...goal,
      tasks,
      task_count: taskCount,
      completed_task_count: completedTaskCount,
      total_estimated_cost: totalEstimatedCost,
      total_actual_cost: totalActualCost,
    };

    return NextResponse.json({
      success: true,
      data: goalWithTasks,
    });
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch goal' },
      { status: 500 }
    );
  }
}

// PUT /api/goals/[id] - Update a goal
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateGoalInput = await request.json();

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
      if (body.status === 'completed') {
        updates.push(`completed_at = NOW()`);
      }
    }
    if (body.priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(body.priority);
    }
    if (body.target_date !== undefined) {
      updates.push(`target_date = $${paramIndex++}`);
      values.push(body.target_date);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      );
    }

    values.push(id);
    const result = await queryOne<Goal>(
      `UPDATE goals SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/[id] - Delete a goal
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const result = await queryOne<{ id: string }>(
      'DELETE FROM goals WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true, id },
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
