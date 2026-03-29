import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import type { Project } from '@/lib/db/client';
import type { UpdateProjectInput } from '@/types/project';

// GET /api/projects/[id] - Get a single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await queryOne<Project>(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    // Get additional stats for this project
    const sessionStats = await queryOne<{
      total_sessions: number;
      total_cost: number;
      active_sessions: number;
    }>(
      `SELECT
        COUNT(*) as total_sessions,
        COALESCE(SUM(cost_usd), 0) as total_cost,
        COUNT(*) FILTER (WHERE status = 'running') as active_sessions
       FROM agent_sessions
       WHERE project_id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        stats: sessionStats || {
          total_sessions: 0,
          total_cost: 0,
          active_sessions: 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch project',
      },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateProjectInput = await request.json();

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(body.name);
    }
    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(body.description);
    }
    if (body.tech_stack !== undefined) {
      updates.push(`tech_stack = $${paramIndex++}`);
      values.push(JSON.stringify(body.tech_stack));
    }
    if (body.repo_path !== undefined) {
      updates.push(`repo_path = $${paramIndex++}`);
      values.push(body.repo_path);
    }
    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(body.status);
    }
    if (body.monthly_budget !== undefined) {
      updates.push(`monthly_budget = $${paramIndex++}`);
      values.push(body.monthly_budget);
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

    const result = await queryOne<Project>(
      `UPDATE projects
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update project',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await queryOne<{ id: string }>(
      'DELETE FROM projects WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete project',
      },
      { status: 500 }
    );
  }
}
