'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HeartbeatIndicator } from '@/components/HeartbeatIndicator';
import type { TeamMemberWithAgent, TeamMemberRole } from '@/types/team';
import { Crown, User, Lightbulb, Trash2, ExternalLink } from 'lucide-react';

interface MemberCardProps {
  member: TeamMemberWithAgent;
  onRemove?: (memberId: string) => void;
  showActions?: boolean;
}

const roleIcons: Record<TeamMemberRole, React.ComponentType<{ className?: string }>> = {
  lead: Crown,
  member: User,
  advisor: Lightbulb,
};

const roleColors: Record<TeamMemberRole, string> = {
  lead: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200',
  member: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200',
  advisor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200',
};

export function MemberCard({ member, onRemove, showActions = true }: MemberCardProps) {
  const Icon = roleIcons[member.role];
  const agent = member.agent;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <HeartbeatIndicator
              status={agent.status}
              lastHeartbeat={agent.last_heartbeat}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/agents/${agent.id}`}
                  className="font-medium hover:underline truncate"
                >
                  {agent.name}
                </Link>
                <Badge
                  variant="outline"
                  className={`flex items-center gap-1 text-xs ${roleColors[member.role]}`}
                >
                  <Icon className="h-3 w-3" />
                  {member.role}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                @{agent.slug}
              </p>
              {agent.capabilities && agent.capabilities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {agent.capabilities.slice(0, 3).map((cap) => (
                    <Badge key={cap} variant="secondary" className="text-[10px]">
                      {cap.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <Badge variant="secondary" className="text-[10px]">
                      +{agent.capabilities.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-1 shrink-0">
              <Link href={`/agents/${agent.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
              {member.role !== 'lead' && onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(member.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
