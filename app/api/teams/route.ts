import { NextRequest, NextResponse } from 'next/server';
import { delegationTracker } from '@/lib/services/DelegationTracker';

// GET /api/teams - List all teams
export async function GET() {
  try {
    const teams = await delegationTracker.getAllTeams();

    // Get team details with members
    const teamsWithMembers = await Promise.all(
      teams.map(team => delegationTracker.getTeamWithMembers(team.id))
    );

    return NextResponse.json({
      success: true,
      data: teamsWithMembers.filter(Boolean),
      total: teamsWithMembers.length,
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, description, lead_agent_id, budget_usd } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Team name is required' },
        { status: 400 }
      );
    }

    const result = await delegationTracker.createTeam({
      name,
      description,
      lead_agent_id,
      budget_usd,
    });

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
