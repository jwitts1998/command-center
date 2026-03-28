import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { query, queryOne } from '@/lib/db/client';
import { formatRelativeTime, truncate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getDashboardStats() {
  try {
    // Get project stats
    const projectStats = await queryOne<{ total: number; active: number }>(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active
       FROM projects`
    );

    // Get session stats
    const sessionStats = await queryOne<{
      total: number;
      running: number;
      total_cost: number;
    }>(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'running') as running,
        COALESCE(SUM(cost_usd), 0) as total_cost
       FROM agent_sessions`
    );

    // Get this month's stats
    const month = new Date().toISOString().slice(0, 7);
    const monthStats = await queryOne<{ month_cost: number }>(
      `SELECT COALESCE(SUM(cost_usd), 0) as month_cost
       FROM agent_sessions
       WHERE started_at >= $1`,
      [`${month}-01`]
    );

    // Get patterns count
    const patternStats = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM patterns WHERE confidence > 0.5`
    );

    return {
      totalProjects: Number(projectStats?.total || 0),
      activeProjects: Number(projectStats?.active || 0),
      totalSessions: Number(sessionStats?.total || 0),
      activeSessions: Number(sessionStats?.running || 0),
      totalCost: Number(sessionStats?.total_cost || 0),
      monthCost: Number(monthStats?.month_cost || 0),
      patternsLearned: Number(patternStats?.total || 0),
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalProjects: 0,
      activeProjects: 0,
      totalSessions: 0,
      activeSessions: 0,
      totalCost: 0,
      monthCost: 0,
      patternsLearned: 0,
    };
  }
}

async function getRecentSessions() {
  try {
    const sessions = await query<{
      id: string;
      user_prompt: string;
      status: string;
      started_at: string;
      cost_usd: number;
      project_id: string;
    }>(
      `SELECT s.id, s.user_prompt, s.status, s.started_at, s.cost_usd, s.project_id, p.name as project_name
       FROM agent_sessions s
       LEFT JOIN projects p ON s.project_id = p.id
       WHERE s.user_prompt IS NOT NULL
       ORDER BY s.started_at DESC
       LIMIT 5`
    );
    return sessions;
  } catch (error) {
    console.error('Error fetching recent sessions:', error);
    return [];
  }
}

export default async function DashboardPage() {
  const [stats, recentSessions] = await Promise.all([
    getDashboardStats(),
    getRecentSessions(),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Multi-Project Command Center with Prompt Enrichment
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/enrich">
            <Button>Enrich Prompt</Button>
          </Link>
          <Link href="/projects">
            <Button variant="outline">View Projects</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProjects} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSessions} total this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.totalCost.toFixed(2)} all time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patterns Learned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.patternsLearned}</div>
            <p className="text-xs text-muted-foreground">
              Cross-project intelligence
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Set up your first project to start using the Command Center
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">1</Badge>
              <span className="text-sm">Create your first project</span>
              <Link href="/projects?action=create">
                <Button variant="link" size="sm">Create Project →</Button>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">2</Badge>
              <span className="text-sm">Install the project plugin</span>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">3</Badge>
              <span className="text-sm">Start enriching prompts</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>
              Latest prompt enrichment sessions across all projects
            </CardDescription>
          </div>
          <Link href="/sessions">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No sessions yet. <Link href="/enrich" className="text-primary hover:underline">Start enriching prompts</Link>.
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session: any) => (
                <Link key={session.id} href={`/sessions/${session.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {truncate(session.user_prompt || 'No prompt', 60)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {session.project_name || 'Unknown'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(session.started_at)}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={session.status === 'completed' ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {session.status || 'unknown'}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
