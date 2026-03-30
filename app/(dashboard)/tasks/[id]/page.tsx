'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { TaskTree } from '@/components/TaskTree';
import { formatDate, formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { TaskWithSubtasks, TaskAuditLogEntry } from '@/types/task';
import type { Agent } from '@/types/agent';
import type { Goal } from '@/types/goal';
import {
  ListTodo,
  ArrowLeft,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  User,
  DollarSign,
  Clock,
  GitBranch,
  Target,
  History,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<TaskWithSubtasks | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [auditLog, setAuditLog] = useState<TaskAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const taskId = params.id as string;

  useEffect(() => {
    Promise.all([fetchTask(), fetchAgents()]);
  }, [taskId]);

  async function fetchTask() {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();
      if (data.success) {
        setTask(data.data);
        if (data.data.goal_id) {
          fetchGoal(data.data.goal_id);
        }
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGoal(goalId: string) {
    try {
      const response = await fetch(`/api/goals/${goalId}`);
      const data = await response.json();
      if (data.success) {
        setGoal(data.data);
      }
    } catch (error) {
      console.error('Error fetching goal:', error);
    }
  }

  async function fetchAgents() {
    try {
      const response = await fetch('/api/agents?status=active');
      const data = await response.json();
      if (data.success) {
        setAgents(data.data);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  }

  async function handleCheckout() {
    setActionLoading('checkout');
    try {
      const response = await fetch(`/api/tasks/${taskId}/checkout`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        fetchTask();
      } else {
        alert(`Checkout failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRelease(status: string = 'pending') {
    setActionLoading('release');
    try {
      const response = await fetch(`/api/tasks/${taskId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        fetchTask();
      } else {
        alert(`Release failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleStatusChange(status: string) {
    setActionLoading('status');
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        fetchTask();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAssign(agentId: string) {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_agent_id: agentId || null }),
      });
      const data = await response.json();
      if (data.success) {
        fetchTask();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        if (task?.goal_id) {
          router.push(`/goals/${task.goal_id}`);
        } else {
          router.push('/tasks');
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading task...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Task not found</p>
        <Link href="/tasks">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>
      </div>
    );
  }

  const isCheckedOut = task.checkout_token !== null;
  const canCheckout = (task.status === 'pending' || task.status === 'ready') && !isCheckedOut;

  const complexityColors: Record<string, string> = {
    trivial: 'text-gray-500',
    simple: 'text-green-600 dark:text-green-400',
    moderate: 'text-yellow-600 dark:text-yellow-400',
    complex: 'text-orange-600 dark:text-orange-400',
    epic: 'text-red-600 dark:text-red-400',
  };

  const priorityColors: Record<string, string> = {
    critical: 'text-red-600 dark:text-red-400',
    high: 'text-orange-600 dark:text-orange-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    low: 'text-gray-600 dark:text-gray-400',
  };

  const assignedAgent = agents.find(a => a.id === task.assigned_agent_id);

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex items-center gap-2">
        <Link href="/tasks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>
        {goal && (
          <>
            <span className="text-muted-foreground">/</span>
            <Link href={`/goals/${goal.id}`}>
              <Button variant="ghost" size="sm">
                <Target className="h-4 w-4 mr-2" />
                {goal.title}
              </Button>
            </Link>
          </>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <ListTodo className={`h-6 w-6 ${priorityColors[task.priority]}`} />
            <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
            <StatusBadge status={task.status} />
            {isCheckedOut && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded">
                Checked Out
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-muted-foreground max-w-2xl">{task.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {canCheckout && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckout}
              disabled={actionLoading !== null}
            >
              {actionLoading === 'checkout' ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              Checkout
            </Button>
          )}
          {isCheckedOut && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRelease('completed')}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'release' ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                )}
                Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRelease('pending')}
                disabled={actionLoading !== null}
              >
                Release
              </Button>
            </>
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
            <CardTitle className="text-sm font-medium">Priority</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${priorityColors[task.priority]}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold capitalize ${priorityColors[task.priority]}`}>
              {task.priority}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complexity</CardTitle>
            <GitBranch className={`h-4 w-4 ${complexityColors[task.complexity || 'moderate']}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold capitalize ${complexityColors[task.complexity || 'moderate']}`}>
              {task.complexity || '-'}
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
              {task.estimated_cost_usd ? formatCurrency(task.estimated_cost_usd) : '-'}
            </div>
            {task.actual_cost_usd && (
              <p className="text-xs text-muted-foreground">
                Actual: {formatCurrency(task.actual_cost_usd)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned To</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Select
              value={task.assigned_agent_id || 'unassigned'}
              onValueChange={(value) => handleAssign(value === 'unassigned' ? '' : value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Timing Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Created</p>
              <p className="text-sm font-medium">{formatDate(task.created_at)}</p>
            </div>
            {task.started_at && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Started</p>
                <p className="text-sm font-medium">{formatDate(task.started_at)}</p>
              </div>
            )}
            {task.completed_at && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Completed</p>
                <p className="text-sm font-medium">{formatDate(task.completed_at)}</p>
              </div>
            )}
            {isCheckedOut && task.checkout_expires_at && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Checkout Expires</p>
                <p className="text-sm font-medium">{formatRelativeTime(task.checkout_expires_at)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subtasks */}
      {task.subtask_count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subtasks</CardTitle>
            <CardDescription>
              {task.completed_subtask_count}/{task.subtask_count} completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TaskTree tasks={task.subtasks} />
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {task.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('ready')}
                disabled={actionLoading !== null}
              >
                Mark Ready
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('blocked')}
                disabled={actionLoading !== null}
              >
                Mark Blocked
              </Button>
            )}
            {task.status === 'blocked' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('in_progress')}
                disabled={actionLoading !== null}
              >
                Unblock
              </Button>
            )}
            {(task.status === 'pending' || task.status === 'ready' || task.status === 'blocked') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('cancelled')}
                disabled={actionLoading !== null}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
