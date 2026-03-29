import { NextRequest, NextResponse } from 'next/server';
import { taskCheckout } from '@/lib/services/TaskCheckout';
import type { TaskStatus } from '@/types/task';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/tasks/[id]/release - Release a task
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { checkout_token, status, new_status, actual_cost_usd } = body;
    const taskStatus = status || new_status;

    if (!checkout_token) {
      return NextResponse.json(
        { success: false, error: 'checkout_token is required' },
        { status: 400 }
      );
    }

    const result = await taskCheckout.release(
      id,
      checkout_token,
      (taskStatus as TaskStatus) || 'ready',
      actual_cost_usd
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error releasing task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to release task' },
      { status: 500 }
    );
  }
}
