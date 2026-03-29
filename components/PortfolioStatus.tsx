'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatRelativeTime } from '@/lib/utils';

interface RepoStatus {
  phase: string;
  currentTask?: string;
  blockers: string[];
  lastUpdated: string;
  health: 'healthy' | 'warning' | 'error' | 'unknown';
}

interface Repo {
  id: string;
  name: string;
  path: string;
  status: RepoStatus;
}

interface PortfolioStatusData {
  updatedAt: string;
  repos: Repo[];
  summary: {
    total: number;
    healthy: number;
    warning: number;
    error: number;
    unknown: number;
  };
}

const healthColors: Record<string, string> = {
  healthy: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  unknown: 'bg-gray-400',
};

const healthBadgeVariants: Record<string, string> = {
  healthy: 'bg-green-500/10 text-green-600 border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  error: 'bg-red-500/10 text-red-600 border-red-500/20',
  unknown: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export function PortfolioStatus() {
  const [data, setData] = useState<PortfolioStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio status');
      }
      const statusData = await response.json();
      setData(statusData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/status', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to refresh portfolio status');
      }
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 30 seconds
    const intervalId = setInterval(fetchStatus, 30000);
    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Portfolio Status
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-sm">{error}</p>
          <Button onClick={fetchStatus} variant="outline" size="sm" className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.repos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Portfolio Status
            <Badge variant="outline">No repos</Badge>
          </CardTitle>
          <CardDescription>
            Register execution repos to see their status here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the MCP portfolio server to register repos:
          </p>
          <code className="text-xs bg-muted p-2 rounded block mt-2">
            mcp call register_repo --name &quot;My App&quot; --path /path/to/repo
          </code>
        </CardContent>
      </Card>
    );
  }

  const { summary, repos } = data;
  const healthyPercent = summary.total > 0 ? (summary.healthy / summary.total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Portfolio Status</CardTitle>
            <CardDescription>
              {summary.total} repos registered · Updated {formatRelativeTime(data.updatedAt)}
            </CardDescription>
          </div>
          <Button
            onClick={refreshStatus}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Summary Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Health</span>
            <span className="font-medium">{healthyPercent.toFixed(0)}% healthy</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-muted">
            {summary.healthy > 0 && (
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${(summary.healthy / summary.total) * 100}%` }}
              />
            )}
            {summary.warning > 0 && (
              <div
                className="bg-yellow-500 transition-all"
                style={{ width: `${(summary.warning / summary.total) * 100}%` }}
              />
            )}
            {summary.error > 0 && (
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${(summary.error / summary.total) * 100}%` }}
              />
            )}
            {summary.unknown > 0 && (
              <div
                className="bg-gray-400 transition-all"
                style={{ width: `${(summary.unknown / summary.total) * 100}%` }}
              />
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {summary.healthy} healthy
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              {summary.warning} warning
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {summary.error} error
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              {summary.unknown} unknown
            </span>
          </div>
        </div>

        {/* Repo List */}
        <div className="space-y-2">
          {repos.slice(0, 5).map((repo) => (
            <div
              key={repo.id}
              className="flex items-center justify-between p-2 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${healthColors[repo.status.health]}`} />
                <div>
                  <p className="text-sm font-medium">{repo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {repo.status.phase}
                    {repo.status.currentTask && ` · ${repo.status.currentTask}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {repo.status.blockers.length > 0 && (
                  <Badge variant="outline" className="text-xs text-red-600">
                    {repo.status.blockers.length} blocker{repo.status.blockers.length > 1 ? 's' : ''}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${healthBadgeVariants[repo.status.health]}`}
                >
                  {repo.status.health}
                </Badge>
              </div>
            </div>
          ))}
          {repos.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              +{repos.length - 5} more repos
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
