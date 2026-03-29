'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RunCard, Run } from '@/components/RunCard';
import { EventTimeline, TimelineEvent } from '@/components/EventTimeline';
import { useRunStream } from '@/hooks/useRunStream';
import { formatDate } from '@/lib/utils';

interface RunDetailPageProps {
  params: Promise<{ runId: string }>;
}

export default function RunDetailPage({ params }: RunDetailPageProps) {
  const { runId } = use(params);
  const [run, setRun] = useState<Run | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial run data
  useEffect(() => {
    const fetchRun = async () => {
      try {
        const response = await fetch(`/api/runs/${runId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch run');
        }
        const data = await response.json();
        setRun(data.run);
        setEvents(data.events || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRun();
  }, [runId]);

  // Use SSE for live events if run is still active
  const isActive = run?.state === 'running' || run?.state === 'queued';
  const { events: streamEvents, isConnected } = useRunStream({
    runId,
    autoConnect: isActive,
    onEvent: (event) => {
      setEvents((prev) => [...prev, event]);

      // Update run state based on events
      if (event.type === 'run_completed') {
        setRun((prev) => prev ? { ...prev, state: 'completed' } : null);
      } else if (event.type === 'run_failed') {
        setRun((prev) => prev ? {
          ...prev,
          state: 'failed',
          error: event.data?.error as string,
        } : null);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/activity">
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="h-40 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/activity">
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
          <h1 className="text-2xl font-bold">Run Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-500">{error || 'Run not found'}</p>
            <Link href="/activity">
              <Button className="mt-4">Return to Activity</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/activity">
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{run.title || run.runId}</h1>
            <p className="text-sm text-muted-foreground font-mono">{run.runId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              ● Live
            </Badge>
          )}
          {run.agent && (
            <Badge variant="outline" className="uppercase">
              {run.agent}
            </Badge>
          )}
        </div>
      </div>

      {/* Run Summary Card */}
      <RunCard run={run} showLink={false} />

      {/* Run Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Run Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Run ID</span>
              <span className="text-sm font-mono">{run.runId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">State</span>
              <Badge variant="outline" className="capitalize">{run.state}</Badge>
            </div>
            {run.phase && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Phase</span>
                <span className="text-sm capitalize">{run.phase}</span>
              </div>
            )}
            {run.agent && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Agent</span>
                <Badge variant="outline" className="uppercase">{run.agent}</Badge>
              </div>
            )}
            {run.startedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Started</span>
                <span className="text-sm">{formatDate(run.startedAt)}</span>
              </div>
            )}
            {run.finishedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Finished</span>
                <span className="text-sm">{formatDate(run.finishedAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Info */}
        {(run.title || run.summary) && (
          <Card>
            <CardHeader>
              <CardTitle>Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {run.title && (
                <div>
                  <span className="text-sm text-muted-foreground">Title</span>
                  <p className="text-sm font-medium mt-1">{run.title}</p>
                </div>
              )}
              {run.summary && (
                <div>
                  <span className="text-sm text-muted-foreground">Summary</span>
                  <p className="text-sm mt-1">{run.summary}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Error Display */}
      {run.error && (
        <Card className="border-red-500/50">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-red-600 whitespace-pre-wrap font-mono bg-red-500/10 p-4 rounded">
              {run.error}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Event Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Timeline</CardTitle>
              <CardDescription>
                {events.length} event{events.length !== 1 ? 's' : ''} recorded
              </CardDescription>
            </div>
            {isConnected && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                Streaming
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <EventTimeline events={events} isLive={isConnected} />
        </CardContent>
      </Card>
    </div>
  );
}
