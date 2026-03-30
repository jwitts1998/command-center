'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { GoalWithTasks, Goal } from '@/types/goal';
import { Target, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';

interface GoalCardProps {
  goal: Goal | GoalWithTasks;
  showProgress?: boolean;
}

function isGoalWithTasks(goal: Goal | GoalWithTasks): goal is GoalWithTasks {
  return 'task_count' in goal;
}

const priorityColors: Record<string, string> = {
  critical: 'text-red-600 dark:text-red-400',
  high: 'text-orange-600 dark:text-orange-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-gray-600 dark:text-gray-400',
};

export function GoalCard({ goal, showProgress = true }: GoalCardProps) {
  const hasTaskData = isGoalWithTasks(goal);
  const taskCount = hasTaskData ? goal.task_count : 0;
  const completedCount = hasTaskData ? goal.completed_task_count : 0;
  const progress = taskCount > 0 ? (completedCount / taskCount) * 100 : 0;
  const estimatedCost = hasTaskData ? goal.total_estimated_cost : 0;
  const actualCost = hasTaskData ? goal.total_actual_cost : 0;

  return (
    <Link href={`/goals/${goal.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className={`h-4 w-4 ${priorityColors[goal.priority] || 'text-gray-500'}`} />
              <CardTitle className="text-lg line-clamp-1">{goal.title}</CardTitle>
            </div>
            <StatusBadge status={goal.status} />
          </div>
          <CardDescription className="line-clamp-2">
            {goal.description || 'No description'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {showProgress && hasTaskData && taskCount > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {completedCount}/{taskCount} tasks
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {goal.target_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(goal.target_date).split(',')[0]}
              </span>
            )}
            {hasTaskData && estimatedCost > 0 && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {actualCost > 0
                  ? `${formatCurrency(actualCost)} / ${formatCurrency(estimatedCost)}`
                  : `Est: ${formatCurrency(estimatedCost)}`
                }
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className={`capitalize ${priorityColors[goal.priority]}`}>
              {goal.priority} priority
            </span>
            <span className="text-muted-foreground">
              Created {formatDate(goal.created_at).split(',')[0]}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
