'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { TeamMetrics as TeamMetricsType } from '@/types/team';
import {
  CheckCircle2,
  Clock,
  DollarSign,
  GitBranch,
  TrendingUp,
  Users,
} from 'lucide-react';

interface TeamMetricsProps {
  metrics: TeamMetricsType;
  loading?: boolean;
}

export function TeamMetrics({ metrics, loading }: TeamMetricsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalTasks = metrics.total_tasks_completed + metrics.total_tasks_in_progress;
  const completionRate = totalTasks > 0
    ? (metrics.total_tasks_completed / totalTasks) * 100
    : 0;

  const memberStats = Object.entries(metrics.member_utilization);
  const topPerformer = memberStats.length > 0
    ? memberStats.reduce((a, b) => a[1].tasks > b[1].tasks ? a : b)
    : null;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_tasks_completed}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.total_tasks_in_progress} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.avg_task_completion_time_hours.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">per task</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.total_cost_usd.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              ${totalTasks > 0 ? (metrics.total_cost_usd / totalTasks).toFixed(2) : '0.00'} per task
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Delegations</CardTitle>
            <GitBranch className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_delegations}</div>
            <p className="text-xs text-muted-foreground">tasks delegated</p>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Task Completion Rate</CardTitle>
            <span className="text-2xl font-bold">{completionRate.toFixed(0)}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={completionRate} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {metrics.total_tasks_completed} of {totalTasks} tasks completed
          </p>
        </CardContent>
      </Card>

      {/* Member Utilization */}
      {memberStats.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Member Utilization</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {memberStats
                .sort((a, b) => b[1].tasks - a[1].tasks)
                .map(([agentId, stats]) => {
                  const maxTasks = Math.max(...memberStats.map(([, s]) => s.tasks), 1);
                  const percentage = (stats.tasks / maxTasks) * 100;

                  return (
                    <div key={agentId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">
                          {stats.agent_name}
                          {topPerformer && topPerformer[0] === agentId && (
                            <TrendingUp className="h-3 w-3 text-green-500 inline ml-1" />
                          )}
                        </span>
                        <span className="text-muted-foreground">
                          {stats.tasks} tasks · ${stats.cost.toFixed(2)}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-1.5" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
