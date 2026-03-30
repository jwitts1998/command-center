'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { HeartbeatIndicator } from '@/components/HeartbeatIndicator';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { Agent } from '@/types/agent';
import { Bot, DollarSign, Cpu, Users } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
}

const roleColors: Record<string, string> = {
  executive: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  specialist: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  worker: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  coordinator: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
};

const roleIcons: Record<string, React.ReactNode> = {
  executive: <Users className="h-3 w-3" />,
  specialist: <Cpu className="h-3 w-3" />,
  worker: <Bot className="h-3 w-3" />,
  coordinator: <Users className="h-3 w-3" />,
};

export function AgentCard({ agent }: AgentCardProps) {
  const budgetUsed = agent.monthly_budget_usd
    ? (agent.current_month_spend_usd / agent.monthly_budget_usd) * 100
    : 0;

  return (
    <Link href={`/agents/${agent.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <HeartbeatIndicator
                status={agent.status}
                lastHeartbeat={agent.last_heartbeat}
              />
              <CardTitle className="text-lg truncate">{agent.name}</CardTitle>
            </div>
            <StatusBadge status={agent.status} />
          </div>
          <CardDescription className="line-clamp-2">
            {agent.description || `${agent.role} agent`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs capitalize ${roleColors[agent.role]}`}
            >
              {roleIcons[agent.role]}
              <span className="ml-1">{agent.role}</span>
            </Badge>
            <Badge variant="outline" className="text-xs">
              @{agent.slug}
            </Badge>
          </div>

          {agent.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {agent.capabilities.slice(0, 4).map((cap) => (
                <Badge
                  key={cap}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  {cap}
                </Badge>
              ))}
              {agent.capabilities.length > 4 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  +{agent.capabilities.length - 4}
                </Badge>
              )}
            </div>
          )}

          {agent.monthly_budget_usd && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Budget
                </span>
                <span>
                  {formatCurrency(agent.current_month_spend_usd)} /{' '}
                  {formatCurrency(agent.monthly_budget_usd)}
                </span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    budgetUsed > 90
                      ? 'bg-red-500'
                      : budgetUsed > 70
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                />
              </div>
            </div>
          )}

          {agent.last_heartbeat && (
            <div className="text-xs text-muted-foreground">
              Last heartbeat: {formatRelativeTime(agent.last_heartbeat)}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
