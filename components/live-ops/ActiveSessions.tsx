'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  Zap,
  Megaphone,
  Sparkles,
  Clock,
  DollarSign,
  Pause,
  Play,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ActiveSession {
  id: string;
  agent_slug: string;
  agent_name: string;
  task_title: string;
  task_id: string;
  status: string;
  started_at: string;
  total_cost_usd: number;
  total_tokens: number;
  progress?: number;
}

const agentIcons: Record<string, React.ReactNode> = {
  ceo: <Sparkles className="h-4 w-4 text-purple-500" />,
  cto: <Zap className="h-4 w-4 text-blue-500" />,
  cmo: <Megaphone className="h-4 w-4 text-green-500" />,
};

const agentColors: Record<string, string> = {
  ceo: 'border-purple-500/50 bg-purple-500/5',
  cto: 'border-blue-500/50 bg-blue-500/5',
  cmo: 'border-green-500/50 bg-green-500/5',
};

function formatDuration(startedAt: string): string {
  const start = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just started';
  if (diffMins < 60) return `${diffMins}m`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m`;
}

export function ActiveSessions() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/agents?status=active&include_sessions=true');
      if (res.ok) {
        const data = await res.json();
        // Transform agent data into sessions format
        const activeSessions: ActiveSession[] = [];
        for (const agent of data.agents || []) {
          if (agent.current_session) {
            activeSessions.push({
              id: agent.current_session.id,
              agent_slug: agent.slug,
              agent_name: agent.name,
              task_title: agent.current_session.task_title || 'Working...',
              task_id: agent.current_session.task_id,
              status: agent.current_session.status,
              started_at: agent.current_session.created_at,
              total_cost_usd: agent.current_session.total_cost_usd || 0,
              total_tokens: agent.current_session.total_tokens || 0,
              progress: agent.current_session.progress,
            });
          }
        }
        setSessions(activeSessions);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // Poll every 5 seconds
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Active Sessions
            {sessions.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {sessions.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active sessions</p>
            <p className="text-xs mt-1">Agents are idle and ready for work</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'p-3 rounded-lg border transition-colors',
                  agentColors[session.agent_slug] || 'border-border'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-md bg-background">
                      {agentIcons[session.agent_slug] || <Bot className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">
                        {session.agent_name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {session.task_title}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 bg-green-500/10 text-green-600 border-green-500/20"
                  >
                    <span className="relative flex h-2 w-2 mr-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    Active
                  </Badge>
                </div>

                {session.progress !== undefined && (
                  <div className="mt-3">
                    <Progress value={session.progress} className="h-1.5" />
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(session.started_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${session.total_cost_usd.toFixed(3)}
                    </span>
                  </div>
                  <Link href={`/tasks/${session.task_id}`}>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      View
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
