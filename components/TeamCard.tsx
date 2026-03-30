'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { TeamWithMembers, Team } from '@/types/team';
import { Users, DollarSign, Crown } from 'lucide-react';

interface TeamCardProps {
  team: Team | TeamWithMembers;
}

function isTeamWithMembers(team: Team | TeamWithMembers): team is TeamWithMembers {
  return 'members' in team;
}

export function TeamCard({ team }: TeamCardProps) {
  const hasMembers = isTeamWithMembers(team);
  const memberCount = hasMembers ? team.members.length : 0;
  const leadName = hasMembers && team.lead ? team.lead.name : null;

  return (
    <Link href={`/teams/${team.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">{team.name}</CardTitle>
            </div>
            <Badge variant="secondary">
              {memberCount} member{memberCount !== 1 ? 's' : ''}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {team.description || 'No description'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {leadName && (
            <div className="flex items-center gap-2 text-sm">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span className="text-muted-foreground">Lead:</span>
              <span className="font-medium">{leadName}</span>
            </div>
          )}

          {hasMembers && team.members.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {team.members.slice(0, 4).map((member) => (
                <Badge
                  key={member.id}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                >
                  {member.agent.name}
                </Badge>
              ))}
              {team.members.length > 4 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                >
                  +{team.members.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {hasMembers && team.total_capabilities.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Capabilities:</p>
              <div className="flex flex-wrap gap-1">
                {team.total_capabilities.slice(0, 5).map((cap) => (
                  <Badge
                    key={cap}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {cap}
                  </Badge>
                ))}
                {team.total_capabilities.length > 5 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    +{team.total_capabilities.length - 5}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {team.budget_usd && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Budget: {formatCurrency(team.budget_usd)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
