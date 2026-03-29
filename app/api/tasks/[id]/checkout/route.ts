import { NextRequest, NextResponse } from 'next/server';
import { taskCheckout } from '@/lib/services/TaskCheckout';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/tasks/[id]/checkout - Acquire a task
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { agent_id, duration_ms } = body;

    if (!agent_id) {
      return NextResponse.json(
        { success: false, error: 'agent_id is required' },
        { status: 400 }
      );
    }

    const result = await taskCheckout.checkout(id, agent_id, duration_ms);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 409 } // Conflict
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error checking out task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to checkout task' },
      { status: 500 }
    );
  }
}

// GET /api/tasks/[id]/checkout - Get checkout status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const status = await taskCheckout.getCheckoutStatus(id);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting checkout status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get checkout status' },
      { status: 500 }
    );
  }
}
