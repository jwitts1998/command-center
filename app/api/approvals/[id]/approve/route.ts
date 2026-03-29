import { NextRequest, NextResponse } from 'next/server';
import { approvalEngine } from '@/lib/services/ApprovalEngine';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/approvals/[id]/approve - Approve a request
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { decided_by, reason } = body;

    if (!decided_by) {
      return NextResponse.json(
        { success: false, error: 'decided_by is required' },
        { status: 400 }
      );
    }

    const result = await approvalEngine.processDecision({
      request_id: id,
      decision: 'approved',
      decided_by,
      reason,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error approving request:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve request',
      },
      { status: 500 }
    );
  }
}
