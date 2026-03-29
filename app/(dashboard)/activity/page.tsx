'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RunCard, RunCardSkeleton, Run } from '@/components/RunCard';
import { PortfolioStatus } from '@/components/PortfolioStatus';

export default function ActivityPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRuns = async () => {
    try {
      const response = await fetch('/api/runs');
      if (!response.ok) {
        throw new Error('Failed to fetch runs');
      }
      const data = await response.json();
      setRuns(data.runs || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    // Poll every 5 seconds for updates
    const intervalId = setInterval(fetchRuns, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const filteredRuns = runs.filter((run) => {
    // Filter by state
    if (filter !== 'all' && run.state !== filter) {
      return false;
    }
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        run.runId.toLowerCase().includes(searchLower) ||
        run.title?.toLowerCase().includes(searchLower) ||
        run.summary?.toLowerCase().includes(searchLower) ||
        run.agent?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const runningCount = runs.filter((r) => r.state === 'running').length;
  const completedCount = runs.filter((r) => r.state === 'completed').length;
  const failedCount = runs.filter((r) => r.state === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
          <p className="text-muted-foreground">
            Real-time view of all agent runs across the portfolio
          </p>
        </div>
        <Button onClick={fetchRuns} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Portfolio Status Widget */}
      <PortfolioStatus />

      {/* Stats Bar */}
      <div className="flex items-center gap-4">
        <Card className="flex-1">
          <CardContent className="flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">Total Runs</span>
            <span className="text-2xl font-bold">{runs.length}</span>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">Running</span>
            <span className="text-2xl font-bold text-blue-600">{runningCount}</span>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">Completed</span>
            <span className="text-2xl font-bold text-green-600">{completedCount}</span>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">Failed</span>
            <span className="text-2xl font-bold text-red-600">{failedCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search runs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'running' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('running')}
          >
            Running
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
          <Button
            variant={filter === 'failed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('failed')}
          >
            Failed
          </Button>
        </div>
      </div>

      {/* Runs List */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <RunCardSkeleton />
            <RunCardSkeleton />
            <RunCardSkeleton />
          </>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-500">{error}</p>
              <Button onClick={fetchRuns} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : filteredRuns.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm || filter !== 'all'
                  ? 'No runs match your filters'
                  : 'No runs yet. Submit a task via the inbox to get started.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRuns.map((run) => <RunCard key={run.runId} run={run} />)
        )}
      </div>
    </div>
  );
}
