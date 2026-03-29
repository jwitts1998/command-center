import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { query, queryOne } from '@/lib/db/client';
import type { Agent, Task } from '@/lib/db/client';
import type { AgentRoutingRequest, AgentRoutingResult } from '@/types/agent';

// Schema for routing decision
const RoutingDecisionSchema = z.object({
  selected_agent_slug: z.string().describe('Slug of the best agent for this task'),
  confidence: z.number().min(0).max(1).describe('Confidence in this selection (0-1)'),
  reasoning: z.string().describe('Why this agent was selected'),
  alternative_agents: z.array(z.object({
    agent_slug: z.string(),
    confidence: z.number().min(0).max(1),
    reason: z.string(),
  })).describe('Other agents that could handle this task'),
});

export class AgentRouter {
  private model = anthropic('claude-sonnet-4-20250514');

  /**
   * Routes a task to the best available agent
   */
  async routeTask(request: AgentRoutingRequest): Promise<AgentRoutingResult> {
    // Fetch available agents
    const agents = await this.getAvailableAgents(request);

    if (agents.length === 0) {
      throw new Error('No available agents for routing');
    }

    // If there's a preferred agent and they're available, use them
    if (request.preferred_agent_id) {
      const preferred = agents.find(a => a.id === request.preferred_agent_id);
      if (preferred) {
        return {
          selected_agent_id: preferred.id,
          agent_slug: preferred.slug,
          confidence: 0.95,
          reasoning: 'Preferred agent is available',
          alternative_agents: agents
            .filter(a => a.id !== preferred.id)
            .slice(0, 3)
            .map(a => ({
              agent_id: a.id,
              agent_slug: a.slug,
              confidence: 0.5,
              reason: 'Alternative agent',
            })),
        };
      }
    }

    // Fetch task details if task_id provided
    let taskDetails = request.task_description;
    if (request.task_id && !taskDetails) {
      const task = await queryOne<Task>(
        'SELECT title, description, complexity, priority FROM tasks WHERE id = $1',
        [request.task_id]
      );
      if (task) {
        taskDetails = `${task.title}\n${task.description || ''}\nComplexity: ${task.complexity}\nPriority: ${task.priority}`;
      }
    }

    // Use AI to select the best agent
    const routingResult = await this.selectAgentWithAI(
      taskDetails,
      agents,
      request.required_capabilities
    );

    return routingResult;
  }

  /**
   * Gets the best agent for a specific capability
   */
  async getAgentForCapability(capability: string): Promise<Agent | null> {
    const agents = await query<Agent>(
      `SELECT * FROM agents
       WHERE status = 'active'
         AND capabilities::jsonb ? $1
       ORDER BY
         CASE WHEN role = 'specialist' THEN 0 ELSE 1 END,
         (SELECT COUNT(*) FROM tasks WHERE assigned_agent_id = agents.id AND status = 'in_progress') ASC
       LIMIT 1`,
      [capability]
    );

    return agents.length > 0 ? agents[0] : null;
  }

  /**
   * Gets all agents that can handle a specific task
   */
  async getCapableAgents(
    requiredCapabilities: string[],
    excludeAgentIds: string[] = []
  ): Promise<Agent[]> {
    if (requiredCapabilities.length === 0) {
      return this.getAllActiveAgents(excludeAgentIds);
    }

    // Build capability check query
    const capabilityChecks = requiredCapabilities
      .map((_, i) => `capabilities::jsonb ? $${i + 1}`)
      .join(' AND ');

    const params = [...requiredCapabilities];

    let excludeClause = '';
    if (excludeAgentIds.length > 0) {
      excludeClause = ` AND id NOT IN (${excludeAgentIds.map((_, i) => `$${params.length + i + 1}`).join(',')})`;
      params.push(...excludeAgentIds);
    }

    return query<Agent>(
      `SELECT * FROM agents
       WHERE status = 'active'
         AND ${capabilityChecks}
         ${excludeClause}
       ORDER BY role, name`,
      params
    );
  }

  /**
   * Gets all active agents
   */
  async getAllActiveAgents(excludeAgentIds: string[] = []): Promise<Agent[]> {
    if (excludeAgentIds.length === 0) {
      return query<Agent>(
        `SELECT * FROM agents WHERE status = 'active' ORDER BY role, name`
      );
    }

    return query<Agent>(
      `SELECT * FROM agents
       WHERE status = 'active'
         AND id NOT IN (${excludeAgentIds.map((_, i) => `$${i + 1}`).join(',')})
       ORDER BY role, name`,
      excludeAgentIds
    );
  }

  /**
   * Checks if an agent is available for a new task
   */
  async isAgentAvailable(agentId: string): Promise<boolean> {
    const agent = await queryOne<Agent>(
      'SELECT * FROM agents WHERE id = $1',
      [agentId]
    );

    if (!agent || agent.status !== 'active') {
      return false;
    }

    // Check if agent is at budget limit
    if (agent.monthly_budget_usd && agent.current_month_spend_usd >= agent.monthly_budget_usd) {
      return false;
    }

    // Check current workload (max 3 concurrent tasks)
    const activeTasks = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM tasks
       WHERE assigned_agent_id = $1 AND status = 'in_progress'`,
      [agentId]
    );

    return parseInt(activeTasks?.count || '0') < 3;
  }

  /**
   * Gets agent workload statistics
   */
  async getAgentWorkload(agentId: string): Promise<{
    active_tasks: number;
    completed_today: number;
    cost_today: number;
    cost_this_month: number;
  }> {
    const result = await queryOne<{
      active_tasks: string;
      completed_today: string;
      cost_today: string;
      cost_this_month: string;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM tasks WHERE assigned_agent_id = $1 AND status = 'in_progress') as active_tasks,
         (SELECT COUNT(*) FROM tasks WHERE assigned_agent_id = $1 AND completed_at >= CURRENT_DATE) as completed_today,
         (SELECT COALESCE(SUM(actual_cost_usd), 0) FROM tasks WHERE assigned_agent_id = $1 AND completed_at >= CURRENT_DATE) as cost_today,
         (SELECT COALESCE(current_month_spend_usd, 0) FROM agents WHERE id = $1) as cost_this_month`,
      [agentId]
    );

    return {
      active_tasks: parseInt(result?.active_tasks || '0'),
      completed_today: parseInt(result?.completed_today || '0'),
      cost_today: parseFloat(result?.cost_today || '0'),
      cost_this_month: parseFloat(result?.cost_this_month || '0'),
    };
  }

  private async getAvailableAgents(request: AgentRoutingRequest): Promise<Agent[]> {
    let agents: Agent[];

    if (request.required_capabilities && request.required_capabilities.length > 0) {
      agents = await this.getCapableAgents(
        request.required_capabilities,
        request.exclude_agent_ids
      );
    } else {
      agents = await this.getAllActiveAgents(request.exclude_agent_ids);
    }

    // Filter out agents at budget limit
    if (request.max_cost_usd) {
      agents = agents.filter(a => {
        if (!a.monthly_budget_usd) return true;
        const remainingBudget = a.monthly_budget_usd - a.current_month_spend_usd;
        return remainingBudget >= request.max_cost_usd!;
      });
    }

    // Check availability for each agent
    const availabilityChecks = await Promise.all(
      agents.map(async agent => ({
        agent,
        available: await this.isAgentAvailable(agent.id),
      }))
    );

    return availabilityChecks
      .filter(check => check.available)
      .map(check => check.agent);
  }

  private async selectAgentWithAI(
    taskDescription: string,
    agents: Agent[],
    requiredCapabilities?: string[]
  ): Promise<AgentRoutingResult> {
    const agentDescriptions = agents.map(a => ({
      slug: a.slug,
      name: a.name,
      role: a.role,
      capabilities: a.capabilities,
      specializations: a.specializations,
      description: a.description,
    }));

    const prompt = `Select the best agent to handle this task.

TASK:
${taskDescription}

${requiredCapabilities ? `REQUIRED CAPABILITIES: ${requiredCapabilities.join(', ')}` : ''}

AVAILABLE AGENTS:
${JSON.stringify(agentDescriptions, null, 2)}

Select the agent best suited for this task based on:
1. Matching capabilities
2. Role appropriateness (executives for strategy, specialists for specific work)
3. Specializations that align with the task

If multiple agents could work, rank them by suitability.`;

    const result = await generateObject({
      model: this.model,
      schema: RoutingDecisionSchema,
      prompt,
    });

    const selectedAgent = agents.find(a => a.slug === result.object.selected_agent_slug);

    if (!selectedAgent) {
      // Fallback to first agent if AI selection not found
      return {
        selected_agent_id: agents[0].id,
        agent_slug: agents[0].slug,
        confidence: 0.5,
        reasoning: 'Fallback selection - AI selection not found',
        alternative_agents: agents.slice(1, 4).map(a => ({
          agent_id: a.id,
          agent_slug: a.slug,
          confidence: 0.3,
          reason: 'Alternative agent',
        })),
      };
    }

    return {
      selected_agent_id: selectedAgent.id,
      agent_slug: selectedAgent.slug,
      confidence: result.object.confidence,
      reasoning: result.object.reasoning,
      alternative_agents: result.object.alternative_agents.map(alt => {
        const agent = agents.find(a => a.slug === alt.agent_slug);
        return {
          agent_id: agent?.id || '',
          agent_slug: alt.agent_slug,
          confidence: alt.confidence,
          reason: alt.reason,
        };
      }).filter(alt => alt.agent_id),
    };
  }
}

// Export singleton instance
export const agentRouter = new AgentRouter();
