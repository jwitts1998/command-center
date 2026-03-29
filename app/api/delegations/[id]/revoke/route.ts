import { NextRequest, NextResponse } from 'next/server';
import { delegationTracker } from '@/lib/services/DelegationTracker';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/delegations/[id]/revoke - Revoke a delegation
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { revert_to_agent } = body;

    await delegationTracker.revokeDelegation(id, revert_to_agent);

    return NextResponse.json({
      success: true,
      data: { revoked: true },
    });
  } catch (error) {
    console.error('Error revoking delegation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to revoke delegation',
      },
      { status: 500 }
    );
  }
}
