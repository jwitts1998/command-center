import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db/client';
import type { Agent } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/agents/[id]/pause - Pause an agent
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const result = await queryOne<Agent>(
      `UPDATE agents
       SET status = 'paused', updated_at = NOW()
       WHERE (id = $1 OR slug = $1) AND status = 'active'
       RETURNING *`,
      [id]
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Agent not found or already paused' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error pausing agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to pause agent' },
      { status: 500 }
    );
  }
}
