'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskCard } from '@/components/TaskCard';
import { ExportButton } from '@/components/export/ExportButton';
import type { Task, TaskStatus } from '@/types/task';
import type { Agent } from '@/types/agent';
import type { Goal } from '@/types/goal';
import { ListTodo, CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterGoal, setFilterGoal] = useState<string>('all');

  useEffect(() => {
    Promise.all([fetchTasks(), fetchAgents(), fetchGoals()]);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filterStatus, filterAgent, filterGoal]);

  async function fetchTasks() {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterAgent !== 'all') params.set('assigned_agent_id', filterAgent);
      if (filterGoal !== 'all') params.set('goal_id', filterGoal);

      const response = await fetch(`/api/tasks?${params}`);
      const data = await response.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
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

  async function fetchGoals() {
    try {
      const response = await fetch('/api/goals?status=active');
      const data = await response.json();
      if (data.success) {
        setGoals(data.data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  }

  async function handleCheckout(taskId: string) {
    try {
      const response = await fetch(`/api/tasks/${taskId}/checkout`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        fetchTasks();
      } else {
        alert(`Checkout failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error checking out task:', error);
    }
  }

  async function handleRelease(taskId: string) {
    try {
      const response = await fetch(`/api/tasks/${taskId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      });
      const data = await response.json();
      if (data.success) {
        fetchTasks();
      } else {
        alert(`Release failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error releasing task:', error);
    }
  }

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending' || t.status === 'ready').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked' || t.status === 'failed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            View and manage all tasks across goals
          </p>
        </div>
        <ExportButton exportType="tasks" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked/Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blocked}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="w-40">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={filterGoal} onValueChange={setFilterGoal}>
            <SelectTrigger>
              <SelectValue placeholder="Goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Goals</SelectItem>
              {goals.map((goal) => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={filterAgent} onValueChange={setFilterAgent}>
            <SelectTrigger>
              <SelectValue placeholder="Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks Grid */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No tasks found</p>
            <p className="text-sm text-muted-foreground">
              Tasks are created when you decompose goals
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onCheckout={handleCheckout}
              onRelease={handleRelease}
            />
          ))}
        </div>
      )}
    </div>
  );
}
