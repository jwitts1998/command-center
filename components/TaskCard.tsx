'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { Task, TaskWithSubtasks } from '@/types/task';
import { ChevronRight, Clock, DollarSign, User, GitBranch } from 'lucide-react';

interface TaskCardProps {
  task: Task | TaskWithSubtasks;
  showHierarchy?: boolean;
  compact?: boolean;
  onCheckout?: (taskId: string) => void;
  onRelease?: (taskId: string) => void;
}

function isTaskWithSubtasks(task: Task | TaskWithSubtasks): task is TaskWithSubtasks {
  return 'subtasks' in task;
}

const complexityColors: Record<string, string> = {
  trivial: 'text-gray-500',
  simple: 'text-green-600 dark:text-green-400',
  moderate: 'text-yellow-600 dark:text-yellow-400',
  complex: 'text-orange-600 dark:text-orange-400',
  epic: 'text-red-600 dark:text-red-400',
};

const priorityIndicator: Record<string, string> = {
  critical: 'border-l-4 border-l-red-500',
  high: 'border-l-4 border-l-orange-500',
  medium: 'border-l-4 border-l-yellow-500',
  low: 'border-l-4 border-l-gray-400',
};

export function TaskCard({
  task,
  showHierarchy = true,
  compact = false,
  onCheckout,
  onRelease,
}: TaskCardProps) {
  const hasSubtasks = isTaskWithSubtasks(task);
  const isCheckedOut = task.checkout_token !== null;
  const canCheckout = task.status === 'pending' || task.status === 'ready';
  const canRelease = isCheckedOut;

  if (compact) {
    return (
      <Link href={`/tasks/${task.id}`}>
        <div
          className={`flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer ${priorityIndicator[task.priority]}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {showHierarchy && task.depth > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                {Array(task.depth).fill(0).map((_, i) => (
                  <ChevronRight key={i} className="h-3 w-3" />
                ))}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium truncate">{task.title}</p>
              {task.complexity && (
                <span className={`text-xs ${complexityColors[task.complexity]}`}>
                  {task.complexity}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {task.estimated_cost_usd && (
              <span className="text-xs text-muted-foreground">
                {formatCurrency(task.estimated_cost_usd)}
              </span>
            )}
            <StatusBadge status={task.status} size="sm" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/tasks/${task.id}`}>
      <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${priorityIndicator[task.priority]}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              {showHierarchy && task.depth > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GitBranch className="h-3 w-3" />
                  <span>Subtask (depth {task.depth})</span>
                </div>
              )}
              <CardTitle className="text-lg line-clamp-1">{task.title}</CardTitle>
            </div>
            <StatusBadge status={task.status} />
          </div>
          <CardDescription className="line-clamp-2">
            {task.description || 'No description'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {task.complexity && (
              <span className={`flex items-center gap-1 ${complexityColors[task.complexity]}`}>
                {task.complexity}
              </span>
            )}
            {task.estimated_cost_usd && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Est: {formatCurrency(task.estimated_cost_usd)}
              </span>
            )}
            {task.actual_cost_usd && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <DollarSign className="h-3 w-3" />
                Actual: {formatCurrency(task.actual_cost_usd)}
              </span>
            )}
            {task.assigned_agent_id && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Assigned
              </span>
            )}
          </div>

          {hasSubtasks && task.subtask_count > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              <span>
                {task.completed_subtask_count}/{task.subtask_count} subtasks completed
              </span>
            </div>
          )}

          {(task.started_at || task.completed_at) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {task.completed_at
                ? `Completed ${formatRelativeTime(task.completed_at)}`
                : task.started_at
                  ? `Started ${formatRelativeTime(task.started_at)}`
                  : null
              }
            </div>
          )}

          {(onCheckout || onRelease) && (
            <div className="flex gap-2 pt-2" onClick={(e) => e.preventDefault()}>
              {canCheckout && onCheckout && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCheckout(task.id)}
                >
                  Checkout
                </Button>
              )}
              {canRelease && onRelease && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRelease(task.id)}
                >
                  Release
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
