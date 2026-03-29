import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import type { Goal } from '@/lib/db/client';
import type { CreateGoalInput } from '@/types/goal';

// GET /api/goals - List all goals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');

    let queryText = 'SELECT * FROM goals WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (projectId) {
      queryText += ` AND project_id = $${paramIndex++}`;
      params.push(projectId);
    }

    if (status) {
      queryText += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    queryText += ' ORDER BY created_at DESC';

    const goals = await query<Goal>(queryText, params.length > 0 ? params : undefined);

    // Get task counts for each goal
    const goalsWithCounts = await Promise.all(
      goals.map(async (goal) => {
        const counts = await queryOne<{ total: string; completed: string }>(
          `SELECT
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'completed') as completed
           FROM tasks WHERE goal_id = $1`,
          [goal.id]
        );
        return {
          ...goal,
          task_count: parseInt(counts?.total || '0'),
          completed_task_count: parseInt(counts?.completed || '0'),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: goalsWithCounts,
      total: goalsWithCounts.length,
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create a new goal
export async function POST(request: NextRequest) {
  try {
    const body: CreateGoalInput = await request.json();

    const { title, description, project_id, priority, target_date } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Goal title is required' },
        { status: 400 }
      );
    }

    const result = await queryOne<Goal>(
      `INSERT INTO goals (title, description, project_id, priority, target_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        title,
        description || null,
        project_id || null,
        priority || 'medium',
        target_date || null,
      ]
    );

    if (!result) {
      throw new Error('Failed to create goal');
    }

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
