import { NextRequest, NextResponse } from 'next/server';
import { delegationTracker } from '@/lib/services/DelegationTracker';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/teams/[id]/members - Add a member to a team
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { agent_id, role } = body;

    if (!agent_id) {
      return NextResponse.json(
        { success: false, error: 'agent_id is required' },
        { status: 400 }
      );
    }

    const result = await delegationTracker.addTeamMember(
      id,
      agent_id,
      role || 'member'
    );

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add team member' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id]/members - Remove a member from a team
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'agent_id query parameter is required' },
        { status: 400 }
      );
    }

    await delegationTracker.removeTeamMember(id, agentId);

    return NextResponse.json({
      success: true,
      data: { removed: true },
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
