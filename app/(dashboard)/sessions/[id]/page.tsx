'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';

interface SessionDetail {
  id: string;
  project_id: string;
  agent_type: string | null;
  task_id: string | null;
  status: string | null;
  started_at: string;
  completed_at: string | null;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  model_used: string | null;
  user_prompt: string | null;
  enriched_prompt: string | null;
  metadata: Record<string, any>;
}

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  async function fetchSession() {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();
      if (data.success) {
        setSession(data.data);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'running':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Session not found</p>
        <Link href="/sessions">
          <Button>Back to Sessions</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight">Session Details</h1>
            <Badge className={getStatusColor(session.status)}>
              {session.status || 'unknown'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm font-mono">
            {session.id}
          </p>
        </div>
        <Link href="/sessions">
          <Button variant="outline">Back to Sessions</Button>
        </Link>
      </div>

      {/* Metadata Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(session.started_at)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {session.completed_at ? formatDate(session.completed_at) : 'In progress...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {session.tokens_input.toLocaleString()} in / {session.tokens_output.toLocaleString()} out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{formatCurrency(session.cost_usd)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <div className="grid gap-4 md:grid-cols-2">
        {session.model_used && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Model</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">{session.model_used}</Badge>
            </CardContent>
          </Card>
        )}

        {session.agent_type && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Agent Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{session.agent_type}</Badge>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Prompt */}
      {session.user_prompt && (
        <Card>
          <CardHeader>
            <CardTitle>Original Prompt</CardTitle>
            <CardDescription>The user's initial prompt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{session.user_prompt}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enriched Prompt */}
      {session.enriched_prompt && (
        <Card>
          <CardHeader>
            <CardTitle>Enriched Prompt</CardTitle>
            <CardDescription>The context-enriched prompt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-accent/30 rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {session.enriched_prompt}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      {session.metadata && Object.keys(session.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>Additional session data</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(session.metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
