'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Check,
  X,
  Clock,
  AlertTriangle,
  ChevronRight,
  DollarSign,
  Code,
  Database,
  Rocket,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ApprovalRequest {
  id: string;
  operation_type: string;
  operation_details: {
    description?: string;
    estimated_cost?: number;
    risk_level?: 'low' | 'medium' | 'high';
  };
  agent_name?: string;
  task_title?: string;
  requested_at: string;
  status: string;
}

const operationIcons: Record<string, React.ReactNode> = {
  deploy_production: <Rocket className="h-4 w-4" />,
  production_deploy: <Rocket className="h-4 w-4" />,
  cost_threshold: <DollarSign className="h-4 w-4" />,
  delete_files: <Code className="h-4 w-4" />,
  migrate_database: <Database className="h-4 w-4" />,
  alter_schema: <Database className="h-4 w-4" />,
};

const riskColors: Record<string, string> = {
  low: 'text-green-600 bg-green-500/10 border-green-500/20',
  medium: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',
  high: 'text-red-600 bg-red-500/10 border-red-500/20',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const hours = Math.floor(diffMins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ApprovalQueue() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/approvals?status=pending&limit=5');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActioning(id);
    try {
      await fetch(`/api/approvals/${id}/${action}`, { method: 'POST' });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Failed to action approval:', error);
    } finally {
      setActioning(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-500" />
            Approval Queue
            {requests.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {requests.length}
              </Badge>
            )}
          </CardTitle>
          <Link href="/approvals">
            <Button variant="ghost" size="sm" className="text-xs">
              View All
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
            Loading...
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Check className="h-8 w-8 mx-auto mb-2 opacity-50 text-green-500" />
            <p className="text-sm">All clear!</p>
            <p className="text-xs mt-1">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const risk = request.operation_details.risk_level || 'medium';
              return (
                <div
                  key={request.id}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="p-1.5 rounded-md bg-muted">
                        {operationIcons[request.operation_type] || (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm">
                          {request.operation_details.description ||
                            request.operation_type.replace(/_/g, ' ')}
                        </div>
                        {request.agent_name && (
                          <div className="text-xs text-muted-foreground">
                            by {request.agent_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('shrink-0 capitalize', riskColors[risk])}
                    >
                      {risk} risk
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(request.requested_at)}
                      {request.operation_details.estimated_cost && (
                        <>
                          <span>•</span>
                          <DollarSign className="h-3 w-3" />
                          ${request.operation_details.estimated_cost.toFixed(2)}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                        onClick={() => handleAction(request.id, 'reject')}
                        disabled={actioning === request.id}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                        onClick={() => handleAction(request.id, 'approve')}
                        disabled={actioning === request.id}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
