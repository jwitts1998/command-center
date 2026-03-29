// Team and Delegation types for Organization & Delegation

export interface Team {
  id: string;
  name: string;
  description: string | null;
  lead_agent_id: string | null;
  budget_usd: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface TeamMember {
  id: string;
  team_id: string;
  agent_id: string;
  role: TeamMemberRole;
  joined_at: Date;
}

export type TeamMemberRole = 'lead' | 'member' | 'advisor';

export interface CreateTeamInput {
  name: string;
  description?: string;
  lead_agent_id?: string;
  budget_usd?: number;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  lead_agent_id?: string | null;
  budget_usd?: number | null;
}

export interface TeamWithMembers extends Team {
  members: TeamMemberWithAgent[];
  lead: import('./agent').Agent | null;
  total_capabilities: string[];
}

export interface TeamMemberWithAgent extends TeamMember {
  agent: import('./agent').Agent;
}

export interface Delegation {
  id: string;
  task_id: string;
  from_agent_id: string;
  to_agent_id: string;
  depth: number;
  reason: string | null;
  status: DelegationStatus;
  delegated_at: Date;
  completed_at: Date | null;
}

export type DelegationStatus = 'active' | 'completed' | 'revoked' | 'failed';

export interface CreateDelegationInput {
  task_id: string;
  from_agent_id: string;
  to_agent_id: string;
  reason?: string;
}

export interface DelegationWithAgents extends Delegation {
  from_agent: import('./agent').Agent;
  to_agent: import('./agent').Agent;
  task: import('./task').Task;
}

export interface DelegationChain {
  task_id: string;
  chain: Array<{
    delegation_id: string;
    from_agent: import('./agent').Agent;
    to_agent: import('./agent').Agent;
    depth: number;
    status: DelegationStatus;
  }>;
  current_owner: import('./agent').Agent;
  total_depth: number;
}

export interface OrgChart {
  agents: import('./agent').AgentWithHierarchy[];
  teams: TeamWithMembers[];
  hierarchy: OrgNode[];
}

export interface OrgNode {
  agent_id: string;
  agent: import('./agent').Agent;
  subordinates: OrgNode[];
  team_id?: string;
}
