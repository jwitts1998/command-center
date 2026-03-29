import { NextRequest, NextResponse } from 'next/server';
import { agentRouter } from '@/lib/services/AgentRouter';
import type { AgentRoutingRequest } from '@/types/agent';

// POST /api/agents/route - Route a task to the best agent
export async function POST(request: NextRequest) {
  try {
    const body: AgentRoutingRequest = await request.json();

    if (!body.task_id && !body.task_description) {
      return NextResponse.json(
        { success: false, error: 'task_id or task_description is required' },
        { status: 400 }
      );
    }

    const result = await agentRouter.routeTask(body);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error routing task:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to route task',
      },
      { status: 500 }
    );
  }
}
