'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Zap,
  Megaphone,
  Sparkles,
  Circle,
  Clock,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  slug: string;
  name: string;
  role: string;
  status: 'active' | 'busy' | 'idle' | 'paused';
  last_heartbeat?: string;
  current_task?: string;
  tasks_completed_today?: number;
}

const agentConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  ceo: {
    icon: <Sparkles className="h-5 w-5" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  cto: {
    icon: <Zap className="h-5 w-5" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  cmo: {
    icon: <Megaphone className="h-5 w-5" />,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
};

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  active: {
    label: 'Working',
    color: 'text-green-600',
    dot: 'bg-green-500',
  },
  busy: {
    label: 'Busy',
    color: 'text-yellow-600',
    dot: 'bg-yellow-500',
  },
  idle: {
    label: 'Idle',
    color: 'text-muted-foreground',
    dot: 'bg-gray-400',
  },
  paused: {
    label: 'Paused',
    color: 'text-red-600',
    dot: 'bg-red-500',
  },
};

export function AgentUtilization() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents');
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents || []);
        } else {
          // Mock data for demo
          setAgents([
            { id: '1', slug: 'ceo', name: 'CEO Agent', role: 'executive', status: 'idle', tasks_completed_today: 3 },
            { id: '2', slug: 'cto', name: 'CTO Agent', role: 'executive', status: 'active', current_task: 'Implementing dark mode', tasks_completed_today: 7 },
            { id: '3', slug: 'cmo', name: 'CMO Agent', role: 'executive', status: 'idle', tasks_completed_today: 2 },
          ]);
        }
      } catch {
        // Mock data for demo
        setAgents([
          { id: '1', slug: 'ceo', name: 'CEO Agent', role: 'executive', status: 'idle', tasks_completed_today: 3 },
          { id: '2', slug: 'cto', name: 'CTO Agent', role: 'executive', status: 'active', current_task: 'Implementing dark mode', tasks_completed_today: 7 },
          { id: '3', slug: 'cmo', name: 'CMO Agent', role: 'executive', status: 'idle', tasks_completed_today: 2 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
    const interval = setInterval(fetchAgents, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = agents.filter((a) => a.status === 'active' || a.status === 'busy').length;
  const totalCount = agents.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Agent Utilization
          </CardTitle>
          <Badge variant="outline" className="font-mono">
            {activeCount}/{totalCount} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
            Loading...
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => {
              const config = agentConfig[agent.slug] || {
                icon: <Users className="h-5 w-5" />,
                color: 'text-muted-foreground',
                bgColor: 'bg-muted',
              };
              const status = statusConfig[agent.status] || statusConfig.idle;

              return (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {/* Agent Icon */}
                  <div className={cn('p-2 rounded-lg', config.bgColor)}>
                    <div className={config.color}>{config.icon}</div>
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{agent.name}</span>
                      <span className={cn('flex items-center gap-1 text-xs', status.color)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                        {status.label}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {agent.current_task || 'Ready for tasks'}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium">
                      {agent.tasks_completed_today || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">today</div>
                  </div>
                </div>
              );
            })}

            {/* Quick Action */}
            <div className="pt-2 border-t">
              <Link href="/chat">
                <Button variant="outline" size="sm" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Dispatch New Task
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
