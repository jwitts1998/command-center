import { query, queryOne } from '@/lib/db/client';
import type { Agent, AgentExecutionSession } from '@/lib/db/client';
import type { AgentHeartbeat, AgentStatus } from '@/types/agent';

export interface HeartbeatConfig {
  defaultIntervalMs: number;
  staleThresholdMs: number;
  maxMissedHeartbeats: number;
}

const DEFAULT_CONFIG: HeartbeatConfig = {
  defaultIntervalMs: 5 * 60 * 1000, // 5 minutes
  staleThresholdMs: 10 * 60 * 1000, // 10 minutes
  maxMissedHeartbeats: 3,
};

export class HeartbeatCoordinator {
  private config: HeartbeatConfig;
  private heartbeatCallbacks: Map<string, (heartbeat: AgentHeartbeat) => void> = new Map();

  constructor(config: Partial<HeartbeatConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Records a heartbeat from an agent
   */
  async recordHeartbeat(heartbeat: AgentHeartbeat): Promise<void> {
    await query(
      `UPDATE agents
       SET last_heartbeat = NOW(),
           status = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [heartbeat.status, heartbeat.agent_id]
    );

    // If agent has an active task, update the session
    if (heartbeat.current_task_id) {
      await query(
        `UPDATE agent_execution_sessions
         SET updated_at = NOW(),
             checkpoint_state = checkpoint_state || $1::jsonb
         WHERE agent_id = $2 AND task_id = $3 AND status = 'active'`,
        [
          JSON.stringify({
            last_heartbeat: new Date().toISOString(),
            memory_usage_mb: heartbeat.memory_usage_mb,
            uptime_seconds: heartbeat.uptime_seconds,
          }),
          heartbeat.agent_id,
          heartbeat.current_task_id,
        ]
      );
    }

    // Notify any registered callbacks
    const callback = this.heartbeatCallbacks.get(heartbeat.agent_id);
    if (callback) {
      callback(heartbeat);
    }
  }

  /**
   * Checks for agents that have missed heartbeats
   */
  async checkStaleAgents(): Promise<Agent[]> {
    const staleThreshold = new Date(Date.now() - this.config.staleThresholdMs);

    const staleAgents = await query<Agent>(
      `SELECT * FROM agents
       WHERE status = 'active'
         AND heartbeat_mode IN ('continuous', 'scheduled')
         AND (last_heartbeat IS NULL OR last_heartbeat < $1)`,
      [staleThreshold]
    );

    return staleAgents;
  }

  /**
   * Marks an agent as inactive due to missed heartbeats
   */
  async markAgentInactive(agentId: string, reason: string): Promise<void> {
    await query(
      `UPDATE agents
       SET status = 'inactive',
           updated_at = NOW()
       WHERE id = $1`,
      [agentId]
    );

    // Log the status change
    console.log(`Agent ${agentId} marked inactive: ${reason}`);
  }

  /**
   * Reactivates an agent after it starts sending heartbeats again
   */
  async reactivateAgent(agentId: string): Promise<void> {
    await query(
      `UPDATE agents
       SET status = 'active',
           last_heartbeat = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [agentId]
    );
  }

  /**
   * Gets the health status of all agents
   */
  async getAgentHealthStatus(): Promise<Array<{
    agent_id: string;
    agent_slug: string;
    status: AgentStatus;
    last_heartbeat: Date | null;
    is_stale: boolean;
    seconds_since_heartbeat: number | null;
    active_sessions: number;
  }>> {
    const agents = await query<Agent>(
      `SELECT * FROM agents ORDER BY status, name`
    );

    const now = Date.now();
    const healthStatuses = await Promise.all(
      agents.map(async agent => {
        const activeSessions = await queryOne<{ count: string }>(
          `SELECT COUNT(*) as count FROM agent_execution_sessions
           WHERE agent_id = $1 AND status = 'active'`,
          [agent.id]
        );

        const lastHeartbeatMs = agent.last_heartbeat
          ? new Date(agent.last_heartbeat).getTime()
          : null;

        return {
          agent_id: agent.id,
          agent_slug: agent.slug,
          status: agent.status as AgentStatus,
          last_heartbeat: agent.last_heartbeat,
          is_stale: lastHeartbeatMs
            ? (now - lastHeartbeatMs) > this.config.staleThresholdMs
            : true,
          seconds_since_heartbeat: lastHeartbeatMs
            ? Math.floor((now - lastHeartbeatMs) / 1000)
            : null,
          active_sessions: parseInt(activeSessions?.count || '0'),
        };
      })
    );

    return healthStatuses;
  }

  /**
   * Creates a new execution session for an agent
   */
  async createSession(
    agentId: string,
    taskId: string
  ): Promise<AgentExecutionSession> {
    const result = await queryOne<AgentExecutionSession>(
      `INSERT INTO agent_execution_sessions (agent_id, task_id, status)
       VALUES ($1, $2, 'active')
       RETURNING *`,
      [agentId, taskId]
    );

    if (!result) {
      throw new Error('Failed to create execution session');
    }

    return result;
  }

  /**
   * Updates a session's checkpoint state
   */
  async updateSessionCheckpoint(
    sessionId: string,
    checkpointState: Record<string, unknown>
  ): Promise<void> {
    await query(
      `UPDATE agent_execution_sessions
       SET checkpoint_state = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(checkpointState), sessionId]
    );
  }

  /**
   * Appends a message to the session's conversation history
   */
  async appendToConversation(
    sessionId: string,
    message: { role: string; content: string; tokens?: number }
  ): Promise<void> {
    const messageWithTimestamp = {
      ...message,
      timestamp: new Date().toISOString(),
    };

    await query(
      `UPDATE agent_execution_sessions
       SET conversation_history = conversation_history || $1::jsonb,
           total_tokens = total_tokens + COALESCE($2, 0),
           updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify([messageWithTimestamp]), message.tokens || 0, sessionId]
    );
  }

  /**
   * Completes a session
   */
  async completeSession(
    sessionId: string,
    finalCostUsd: number
  ): Promise<void> {
    await query(
      `UPDATE agent_execution_sessions
       SET status = 'completed',
           total_cost_usd = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [finalCostUsd, sessionId]
    );
  }

  /**
   * Fails a session
   */
  async failSession(sessionId: string, error: string): Promise<void> {
    await query(
      `UPDATE agent_execution_sessions
       SET status = 'failed',
           checkpoint_state = checkpoint_state || $1::jsonb,
           updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify({ error, failed_at: new Date().toISOString() }), sessionId]
    );
  }

  /**
   * Resumes a paused session
   */
  async resumeSession(sessionId: string): Promise<AgentExecutionSession | null> {
    return queryOne<AgentExecutionSession>(
      `UPDATE agent_execution_sessions
       SET status = 'active',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [sessionId]
    );
  }

  /**
   * Gets all sessions for an agent
   */
  async getAgentSessions(agentId: string): Promise<AgentExecutionSession[]> {
    return query<AgentExecutionSession>(
      `SELECT * FROM agent_execution_sessions
       WHERE agent_id = $1
       ORDER BY created_at DESC`,
      [agentId]
    );
  }

  /**
   * Gets the active session for a task
   */
  async getTaskSession(taskId: string): Promise<AgentExecutionSession | null> {
    return queryOne<AgentExecutionSession>(
      `SELECT * FROM agent_execution_sessions
       WHERE task_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [taskId]
    );
  }

  /**
   * Registers a callback for heartbeat events from a specific agent
   */
  onHeartbeat(agentId: string, callback: (heartbeat: AgentHeartbeat) => void): void {
    this.heartbeatCallbacks.set(agentId, callback);
  }

  /**
   * Removes a heartbeat callback
   */
  offHeartbeat(agentId: string): void {
    this.heartbeatCallbacks.delete(agentId);
  }

  /**
   * Gets the expected next heartbeat time for an agent
   */
  async getNextExpectedHeartbeat(agentId: string): Promise<Date | null> {
    const agent = await queryOne<Agent>(
      'SELECT last_heartbeat, heartbeat_interval_seconds FROM agents WHERE id = $1',
      [agentId]
    );

    if (!agent || !agent.last_heartbeat) {
      return null;
    }

    const lastHeartbeat = new Date(agent.last_heartbeat);
    return new Date(lastHeartbeat.getTime() + (agent.heartbeat_interval_seconds * 1000));
  }
}

// Export singleton instance
export const heartbeatCoordinator = new HeartbeatCoordinator();
