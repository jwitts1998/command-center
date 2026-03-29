'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';

export interface Run {
  runId: string;
  state: 'queued' | 'running' | 'completed' | 'failed' | 'pending_confirmation';
  phase?: string;
  agent?: string;
  title?: string;
  summary?: string;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
}

interface RunCardProps {
  run: Run;
  showLink?: boolean;
}

const stateColors: Record<Run['state'], string> = {
  queued: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  running: 'bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse',
  completed: 'bg-green-500/10 text-green-600 border-green-500/20',
  failed: 'bg-red-500/10 text-red-600 border-red-500/20',
  pending_confirmation: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

const agentColors: Record<string, string> = {
  ceo: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  cto: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  cmo: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  triage: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export function RunCard({ run, showLink = true }: RunCardProps) {
  const content = (
    <Card className={`transition-all ${showLink ? 'hover:border-primary/50 cursor-pointer' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate flex-1">
            {run.title || run.runId}
          </CardTitle>
          <div className="flex items-center gap-2 ml-2">
            {run.agent && (
              <Badge
                variant="outline"
                className={`uppercase text-xs ${agentColors[run.agent] || ''}`}
              >
                {run.agent}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`capitalize text-xs ${stateColors[run.state]}`}
            >
              {run.state.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {run.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {run.summary}
          </p>
        )}
        {run.error && (
          <p className="text-sm text-red-500 line-clamp-2 mb-2 font-mono text-xs">
            {run.error}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {run.phase && (
              <span className="capitalize">Phase: {run.phase}</span>
            )}
          </div>
          <span>
            {run.startedAt ? formatRelativeTime(run.startedAt) : 'Pending'}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  if (showLink) {
    return (
      <Link href={`/activity/${run.runId}`}>
        {content}
      </Link>
    );
  }

  return content;
}

export function RunCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="flex gap-2">
            <div className="h-5 bg-muted rounded w-12" />
            <div className="h-5 bg-muted rounded w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-8 bg-muted rounded mb-2" />
        <div className="flex justify-between">
          <div className="h-3 bg-muted rounded w-20" />
          <div className="h-3 bg-muted rounded w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
