import { NextRequest, NextResponse } from 'next/server';
import { approvalEngine } from '@/lib/services/ApprovalEngine';
import type { CreateApprovalRequestInput } from '@/types/approval';

// GET /api/approvals - List pending approvals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const taskId = searchParams.get('task_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    const approvals = await approvalEngine.getPendingApprovals({
      agentId: agentId || undefined,
      taskId: taskId || undefined,
      limit,
    });

    // Get stats
    const stats = await approvalEngine.getApprovalStats();

    return NextResponse.json({
      success: true,
      data: approvals,
      total: approvals.length,
      stats,
    });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}

// POST /api/approvals - Create an approval request
export async function POST(request: NextRequest) {
  try {
    const body: CreateApprovalRequestInput = await request.json();

    if (!body.operation_type || !body.operation_details) {
      return NextResponse.json(
        { success: false, error: 'operation_type and operation_details are required' },
        { status: 400 }
      );
    }

    const result = await approvalEngine.createApprovalRequest(body);

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating approval request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create approval request' },
      { status: 500 }
    );
  }
}
