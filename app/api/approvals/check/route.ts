import { NextRequest, NextResponse } from 'next/server';
import { approvalEngine } from '@/lib/services/ApprovalEngine';

// POST /api/approvals/check - Check if an operation requires approval
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { operation_type, operation_details, task_id, agent_id, estimated_cost_usd } = body;

    if (!operation_type || !operation_details) {
      return NextResponse.json(
        { success: false, error: 'operation_type and operation_details are required' },
        { status: 400 }
      );
    }

    const result = await approvalEngine.checkAndRequestApproval(
      operation_type,
      operation_details,
      {
        taskId: task_id,
        agentId: agent_id,
        estimatedCostUsd: estimated_cost_usd,
      }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error checking approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check approval' },
      { status: 500 }
    );
  }
}
