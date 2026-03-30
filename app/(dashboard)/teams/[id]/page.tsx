'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeartbeatIndicator } from '@/components/HeartbeatIndicator';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { TeamWithMembers, TeamMemberRole } from '@/types/team';
import type { Agent } from '@/types/agent';
import {
  Users,
  ArrowLeft,
  XCircle,
  DollarSign,
  Crown,
  Plus,
  UserMinus,
  Loader2,
  Bot,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<TeamWithMembers | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({
    agent_id: '',
    role: 'member' as TeamMemberRole,
  });

  const teamId = params.id as string;

  useEffect(() => {
    Promise.all([fetchTeam(), fetchAgents()]);
  }, [teamId]);

  async function fetchTeam() {
    try {
      const response = await fetch(`/api/teams/${teamId}`);
      const data = await response.json();
      if (data.success) {
        setTeam(data.data);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAgents() {
    try {
      const response = await fetch('/api/agents?status=active');
      const data = await response.json();
      if (data.success) {
        setAgents(data.data);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading('add');

    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });
      const data = await response.json();
      if (data.success) {
        setAddMemberDialogOpen(false);
        setNewMember({ agent_id: '', role: 'member' });
        fetchTeam();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemoveMember(agentId: string) {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    setActionLoading(`remove-${agentId}`);
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId }),
      });
      const data = await response.json();
      if (data.success) {
        fetchTeam();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this team?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        router.push('/teams');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading team...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Team not found</p>
        <Link href="/teams">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Button>
        </Link>
      </div>
    );
  }

  const availableAgents = agents.filter(
    a => !team.members.some(m => m.agent_id === a.id)
  );

  const roleColors: Record<string, string> = {
    lead: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    member: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    advisor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  };

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link href="/teams">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Teams
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
            <Badge variant="secondary">
              {team.members.length} member{team.members.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          {team.description && (
            <p className="text-muted-foreground max-w-2xl">{team.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={availableAgents.length === 0}>
                <Plus className="h-4 w-4 mr-1" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Add an agent to this team
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agent">Agent *</Label>
                  <Select
                    value={newMember.agent_id}
                    onValueChange={(value) => setNewMember({ ...newMember, agent_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAgents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newMember.role}
                    onValueChange={(value) => setNewMember({ ...newMember, role: value as TeamMemberRole })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="advisor">Advisor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!newMember.agent_id || actionLoading !== null}
                >
                  {actionLoading === 'add' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Add Member
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Lead</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {team.lead ? team.lead.name : 'None'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.members.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {team.budget_usd ? formatCurrency(team.budget_usd) : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Agents in this team</CardDescription>
        </CardHeader>
        <CardContent>
          {team.members.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No members yet. Add agents to build your team.
            </p>
          ) : (
            <div className="space-y-2">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <HeartbeatIndicator
                      status={member.agent.status}
                      lastHeartbeat={member.agent.last_heartbeat}
                    />
                    <div>
                      <Link
                        href={`/agents/${member.agent_id}`}
                        className="font-medium hover:underline"
                      >
                        {member.agent.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        @{member.agent.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`capitalize ${roleColors[member.role]}`}
                    >
                      {member.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.agent_id)}
                      disabled={actionLoading === `remove-${member.agent_id}`}
                    >
                      {actionLoading === `remove-${member.agent_id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserMinus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Capabilities */}
      {team.total_capabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Combined Capabilities</CardTitle>
            <CardDescription>All capabilities across team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {team.total_capabilities.map((cap) => (
                <Badge key={cap} variant="secondary">
                  {cap}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Created</p>
              <p className="text-sm">{formatDate(team.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
              <p className="text-sm">{formatDate(team.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
