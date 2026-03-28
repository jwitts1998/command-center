import { NextRequest, NextResponse } from 'next/server';
import { costTracker } from '@/lib/services/CostTracker';

/**
 * GET /api/costs
 *
 * Get cost data with various query options:
 * - ?type=summary&project_id=xxx&start=2026-01-01&end=2026-02-01
 * - ?type=projects&month=2026-03
 * - ?type=alerts
 * - ?type=total&start=2026-01-01&end=2026-02-01
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'projects';
    const projectId = searchParams.get('project_id');
    const month = searchParams.get('month');
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    switch (type) {
      case 'summary': {
        if (!projectId) {
          return NextResponse.json(
            { success: false, error: 'project_id required for summary' },
            { status: 400 }
          );
        }

        // Default to current month if no dates specified
        const now = new Date();
        const start = startDate || `${now.toISOString().slice(0, 7)}-01`;
        const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);

        const summary = await costTracker.getCostSummary(projectId, start, end);
        const budget = await costTracker.getBudgetStatus(projectId, now.toISOString().slice(0, 7));

        return NextResponse.json({
          success: true,
          data: {
            ...summary,
            budget,
          },
        });
      }

      case 'projects': {
        const targetMonth = month || new Date().toISOString().slice(0, 7);
        const projects = await costTracker.getAllProjectsCosts(targetMonth);

        return NextResponse.json({
          success: true,
          data: projects,
        });
      }

      case 'alerts': {
        const alerts = await costTracker.getBudgetAlerts();

        return NextResponse.json({
          success: true,
          data: alerts,
        });
      }

      case 'total': {
        const now = new Date();
        const start = startDate || `${now.toISOString().slice(0, 7)}-01`;
        const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);

        const total = await costTracker.getTotalCost(start, end);

        return NextResponse.json({
          success: true,
          data: total,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type. Use: summary, projects, alerts, or total' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in costs API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/costs
 *
 * Set budget for a project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, month, limitUsd, alertThreshold } = body;

    if (!projectId || !month || typeof limitUsd !== 'number') {
      return NextResponse.json(
        { success: false, error: 'projectId, month, and limitUsd are required' },
        { status: 400 }
      );
    }

    await costTracker.setBudget(
      projectId,
      month,
      limitUsd,
      alertThreshold || 0.8
    );

    const budget = await costTracker.getBudgetStatus(projectId, month);

    return NextResponse.json({
      success: true,
      data: budget,
    });
  } catch (error) {
    console.error('Error setting budget:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
