import { NextRequest, NextResponse } from 'next/server';
import { heartbeatCoordinator } from '@/lib/services/HeartbeatCoordinator';
import type { AgentHeartbeat } from '@/types/agent';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/agents/[id]/heartbeat - Record a heartbeat from an agent
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const heartbeat: AgentHeartbeat = {
      agent_id: id,
      status: body.status || 'active',
      current_task_id: body.current_task_id || null,
      memory_usage_mb: body.memory_usage_mb,
      uptime_seconds: body.uptime_seconds,
      last_activity: body.last_activity,
    };

    await heartbeatCoordinator.recordHeartbeat(heartbeat);

    const nextExpected = await heartbeatCoordinator.getNextExpectedHeartbeat(id);

    return NextResponse.json({
      success: true,
      data: {
        recorded: true,
        next_expected: nextExpected,
      },
    });
  } catch (error) {
    console.error('Error recording heartbeat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record heartbeat' },
      { status: 500 }
    );
  }
}
