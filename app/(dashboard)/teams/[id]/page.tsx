'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamMemberList } from '@/components/teams/TeamMemberList';
import { AddMemberDialog } from '@/components/teams/AddMemberDialog';
import { TeamMetrics } from '@/components/teams/TeamMetrics';
import { DelegationFlow } from '@/components/teams/DelegationFlow';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { TeamWithMembers, TeamMetrics as TeamMetricsType, TeamMemberRole, Delegation } from '@/types/team';
import {
  ArrowLeft,
  Users,
  DollarSign,
  Crown,
  UserPlus,
  Trash2,
  Loader2,
  Settings,
  BarChart3,
  GitBranch,
} from 'lucide-react';

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [team, setTeam] = useState<TeamWithMembers | null>(null);
  const [metrics, setMetrics] = useState<TeamMetricsType | null>(null);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTeam();
    fetchMetrics();
    fetchDelegations();
  }, [teamId]);

  async function fetchTeam() {
    try {
      const response = await fetch(`/api/teams/${teamId}`);
      const data = await response.json();
      if (data.success) {
        setTeam(data.data);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMetrics() {
    setMetricsLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/metrics`);
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  }

  async function fetchDelegations() {
    try {
      const response = await fetch(`/api/delegations?status=active`);
      const data = await response.json();
      if (data.success && team) {
        // Filter delegations for this team's members
        const memberIds = team.members.map((m) => m.agent_id);
        const teamDelegations = data.data.filter(
          (d: Delegation) =>
            memberIds.includes(d.from_agent_id) || memberIds.includes(d.to_agent_id)
        );
        setDelegations(teamDelegations);
      }
    } catch (error) {
      console.error('Error fetching delegations:', error);
    }
  }

  // Refetch delegations when team loads
  useEffect(() => {
    if (team) {
      fetchDelegations();
    }
  }, [team?.id]);

  async function handleAddMember(agentId: string, role: TeamMemberRole) {
    const response = await fetch(`/api/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, role }),
    });

    const data = await response.json();
    if (data.success) {
      fetchTeam();
      fetchMetrics();
    } else {
      throw new Error(data.error);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this member from the team?')) {
      return;
    }

    try {
      const member = team?.members.find((m) => m.id === memberId);
      if (!member) return;

      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: member.agent_id }),
      });

      const data = await response.json();
      if (data.success) {
        fetchTeam();
        fetchMetrics();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  }

  async function handleDeleteTeam() {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
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
      console.error('Error deleting team:', error);
      alert('Failed to delete team');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

  const existingMemberIds = team.members.map((m) => m.agent_id);

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
            <Users className="h-8 w-8 text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
            <Badge variant="outline">
              {team.members.length} member{team.members.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          {team.description && (
            <p className="text-muted-foreground max-w-2xl">{team.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddMemberOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteTeam}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Lead</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {team.lead ? team.lead.name : 'Not assigned'}
            </div>
            {team.lead && (
              <p className="text-xs text-muted-foreground">@{team.lead.slug}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {team.budget_usd ? formatCurrency(team.budget_usd) : 'Unlimited'}
            </div>
            <p className="text-xs text-muted-foreground">monthly allocation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capabilities</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.total_capabilities.length}</div>
            <p className="text-xs text-muted-foreground">unique skills</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="delegations" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Delegations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <TeamMemberList
            members={team.members}
            onRemoveMember={handleRemoveMember}
          />

          {/* Capabilities */}
          {team.total_capabilities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team Capabilities</CardTitle>
                <CardDescription>
                  Combined skills from all team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {team.total_capabilities.map((cap) => (
                    <Badge key={cap} variant="secondary">
                      {cap.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics">
          {metrics ? (
            <TeamMetrics metrics={metrics} loading={metricsLoading} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="delegations">
          <DelegationFlow members={team.members} delegations={delegations} />
        </TabsContent>
      </Tabs>

      {/* Team Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(team.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium">{formatDate(team.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        teamId={teamId}
        existingMemberIds={existingMemberIds}
        onAdd={handleAddMember}
      />
    </div>
  );
}
