import { NextRequest, NextResponse } from 'next/server';
import { approvalEngine } from '@/lib/services/ApprovalEngine';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/approvals/[id] - Get approval request details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const approval = await approvalEngine.getApprovalRequest(id);

    if (!approval) {
      return NextResponse.json(
        { success: false, error: 'Approval request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: approval,
    });
  } catch (error) {
    console.error('Error fetching approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch approval' },
      { status: 500 }
    );
  }
}
