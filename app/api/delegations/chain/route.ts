import { NextRequest, NextResponse } from 'next/server';
import { delegationTracker } from '@/lib/services/DelegationTracker';

// GET /api/delegations/chain?task_id=xxx - Get delegation chain for a task
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'task_id is required' },
        { status: 400 }
      );
    }

    const chain = await delegationTracker.getDelegationChain(taskId);

    return NextResponse.json({
      success: true,
      data: chain,
    });
  } catch (error) {
    console.error('Error fetching delegation chain:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch delegation chain' },
      { status: 500 }
    );
  }
}
