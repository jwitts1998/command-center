'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SessionList } from '@/components/SessionCard';
import { ExportButton } from '@/components/export/ExportButton';
import Link from 'next/link';
import type { Project } from '@/types/project';

interface SessionWithProject {
  id: string;
  project_id: string;
  project_name?: string;
  user_prompt: string | null;
  enriched_prompt: string | null;
  status: string | null;
  started_at: string;
  completed_at: string | null;
  cost_usd: number;
  tokens_input: number;
  tokens_output: number;
  model_used: string | null;
  agent_type: string | null;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionWithProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    running: 0,
    totalCost: 0,
  });

  useEffect(() => {
    fetchProjects();
    fetchSessions();
  }, [selectedProjectId, selectedStatus]);

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

  async function fetchSessions() {
    setLoading(true);
    try {
      let url = '/api/sessions?limit=50';
      if (selectedProjectId !== 'all') {
        url += `&project_id=${selectedProjectId}`;
      }
      if (selectedStatus !== 'all') {
        url += `&status=${selectedStatus}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        // Enrich sessions with project names
        const enrichedSessions = data.data.map((session: any) => {
          const project = projects.find((p) => p.id === session.project_id);
          return {
            ...session,
            project_name: project?.name,
          };
        });

        setSessions(enrichedSessions);

        // Calculate stats
        const total = enrichedSessions.length;
        const completed = enrichedSessions.filter((s: any) => s.status === 'completed').length;
        const running = enrichedSessions.filter((s: any) => s.status === 'running').length;
        const totalCost = enrichedSessions.reduce((sum: number, s: any) => sum + (s.cost_usd || 0), 0);

        setStats({ total, completed, running, totalCost });
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground">
            Monitor prompt enrichment sessions across all projects
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton exportType="sessions" />
          <Link href="/enrich">
            <Button>New Enrichment</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
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

            <div className="w-48">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={() => fetchSessions()}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>
            Click on a session to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading sessions...
            </div>
          ) : (
            <SessionList
              sessions={sessions}
              showProject={selectedProjectId === 'all'}
              emptyMessage="No sessions found. Try a different filter or start a new enrichment."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
