'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { HeartbeatIndicator } from '@/components/HeartbeatIndicator';
import { formatDate, formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { Agent, AgentExecutionSession } from '@/types/agent';
import type { Task } from '@/types/task';
import {
  Bot,
  ArrowLeft,
  Play,
  Pause,
  XCircle,
  DollarSign,
  Clock,
  Cpu,
  Activity,
  Loader2,
  Users,
  Send,
} from 'lucide-react';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const agentId = params.id as string;

  useEffect(() => {
    Promise.all([fetchAgent(), fetchAgentTasks()]);
  }, [agentId]);

  async function fetchAgent() {
    try {
      const response = await fetch(`/api/agents/${agentId}`);
      const data = await response.json();
      if (data.success) {
        setAgent(data.data);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching agent:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAgentTasks() {
    try {
      const response = await fetch(`/api/tasks?assigned_agent_id=${agentId}&limit=10`);
      const data = await response.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }

  async function handlePause() {
    setActionLoading('pause');
    try {
      const response = await fetch(`/api/agents/${agentId}/pause`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        fetchAgent();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResume() {
    setActionLoading('resume');
    try {
      const response = await fetch(`/api/agents/${agentId}/resume`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        fetchAgent();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleHeartbeat() {
    setActionLoading('heartbeat');
    try {
      const response = await fetch(`/api/agents/${agentId}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      const data = await response.json();
      if (data.success) {
        fetchAgent();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this agent?')) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        router.push('/agents');
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
        <p className="text-muted-foreground">Loading agent...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Agent not found</p>
        <Link href="/agents">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </Link>
      </div>
    );
  }

  const budgetUsed = agent.monthly_budget_usd
    ? (agent.current_month_spend_usd / agent.monthly_budget_usd) * 100
    : 0;

  const roleColors: Record<string, string> = {
    executive: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    specialist: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    worker: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    coordinator: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  };

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link href="/agents">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <HeartbeatIndicator
              status={agent.status}
              lastHeartbeat={agent.last_heartbeat}
            />
            <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
            <StatusBadge status={agent.status} />
            <Badge
              variant="outline"
              className={`capitalize ${roleColors[agent.role]}`}
            >
              {agent.role}
            </Badge>
          </div>
          {agent.description && (
            <p className="text-muted-foreground max-w-2xl">{agent.description}</p>
          )}
          <p className="text-sm text-muted-foreground">@{agent.slug}</p>
        </div>
        <div className="flex gap-2">
          {agent.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePause}
              disabled={actionLoading !== null}
            >
              {actionLoading === 'pause' ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Pause className="h-4 w-4 mr-1" />
              )}
              Pause
            </Button>
          )}
          {agent.status === 'paused' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResume}
              disabled={actionLoading !== null}
            >
              {actionLoading === 'resume' ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              Resume
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleHeartbeat}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'heartbeat' ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Send Heartbeat
          </Button>
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
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(agent.current_month_spend_usd)}
            </div>
            {agent.monthly_budget_usd && (
              <>
                <p className="text-xs text-muted-foreground">
                  of {formatCurrency(agent.monthly_budget_usd)} budget
                </p>
                <div className="h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      budgetUsed > 90
                        ? 'bg-red-500'
                        : budgetUsed > 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heartbeat Mode</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {agent.heartbeat_mode.replace('_', ' ')}
            </div>
            <p className="text-xs text-muted-foreground">
              Interval: {agent.heartbeat_interval_seconds}s
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Heartbeat</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agent.last_heartbeat
                ? formatRelativeTime(agent.last_heartbeat)
                : 'Never'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adapter</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {agent.adapter_type}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capabilities & Specializations */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
            <CardDescription>Skills this agent can perform</CardDescription>
          </CardHeader>
          <CardContent>
            {agent.capabilities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {agent.capabilities.map((cap) => (
                  <Badge key={cap} variant="secondary">
                    {cap}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No capabilities defined</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Specializations</CardTitle>
            <CardDescription>Deep expertise areas</CardDescription>
          </CardHeader>
          <CardContent>
            {agent.specializations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {agent.specializations.map((spec) => (
                  <Badge key={spec} variant="outline">
                    {spec}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No specializations defined</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assigned Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Tasks</CardTitle>
          <CardDescription>Tasks currently assigned to this agent</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No tasks assigned to this agent
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      {task.complexity && (
                        <span className="text-xs text-muted-foreground">
                          {task.complexity}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={task.status} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">System Prompt Path</p>
              <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {agent.system_prompt_path || 'Not configured'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Reports To</p>
              <p className="text-sm">
                {agent.reports_to || 'None (top-level)'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Created</p>
              <p className="text-sm">{formatDate(agent.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
              <p className="text-sm">{formatDate(agent.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
