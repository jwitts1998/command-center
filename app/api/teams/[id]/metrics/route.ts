import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import type { TeamMetrics } from '@/types/team';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;

    // Get team members
    const members = await query<{ agent_id: string; agent_name: string }>(
      `SELECT tm.agent_id, a.name as agent_name
       FROM team_members tm
       JOIN agents a ON tm.agent_id = a.id
       WHERE tm.team_id = $1`,
      [teamId]
    );

    const memberIds = members.map((m) => m.agent_id);

    if (memberIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total_tasks_completed: 0,
          total_tasks_in_progress: 0,
          avg_task_completion_time_hours: 0,
          total_cost_usd: 0,
          active_delegations: 0,
          member_utilization: {},
        } as TeamMetrics,
      });
    }

    // Get task statistics for team members
    const taskStats = await queryOne<{
      completed: string;
      in_progress: string;
      avg_hours: string;
      total_cost: string;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
         COALESCE(AVG(
           EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600
         ) FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL), 0) as avg_hours,
         COALESCE(SUM(actual_cost_usd), 0) as total_cost
       FROM tasks
       WHERE assigned_agent_id = ANY($1)`,
      [memberIds]
    );

    // Get active delegations
    const delegationCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM delegations
       WHERE (from_agent_id = ANY($1) OR to_agent_id = ANY($1))
         AND status = 'active'`,
      [memberIds]
    );

    // Get per-member utilization
    const memberUtilization = await query<{
      agent_id: string;
      agent_name: string;
      task_count: string;
      cost: string;
    }>(
      `SELECT
         t.assigned_agent_id as agent_id,
         a.name as agent_name,
         COUNT(*) as task_count,
         COALESCE(SUM(t.actual_cost_usd), 0) as cost
       FROM tasks t
       JOIN agents a ON t.assigned_agent_id = a.id
       WHERE t.assigned_agent_id = ANY($1)
       GROUP BY t.assigned_agent_id, a.name`,
      [memberIds]
    );

    const utilizationMap: Record<string, { tasks: number; cost: number; agent_name: string }> = {};
    for (const row of memberUtilization) {
      utilizationMap[row.agent_id] = {
        tasks: parseInt(row.task_count, 10),
        cost: parseFloat(row.cost),
        agent_name: row.agent_name,
      };
    }

    // Include members with no tasks
    for (const member of members) {
      if (!utilizationMap[member.agent_id]) {
        utilizationMap[member.agent_id] = {
          tasks: 0,
          cost: 0,
          agent_name: member.agent_name,
        };
      }
    }

    const metrics: TeamMetrics = {
      total_tasks_completed: parseInt(taskStats?.completed || '0', 10),
      total_tasks_in_progress: parseInt(taskStats?.in_progress || '0', 10),
      avg_task_completion_time_hours: parseFloat(taskStats?.avg_hours || '0'),
      total_cost_usd: parseFloat(taskStats?.total_cost || '0'),
      active_delegations: parseInt(delegationCount?.count || '0', 10),
      member_utilization: utilizationMap,
    };

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error fetching team metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team metrics' },
      { status: 500 }
    );
  }
}
