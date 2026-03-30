'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { TaskTree } from '@/components/TaskTree';
import { TaskCard } from '@/components/TaskCard';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { GoalWithTasks } from '@/types/goal';
import type { Task } from '@/types/task';
import {
  Target,
  Calendar,
  DollarSign,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Play,
  Pause,
  XCircle,
  Loader2,
  List,
  GitBranch,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ViewMode = 'tree' | 'grid';

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [goal, setGoal] = useState<GoalWithTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [decomposing, setDecomposing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');

  const goalId = params.id as string;

  useEffect(() => {
    fetchGoal();
  }, [goalId]);

  async function fetchGoal() {
    try {
      const response = await fetch(`/api/goals/${goalId}`);
      const data = await response.json();
      if (data.success) {
        setGoal(data.data);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching goal:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecompose() {
    setDecomposing(true);
    try {
      const response = await fetch(`/api/goals/${goalId}/decompose`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        fetchGoal(); // Refresh to show new tasks
      } else {
        alert(`Decomposition failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error decomposing goal:', error);
      alert('Failed to decompose goal');
    } finally {
      setDecomposing(false);
    }
  }

  async function handleStatusChange(status: string) {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        fetchGoal();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this goal and all its tasks?')) {
      return;
    }

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        router.push('/goals');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading goal...</p>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Goal not found</p>
        <Link href="/goals">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Goals
          </Button>
        </Link>
      </div>
    );
  }

  const progress = goal.task_count > 0
    ? (goal.completed_task_count / goal.task_count) * 100
    : 0;

  const priorityColors: Record<string, string> = {
    critical: 'text-red-600 dark:text-red-400',
    high: 'text-orange-600 dark:text-orange-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    low: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link href="/goals">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Goals
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Target className={`h-6 w-6 ${priorityColors[goal.priority]}`} />
            <h1 className="text-3xl font-bold tracking-tight">{goal.title}</h1>
            <StatusBadge status={goal.status} />
          </div>
          {goal.description && (
            <p className="text-muted-foreground max-w-2xl">{goal.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {goal.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('paused')}
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          )}
          {goal.status === 'paused' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('active')}
            >
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          )}
          {goal.status === 'active' && goal.task_count > 0 && progress === 100 && (
            <Button
              size="sm"
              onClick={() => handleStatusChange('completed')}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Mark Complete
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
            <p className="text-xs text-muted-foreground">
              {goal.completed_task_count}/{goal.task_count} tasks
            </p>
            <div className="h-2 bg-secondary rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Priority</CardTitle>
            <Target className={`h-4 w-4 ${priorityColors[goal.priority]}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold capitalize ${priorityColors[goal.priority]}`}>
              {goal.priority}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(goal.total_estimated_cost || 0)}
            </div>
            {goal.total_actual_cost > 0 && (
              <p className="text-xs text-muted-foreground">
                Actual: {formatCurrency(goal.total_actual_cost)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goal.target_date ? formatDate(goal.target_date).split(',')[0] : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Created {formatDate(goal.created_at).split(',')[0]}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>
                {goal.task_count === 0
                  ? 'No tasks yet. Decompose this goal to create tasks automatically.'
                  : `${goal.task_count} tasks in this goal`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {goal.task_count > 0 && (
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setViewMode('tree')}
                  >
                    <GitBranch className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {goal.status === 'active' && (
                <Button
                  onClick={handleDecompose}
                  disabled={decomposing}
                >
                  {decomposing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Decomposing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {goal.task_count === 0 ? 'Decompose with AI' : 'Decompose More'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {goal.task_count === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Use AI to automatically decompose this goal into actionable tasks
              </p>
              <Button onClick={handleDecompose} disabled={decomposing}>
                {decomposing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Decomposing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Decompose Goal
                  </>
                )}
              </Button>
            </div>
          ) : viewMode === 'tree' ? (
            <TaskTree tasks={goal.tasks} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {goal.tasks.map((task: Task) => (
                <TaskCard key={task.id} task={task} compact />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
