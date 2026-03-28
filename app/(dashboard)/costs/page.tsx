'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import type { Project } from '@/types/project';

interface ProjectCost {
  projectId: string;
  projectName: string;
  totalCost: number;
  sessionCount: number;
  monthlyBudget: number | null;
  monthlySpent: number;
  percentUsed: number;
}

interface BudgetAlert {
  projectId: string;
  projectName: string;
  month: string;
  limitUsd: number;
  spentUsd: number;
  percentUsed: number;
  status: 'warning' | 'critical' | 'exceeded';
}

interface CostSummary {
  totalCost: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  sessionCount: number;
  byModel: Record<string, { cost: number; sessions: number; tokensInput: number; tokensOutput: number }>;
  byAgentType: Record<string, { cost: number; sessions: number }>;
  byDay: Array<{ date: string; cost: number; sessions: number }>;
  budget: {
    projectId: string;
    month: string;
    limitUsd: number;
    spentUsd: number;
    remainingUsd: number;
    percentUsed: number;
    isOverBudget: boolean;
    alertTriggered: boolean;
  } | null;
}

export default function CostsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectCosts, setProjectCosts] = useState<ProjectCost[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().slice(0, 7);
  });
  const [projectSummary, setProjectSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalCost: 0,
    totalSessions: 0,
    totalTokens: 0,
  });

  useEffect(() => {
    fetchProjects();
    fetchAlerts();
    fetchTotalStats();
  }, []);

  useEffect(() => {
    fetchProjectCosts();
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedProjectId !== 'all') {
      fetchProjectSummary();
    } else {
      setProjectSummary(null);
    }
  }, [selectedProjectId, selectedMonth]);

  async function fetchProjects() {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }

  async function fetchProjectCosts() {
    setLoading(true);
    try {
      const response = await fetch(`/api/costs?type=projects&month=${selectedMonth}`);
      const data = await response.json();
      if (data.success) {
        setProjectCosts(data.data);
      }
    } catch (error) {
      console.error('Error fetching project costs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAlerts() {
    try {
      const response = await fetch('/api/costs?type=alerts');
      const data = await response.json();
      if (data.success) {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  }

  async function fetchTotalStats() {
    try {
      const response = await fetch('/api/costs?type=total');
      const data = await response.json();
      if (data.success) {
        setTotalStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching total stats:', error);
    }
  }

  async function fetchProjectSummary() {
    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const response = await fetch(
        `/api/costs?type=summary&project_id=${selectedProjectId}&start=${startDate}&end=${endDate.toISOString().slice(0, 10)}`
      );
      const data = await response.json();
      if (data.success) {
        setProjectSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching project summary:', error);
    }
  }

  function formatCost(cost: number): string {
    if (cost < 0.01) return `$${cost.toFixed(6)}`;
    if (cost < 1) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  }

  function formatTokens(tokens: number): string {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
    return tokens.toString();
  }

  function getStatusBadge(status: 'warning' | 'critical' | 'exceeded') {
    switch (status) {
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Warning</Badge>;
      case 'critical':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Critical</Badge>;
      case 'exceeded':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Exceeded</Badge>;
    }
  }

  // Generate month options for the last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cost Tracking</h1>
          <p className="text-muted-foreground">
            Monitor token usage and API costs across all projects
          </p>
        </div>
      </div>

      {/* Total Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(totalStats.totalCost)}</div>
            <p className="text-xs text-muted-foreground">
              {totalStats.totalSessions} sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTokens(totalStats.totalTokens)}</div>
            <p className="text-xs text-muted-foreground">
              Input + Output
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Budget warnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <Card className="border-yellow-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Budget Alerts
            </CardTitle>
            <CardDescription>
              Projects approaching or exceeding their budget limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={`${alert.projectId}-${alert.month}`}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{alert.projectName}</p>
                      <p className="text-sm text-muted-foreground">{alert.month}</p>
                    </div>
                    {getStatusBadge(alert.status)}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCost(alert.spentUsd)} / {formatCost(alert.limitUsd)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {alert.percentUsed.toFixed(1)}% used
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-48">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month} value={month}>
                      {new Date(month + '-01').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Summary (when specific project selected) */}
      {projectSummary && selectedProjectId !== 'all' && (
        <>
          {/* Budget Progress */}
          {projectSummary.budget && (
            <Card>
              <CardHeader>
                <CardTitle>Budget Status</CardTitle>
                <CardDescription>
                  {selectedMonth} budget progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Spent: {formatCost(projectSummary.budget.spentUsd)}</span>
                  <span>Budget: {formatCost(projectSummary.budget.limitUsd)}</span>
                </div>
                <Progress
                  value={Math.min(projectSummary.budget.percentUsed, 100)}
                  className={
                    projectSummary.budget.isOverBudget
                      ? '[&>div]:bg-red-500'
                      : projectSummary.budget.percentUsed > 80
                      ? '[&>div]:bg-yellow-500'
                      : ''
                  }
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{projectSummary.budget.percentUsed.toFixed(1)}% used</span>
                  <span>{formatCost(projectSummary.budget.remainingUsd)} remaining</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cost by Model */}
          <Card>
            <CardHeader>
              <CardTitle>Cost by Model</CardTitle>
              <CardDescription>
                Token usage and costs per model
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(projectSummary.byModel).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No model usage data for this period
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(projectSummary.byModel).map(([model, data]) => (
                    <div
                      key={model}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{model}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.sessions} sessions | {formatTokens(data.tokensInput)} in / {formatTokens(data.tokensOutput)} out
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCost(data.cost)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost by Agent Type */}
          <Card>
            <CardHeader>
              <CardTitle>Cost by Agent Type</CardTitle>
              <CardDescription>
                Costs per agent type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(projectSummary.byAgentType).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No agent usage data for this period
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(projectSummary.byAgentType).map(([agent, data]) => (
                    <div
                      key={agent}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{agent}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.sessions} sessions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCost(data.cost)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* All Projects Costs */}
      <Card>
        <CardHeader>
          <CardTitle>Project Costs</CardTitle>
          <CardDescription>
            Cost breakdown per project for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Loading costs...
            </p>
          ) : projectCosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No cost data for this period
            </p>
          ) : (
            <div className="space-y-3">
              {projectCosts.map((project) => (
                <div
                  key={project.projectId}
                  className="p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedProjectId(project.projectId)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{project.projectName}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.sessionCount} sessions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCost(project.totalCost)}</p>
                      {project.monthlyBudget && (
                        <p className="text-sm text-muted-foreground">
                          of {formatCost(project.monthlyBudget)} budget
                        </p>
                      )}
                    </div>
                  </div>
                  {project.monthlyBudget && project.monthlyBudget > 0 && (
                    <Progress
                      value={Math.min(project.percentUsed, 100)}
                      className={
                        project.percentUsed > 100
                          ? '[&>div]:bg-red-500'
                          : project.percentUsed > 80
                          ? '[&>div]:bg-yellow-500'
                          : ''
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
