/**
 * CostTracker Service
 *
 * Tracks token usage and costs per project and session.
 * Monitors budgets and sends alerts when approaching limits.
 */

import { query, queryOne } from '@/lib/db/client';
import { calculateCost, formatCost } from '@/lib/utils/model-pricing';

interface SessionCost {
  sessionId: string;
  projectId: string;
  tokensInput: number;
  tokensOutput: number;
  model: string;
  costUsd: number;
}

interface BudgetStatus {
  projectId: string;
  month: string;
  limitUsd: number;
  spentUsd: number;
  remainingUsd: number;
  percentUsed: number;
  isOverBudget: boolean;
  alertTriggered: boolean;
}

interface CostSummary {
  totalCost: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  sessionCount: number;
  byModel: Record<string, { cost: number; sessions: number; tokensInput: number; tokensOutput: number }>;
  byAgentType: Record<string, { cost: number; sessions: number }>;
  byDay: Array<{ date: string; cost: number; sessions: number }>;
}

interface ProjectCostBreakdown {
  projectId: string;
  projectName: string;
  totalCost: number;
  sessionCount: number;
  monthlyBudget: number | null;
  monthlySpent: number;
  percentUsed: number;
}

export class CostTracker {
  /**
   * Record session cost and update budget
   */
  async recordSessionCost(session: SessionCost): Promise<{ success: boolean; alertTriggered?: boolean }> {
    const cost = calculateCost(session.model, session.tokensInput, session.tokensOutput);

    // Update session with cost
    await query(
      `UPDATE agent_sessions
       SET tokens_input = $1, tokens_output = $2, model_used = $3, cost_usd = $4
       WHERE id = $5`,
      [session.tokensInput, session.tokensOutput, session.model, cost, session.sessionId]
    );

    // Update monthly budget if exists
    const month = new Date().toISOString().slice(0, 7);
    const budget = await queryOne<{
      id: string;
      spent_usd: number;
      limit_usd: number;
      alert_threshold: number;
      alerted: boolean;
    }>(
      `SELECT id, spent_usd, limit_usd, alert_threshold, alerted
       FROM cost_budgets
       WHERE project_id = $1 AND month = $2`,
      [session.projectId, month]
    );

    if (budget) {
      const newSpent = Number(budget.spent_usd) + cost;
      const percentUsed = newSpent / Number(budget.limit_usd);

      // Update spent amount
      await query(
        `UPDATE cost_budgets SET spent_usd = $1 WHERE id = $2`,
        [newSpent, budget.id]
      );

      // Check if alert should be triggered
      if (!budget.alerted && percentUsed >= Number(budget.alert_threshold)) {
        await query(
          `UPDATE cost_budgets SET alerted = true WHERE id = $1`,
          [budget.id]
        );
        return { success: true, alertTriggered: true };
      }
    }

    return { success: true, alertTriggered: false };
  }

  /**
   * Get budget status for a project
   */
  async getBudgetStatus(projectId: string, month?: string): Promise<BudgetStatus | null> {
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const budget = await queryOne<{
      project_id: string;
      month: string;
      limit_usd: number;
      spent_usd: number;
      alerted: boolean;
    }>(
      `SELECT project_id, month, limit_usd, spent_usd, alerted
       FROM cost_budgets
       WHERE project_id = $1 AND month = $2`,
      [projectId, targetMonth]
    );

    if (!budget) {
      return null;
    }

    const spentUsd = Number(budget.spent_usd);
    const limitUsd = Number(budget.limit_usd);
    const percentUsed = limitUsd > 0 ? (spentUsd / limitUsd) * 100 : 0;

    return {
      projectId: budget.project_id,
      month: budget.month,
      limitUsd,
      spentUsd,
      remainingUsd: Math.max(0, limitUsd - spentUsd),
      percentUsed,
      isOverBudget: spentUsd > limitUsd,
      alertTriggered: budget.alerted,
    };
  }

  /**
   * Create or update monthly budget
   */
  async setBudget(
    projectId: string,
    month: string,
    limitUsd: number,
    alertThreshold: number = 0.8
  ): Promise<void> {
    await query(
      `INSERT INTO cost_budgets (project_id, month, limit_usd, alert_threshold)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (project_id, month)
       DO UPDATE SET limit_usd = $3, alert_threshold = $4`,
      [projectId, month, limitUsd, alertThreshold]
    );
  }

  /**
   * Get cost summary for a project over a time period
   */
  async getCostSummary(
    projectId: string,
    startDate: string,
    endDate: string
  ): Promise<CostSummary> {
    // Get aggregate stats
    const stats = await queryOne<{
      total_cost: number;
      total_input: number;
      total_output: number;
      session_count: number;
    }>(
      `SELECT
        COALESCE(SUM(cost_usd), 0) as total_cost,
        COALESCE(SUM(tokens_input), 0) as total_input,
        COALESCE(SUM(tokens_output), 0) as total_output,
        COUNT(*) as session_count
       FROM agent_sessions
       WHERE project_id = $1
         AND started_at >= $2
         AND started_at < $3`,
      [projectId, startDate, endDate]
    );

    // Get breakdown by model
    const byModelRows = await query<{
      model_used: string;
      cost: number;
      sessions: number;
      tokens_input: number;
      tokens_output: number;
    }>(
      `SELECT
        COALESCE(model_used, 'unknown') as model_used,
        COALESCE(SUM(cost_usd), 0) as cost,
        COUNT(*) as sessions,
        COALESCE(SUM(tokens_input), 0) as tokens_input,
        COALESCE(SUM(tokens_output), 0) as tokens_output
       FROM agent_sessions
       WHERE project_id = $1
         AND started_at >= $2
         AND started_at < $3
       GROUP BY model_used`,
      [projectId, startDate, endDate]
    );

    const byModel: CostSummary['byModel'] = {};
    for (const row of byModelRows) {
      byModel[row.model_used] = {
        cost: Number(row.cost),
        sessions: Number(row.sessions),
        tokensInput: Number(row.tokens_input),
        tokensOutput: Number(row.tokens_output),
      };
    }

    // Get breakdown by agent type
    const byAgentRows = await query<{
      agent_type: string;
      cost: number;
      sessions: number;
    }>(
      `SELECT
        COALESCE(agent_type, 'unknown') as agent_type,
        COALESCE(SUM(cost_usd), 0) as cost,
        COUNT(*) as sessions
       FROM agent_sessions
       WHERE project_id = $1
         AND started_at >= $2
         AND started_at < $3
       GROUP BY agent_type`,
      [projectId, startDate, endDate]
    );

    const byAgentType: CostSummary['byAgentType'] = {};
    for (const row of byAgentRows) {
      byAgentType[row.agent_type] = {
        cost: Number(row.cost),
        sessions: Number(row.sessions),
      };
    }

    // Get daily breakdown
    const byDayRows = await query<{
      date: string;
      cost: number;
      sessions: number;
    }>(
      `SELECT
        DATE(started_at) as date,
        COALESCE(SUM(cost_usd), 0) as cost,
        COUNT(*) as sessions
       FROM agent_sessions
       WHERE project_id = $1
         AND started_at >= $2
         AND started_at < $3
       GROUP BY DATE(started_at)
       ORDER BY date`,
      [projectId, startDate, endDate]
    );

    const byDay = byDayRows.map((row) => ({
      date: row.date,
      cost: Number(row.cost),
      sessions: Number(row.sessions),
    }));

    return {
      totalCost: Number(stats?.total_cost || 0),
      totalTokensInput: Number(stats?.total_input || 0),
      totalTokensOutput: Number(stats?.total_output || 0),
      sessionCount: Number(stats?.session_count || 0),
      byModel,
      byAgentType,
      byDay,
    };
  }

  /**
   * Get cost breakdown across all projects
   */
  async getAllProjectsCosts(month?: string): Promise<ProjectCostBreakdown[]> {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const startDate = `${targetMonth}-01`;
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    const endDateStr = endDate.toISOString().slice(0, 10);

    const results = await query<{
      id: string;
      name: string;
      monthly_budget: number | null;
      total_cost: number;
      session_count: number;
      monthly_spent: number;
    }>(
      `SELECT
        p.id,
        p.name,
        p.monthly_budget,
        COALESCE(SUM(s.cost_usd), 0) as total_cost,
        COUNT(s.id) as session_count,
        COALESCE(b.spent_usd, 0) as monthly_spent
       FROM projects p
       LEFT JOIN agent_sessions s ON p.id = s.project_id
         AND s.started_at >= $1
         AND s.started_at < $2
       LEFT JOIN cost_budgets b ON p.id = b.project_id AND b.month = $3
       GROUP BY p.id, p.name, p.monthly_budget, b.spent_usd
       ORDER BY total_cost DESC`,
      [startDate, endDateStr, targetMonth]
    );

    return results.map((row) => {
      const monthlyBudget = row.monthly_budget ? Number(row.monthly_budget) : null;
      const monthlySpent = Number(row.monthly_spent);

      return {
        projectId: row.id,
        projectName: row.name,
        totalCost: Number(row.total_cost),
        sessionCount: Number(row.session_count),
        monthlyBudget,
        monthlySpent,
        percentUsed: monthlyBudget && monthlyBudget > 0
          ? (monthlySpent / monthlyBudget) * 100
          : 0,
      };
    });
  }

  /**
   * Get total cost across all projects for a period
   */
  async getTotalCost(startDate: string, endDate: string): Promise<{
    totalCost: number;
    totalSessions: number;
    totalTokens: number;
  }> {
    const result = await queryOne<{
      total_cost: number;
      total_sessions: number;
      total_tokens: number;
    }>(
      `SELECT
        COALESCE(SUM(cost_usd), 0) as total_cost,
        COUNT(*) as total_sessions,
        COALESCE(SUM(tokens_input + tokens_output), 0) as total_tokens
       FROM agent_sessions
       WHERE started_at >= $1 AND started_at < $2`,
      [startDate, endDate]
    );

    return {
      totalCost: Number(result?.total_cost || 0),
      totalSessions: Number(result?.total_sessions || 0),
      totalTokens: Number(result?.total_tokens || 0),
    };
  }

  /**
   * Get alerts for budgets approaching or exceeding limits
   */
  async getBudgetAlerts(): Promise<Array<{
    projectId: string;
    projectName: string;
    month: string;
    limitUsd: number;
    spentUsd: number;
    percentUsed: number;
    status: 'warning' | 'critical' | 'exceeded';
  }>> {
    const results = await query<{
      project_id: string;
      project_name: string;
      month: string;
      limit_usd: number;
      spent_usd: number;
      alert_threshold: number;
    }>(
      `SELECT
        b.project_id,
        p.name as project_name,
        b.month,
        b.limit_usd,
        b.spent_usd,
        b.alert_threshold
       FROM cost_budgets b
       JOIN projects p ON b.project_id = p.id
       WHERE b.spent_usd >= b.limit_usd * b.alert_threshold
       ORDER BY b.spent_usd / b.limit_usd DESC`
    );

    return results.map((row) => {
      const percentUsed = (Number(row.spent_usd) / Number(row.limit_usd)) * 100;
      let status: 'warning' | 'critical' | 'exceeded';

      if (percentUsed >= 100) {
        status = 'exceeded';
      } else if (percentUsed >= 95) {
        status = 'critical';
      } else {
        status = 'warning';
      }

      return {
        projectId: row.project_id,
        projectName: row.project_name,
        month: row.month,
        limitUsd: Number(row.limit_usd),
        spentUsd: Number(row.spent_usd),
        percentUsed,
        status,
      };
    });
  }
}

export const costTracker = new CostTracker();
