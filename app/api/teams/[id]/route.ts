import { NextRequest, NextResponse } from 'next/server';
import { delegationTracker } from '@/lib/services/DelegationTracker';
import { query, queryOne } from '@/lib/db/client';
import type { Team } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/teams/[id] - Get team details with members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const team = await delegationTracker.getTeamWithMembers(id);

    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

// PUT /api/teams/[id] - Update a team
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

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
    if (body.lead_agent_id !== undefined) {
      updates.push(`lead_agent_id = $${paramIndex++}`);
      values.push(body.lead_agent_id);
    }
    if (body.budget_usd !== undefined) {
      updates.push(`budget_usd = $${paramIndex++}`);
      values.push(body.budget_usd);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      );
    }

    values.push(id);
    const result = await queryOne<Team>(
      `UPDATE teams SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id] - Delete a team
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const result = await queryOne<{ id: string }>(
      'DELETE FROM teams WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true, id },
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
