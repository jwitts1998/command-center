import { query, queryOne } from '@/lib/db/client';
import type {
  Agent as DbAgent,
  Delegation as DbDelegation,
  Task as DbTask,
  Team as DbTeam,
  TeamMember as DbTeamMember,
} from '@/lib/db/client';
import type {
  CreateDelegationInput,
  DelegationChain,
  DelegationStatus,
  OrgChart,
  OrgNode,
  TeamWithMembers,
  TeamMemberWithAgent,
} from '@/types/team';
import type { Agent, AgentWithHierarchy } from '@/types/agent';

/* eslint-disable @typescript-eslint/no-explicit-any */

const MAX_DELEGATION_DEPTH = 3;

export class DelegationTracker {
  /**
   * Creates a delegation from one agent to another
   */
  async delegate(input: CreateDelegationInput): Promise<DbDelegation> {
    // Check current delegation depth for this task
    const existingDepth = await this.getCurrentDelegationDepth(input.task_id);

    if (existingDepth >= MAX_DELEGATION_DEPTH) {
      throw new Error(`Maximum delegation depth (${MAX_DELEGATION_DEPTH}) reached`);
    }

    // Verify both agents exist and are active
    const [fromAgent, toAgent] = await Promise.all([
      queryOne<DbAgent>('SELECT * FROM agents WHERE id = $1', [input.from_agent_id]),
      queryOne<DbAgent>('SELECT * FROM agents WHERE id = $1', [input.to_agent_id]),
    ]);

    if (!fromAgent) {
      throw new Error(`From agent not found: ${input.from_agent_id}`);
    }
    if (!toAgent) {
      throw new Error(`To agent not found: ${input.to_agent_id}`);
    }
    if (toAgent.status !== 'active') {
      throw new Error(`Cannot delegate to inactive agent: ${toAgent.slug}`);
    }

    // Check for circular delegation
    const wouldCreateCycle = await this.wouldCreateCycle(
      input.task_id,
      input.from_agent_id,
      input.to_agent_id
    );
    if (wouldCreateCycle) {
      throw new Error('Delegation would create a circular dependency');
    }

    // Create the delegation
    const result = await queryOne<DbDelegation>(
      `INSERT INTO delegations (task_id, from_agent_id, to_agent_id, depth, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.task_id, input.from_agent_id, input.to_agent_id, existingDepth + 1, input.reason]
    );

    if (!result) {
      throw new Error('Failed to create delegation');
    }

    // Update task assignment
    await query(
      `UPDATE tasks
       SET assigned_agent_id = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [input.to_agent_id, input.task_id]
    );

    return result;
  }

  /**
   * Revokes a delegation
   */
  async revokeDelegation(delegationId: string, revertToAgent?: string): Promise<void> {
    const delegation = await queryOne<DbDelegation>(
      'SELECT * FROM delegations WHERE id = $1',
      [delegationId]
    );

    if (!delegation) {
      throw new Error(`Delegation not found: ${delegationId}`);
    }

    // Mark delegation as revoked
    await query(
      `UPDATE delegations
       SET status = 'revoked',
           completed_at = NOW()
       WHERE id = $1`,
      [delegationId]
    );

    // Update task assignment if needed
    if (revertToAgent) {
      await query(
        `UPDATE tasks
         SET assigned_agent_id = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [revertToAgent, delegation.task_id]
      );
    }
  }

  /**
   * Completes a delegation (task was finished by delegatee)
   */
  async completeDelegation(delegationId: string): Promise<void> {
    await query(
      `UPDATE delegations
       SET status = 'completed',
           completed_at = NOW()
       WHERE id = $1`,
      [delegationId]
    );
  }

  /**
   * Gets the delegation chain for a task
   */
  async getDelegationChain(taskId: string): Promise<DelegationChain> {
    const delegations = await query<any>(
      `SELECT d.*,
              row_to_json(fa.*) as from_agent,
              row_to_json(ta.*) as to_agent
       FROM delegations d
       JOIN agents fa ON d.from_agent_id = fa.id
       JOIN agents ta ON d.to_agent_id = ta.id
       WHERE d.task_id = $1
       ORDER BY d.depth ASC`,
      [taskId]
    );

    // Get current task assignment
    const task = await queryOne<DbTask>(
      'SELECT assigned_agent_id FROM tasks WHERE id = $1',
      [taskId]
    );

    const currentOwner = task?.assigned_agent_id
      ? await queryOne<DbAgent>('SELECT * FROM agents WHERE id = $1', [task.assigned_agent_id])
      : null;

    return {
      task_id: taskId,
      chain: delegations.map((d: any) => ({
        delegation_id: d.id,
        from_agent: d.from_agent as Agent,
        to_agent: d.to_agent as Agent,
        depth: d.depth,
        status: d.status as DelegationStatus,
      })),
      current_owner: currentOwner as unknown as Agent,
      total_depth: delegations.length > 0
        ? Math.max(...delegations.map((d: any) => d.depth))
        : 0,
    };
  }

  /**
   * Gets all active delegations from an agent
   */
  async getAgentDelegations(agentId: string): Promise<any[]> {
    const delegations = await query<{
      id: string;
      task_id: string;
      to_agent_id: string;
      depth: number;
      reason: string | null;
      status: string;
      delegated_at: Date;
      completed_at: Date | null;
      task_title: string;
      to_agent_slug: string;
      to_agent_name: string;
    }>(
      `SELECT d.*, t.title as task_title, a.slug as to_agent_slug, a.name as to_agent_name
       FROM delegations d
       JOIN tasks t ON d.task_id = t.id
       JOIN agents a ON d.to_agent_id = a.id
       WHERE d.from_agent_id = $1 AND d.status = 'active'
       ORDER BY d.delegated_at DESC`,
      [agentId]
    );

    // Fetch full agent and task details
    const result: any[] = [];
    for (const d of delegations) {
      const [fromAgent, toAgent, task] = await Promise.all([
        queryOne<DbAgent>('SELECT * FROM agents WHERE id = $1', [agentId]),
        queryOne<DbAgent>('SELECT * FROM agents WHERE id = $1', [d.to_agent_id]),
        queryOne<DbTask>('SELECT * FROM tasks WHERE id = $1', [d.task_id]),
      ]);

      if (fromAgent && toAgent && task) {
        result.push({
          id: d.id,
          task_id: d.task_id,
          from_agent_id: agentId,
          to_agent_id: d.to_agent_id,
          depth: d.depth,
          reason: d.reason,
          status: d.status as DelegationStatus,
          delegated_at: d.delegated_at,
          completed_at: d.completed_at,
          from_agent: fromAgent,
          to_agent: toAgent,
          task: task,
        });
      }
    }

    return result;
  }

  /**
   * Creates a team
   */
  async createTeam(input: {
    name: string;
    description?: string;
    lead_agent_id?: string;
    budget_usd?: number;
  }): Promise<DbTeam> {
    const result = await queryOne<DbTeam>(
      `INSERT INTO teams (name, description, lead_agent_id, budget_usd)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.name, input.description, input.lead_agent_id, input.budget_usd]
    );

    if (!result) {
      throw new Error('Failed to create team');
    }

    // If lead_agent_id is provided, add them as a member
    if (input.lead_agent_id) {
      await this.addTeamMember(result.id, input.lead_agent_id, 'lead');
    }

    return result;
  }

  /**
   * Adds an agent to a team
   */
  async addTeamMember(
    teamId: string,
    agentId: string,
    role: 'lead' | 'member' | 'advisor' = 'member'
  ): Promise<DbTeamMember> {
    const result = await queryOne<DbTeamMember>(
      `INSERT INTO team_members (team_id, agent_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (team_id, agent_id) DO UPDATE SET role = $3
       RETURNING *`,
      [teamId, agentId, role]
    );

    if (!result) {
      throw new Error('Failed to add team member');
    }

    return result;
  }

  /**
   * Removes an agent from a team
   */
  async removeTeamMember(teamId: string, agentId: string): Promise<void> {
    await query(
      'DELETE FROM team_members WHERE team_id = $1 AND agent_id = $2',
      [teamId, agentId]
    );
  }

  /**
   * Gets a team with all its members
   */
  async getTeamWithMembers(teamId: string): Promise<TeamWithMembers | null> {
    const team = await queryOne<DbTeam>(
      'SELECT * FROM teams WHERE id = $1',
      [teamId]
    );

    if (!team) return null;

    const members = await query<any>(
      `SELECT tm.*, row_to_json(a.*) as agent
       FROM team_members tm
       JOIN agents a ON tm.agent_id = a.id
       WHERE tm.team_id = $1
       ORDER BY tm.role, a.name`,
      [teamId]
    );

    const lead = team.lead_agent_id
      ? await queryOne<DbAgent>('SELECT * FROM agents WHERE id = $1', [team.lead_agent_id])
      : null;

    // Collect all unique capabilities
    const allCapabilities = new Set<string>();
    for (const member of members) {
      if (member.agent && Array.isArray(member.agent.capabilities)) {
        member.agent.capabilities.forEach((cap: string) => allCapabilities.add(cap));
      }
    }

    return {
      ...team,
      members: members.map((m: any) => ({
        id: m.id,
        team_id: m.team_id,
        agent_id: m.agent_id,
        role: m.role as 'lead' | 'member' | 'advisor',
        joined_at: m.joined_at,
        agent: m.agent,
      })) as TeamMemberWithAgent[],
      lead: lead as unknown as Agent | null,
      total_capabilities: Array.from(allCapabilities),
    };
  }

  /**
   * Gets all teams
   */
  async getAllTeams(): Promise<DbTeam[]> {
    return query<DbTeam>('SELECT * FROM teams ORDER BY name');
  }

  /**
   * Builds the organization chart
   */
  async getOrgChart(): Promise<OrgChart> {
    // Get all agents with hierarchy
    const dbAgents = await query<DbAgent>('SELECT * FROM agents ORDER BY role, name');
    const agents = dbAgents as unknown as Agent[];

    // Get all teams with members
    const teams = await query<DbTeam>('SELECT * FROM teams ORDER BY name');
    const teamsWithMembers: TeamWithMembers[] = [];

    for (const team of teams) {
      const teamWithMembers = await this.getTeamWithMembers(team.id);
      if (teamWithMembers) {
        teamsWithMembers.push(teamWithMembers);
      }
    }

    // Build agent hierarchy
    const agentsWithHierarchy: AgentWithHierarchy[] = await Promise.all(
      agents.map(async agent => {
        const subordinates = agents.filter(a => a.reports_to === agent.id);
        const manager = agent.reports_to
          ? agents.find(a => a.id === agent.reports_to) || null
          : null;

        // Find agent's team
        const memberRecord = await queryOne<{ team_id: string }>(
          'SELECT team_id FROM team_members WHERE agent_id = $1 LIMIT 1',
          [agent.id]
        );
        const team = memberRecord
          ? teamsWithMembers.find(t => t.id === memberRecord.team_id) || null
          : null;

        return {
          ...agent,
          capabilities: agent.capabilities || [],
          specializations: agent.specializations || [],
          subordinates,
          manager,
          team,
        } as AgentWithHierarchy;
      })
    );

    // Build tree structure
    const buildOrgNode = (agent: Agent): OrgNode => {
      const subordinates = agents
        .filter(a => a.reports_to === agent.id)
        .map(buildOrgNode);

      return {
        agent_id: agent.id,
        agent,
        subordinates,
      };
    };

    // Find root agents (no reports_to)
    const rootAgents = agents.filter(a => !a.reports_to);
    const hierarchy = rootAgents.map(buildOrgNode);

    return {
      agents: agentsWithHierarchy,
      teams: teamsWithMembers,
      hierarchy,
    };
  }

  private async getCurrentDelegationDepth(taskId: string): Promise<number> {
    const result = await queryOne<{ max_depth: string }>(
      `SELECT COALESCE(MAX(depth), 0) as max_depth
       FROM delegations
       WHERE task_id = $1 AND status = 'active'`,
      [taskId]
    );

    return parseInt(result?.max_depth || '0');
  }

  private async wouldCreateCycle(
    taskId: string,
    fromAgentId: string,
    toAgentId: string
  ): Promise<boolean> {
    // Check if toAgent has previously delegated this task to fromAgent
    const existingDelegation = await queryOne<DbDelegation>(
      `SELECT * FROM delegations
       WHERE task_id = $1
         AND from_agent_id = $2
         AND to_agent_id = $3
         AND status = 'active'`,
      [taskId, toAgentId, fromAgentId]
    );

    return !!existingDelegation;
  }
}

// Export singleton instance
export const delegationTracker = new DelegationTracker();
