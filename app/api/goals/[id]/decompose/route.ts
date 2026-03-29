import { NextRequest, NextResponse } from 'next/server';
import { taskDecomposer } from '@/lib/services/TaskDecomposer';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/goals/[id]/decompose - AI decomposes goal into tasks
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const result = await taskDecomposer.decomposeGoal(id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error decomposing goal:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to decompose goal',
      },
      { status: 500 }
    );
  }
}
