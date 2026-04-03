'use client';

import { MemberCard } from './MemberCard';
import type { TeamMemberWithAgent } from '@/types/team';
import { Users } from 'lucide-react';

interface TeamMemberListProps {
  members: TeamMemberWithAgent[];
  onRemoveMember?: (memberId: string) => void;
  showActions?: boolean;
}

export function TeamMemberList({ members, onRemoveMember, showActions = true }: TeamMemberListProps) {
  // Sort members: lead first, then members, then advisors
  const sortedMembers = [...members].sort((a, b) => {
    const order = { lead: 0, member: 1, advisor: 2 };
    return order[a.role] - order[b.role];
  });

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No team members yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add agents to this team to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {sortedMembers.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          onRemove={onRemoveMember}
          showActions={showActions}
        />
      ))}
    </div>
  );
}
