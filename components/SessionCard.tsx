'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, truncate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface SessionCardProps {
  session: {
    id: string;
    project_id: string;
    project_name?: string;
    user_prompt: string | null;
    enriched_prompt: string | null;
    status: string | null;
    started_at: string | Date;
    completed_at: string | Date | null;
    cost_usd: number;
    tokens_input: number;
    tokens_output: number;
    model_used: string | null;
    agent_type: string | null;
  };
  showProject?: boolean;
}

export function SessionCard({ session, showProject = true }: SessionCardProps) {
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'running':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <Link href={`/sessions/${session.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showProject && session.project_name && (
                <Badge variant="outline" className="text-xs">
                  {session.project_name}
                </Badge>
              )}
              <Badge className={getStatusColor(session.status)}>
                {session.status || 'unknown'}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(session.started_at)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* User Prompt */}
          {session.user_prompt && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Prompt</p>
              <p className="text-sm font-medium">
                {truncate(session.user_prompt, 100)}
              </p>
            </div>
          )}

          {/* Enriched Preview */}
          {session.enriched_prompt && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Enriched</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {truncate(session.enriched_prompt, 150)}
              </p>
            </div>
          )}

          {/* Metadata Row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-3">
              {session.agent_type && (
                <span>Agent: {session.agent_type}</span>
              )}
              {session.model_used && (
                <span>Model: {session.model_used}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {session.tokens_input + session.tokens_output > 0 && (
                <span>
                  {(session.tokens_input + session.tokens_output).toLocaleString()} tokens
                </span>
              )}
              {session.cost_usd > 0 && (
                <span className="font-medium">
                  {formatCurrency(session.cost_usd)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface SessionListProps {
  sessions: SessionCardProps['session'][];
  showProject?: boolean;
  emptyMessage?: string;
}

export function SessionList({
  sessions,
  showProject = true,
  emptyMessage = 'No sessions yet',
}: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          showProject={showProject}
        />
      ))}
    </div>
  );
}
