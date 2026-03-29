import { query, queryOne } from '@/lib/db/client';
import type { Task, TaskAuditLog } from '@/lib/db/client';
import type { TaskCheckoutResult, TaskReleaseResult, TaskStatus, TaskAuditAction } from '@/types/task';
import { randomUUID } from 'crypto';

// Default checkout duration: 30 minutes
const DEFAULT_CHECKOUT_DURATION_MS = 30 * 60 * 1000;

export class TaskCheckout {
  /**
   * Atomically checks out a task for an agent.
   * Uses database-level locking to prevent race conditions.
   */
  async checkout(
    taskId: string,
    agentId: string,
    durationMs: number = DEFAULT_CHECKOUT_DURATION_MS
  ): Promise<TaskCheckoutResult> {
    const checkoutToken = randomUUID();
    const expiresAt = new Date(Date.now() + durationMs);

    try {
      // Atomic checkout using UPDATE with WHERE conditions
      // This ensures only one agent can checkout at a time
      const result = await queryOne<{ id: string; checkout_token: string; checkout_expires_at: Date }>(
        `UPDATE tasks
         SET checkout_token = $1,
             checkout_expires_at = $2,
             assigned_agent_id = $3,
             status = 'in_progress',
             started_at = COALESCE(started_at, NOW()),
             updated_at = NOW()
         WHERE id = $4
           AND (
             checkout_token IS NULL
             OR checkout_expires_at < NOW()
           )
           AND status IN ('pending', 'ready')
         RETURNING id, checkout_token, checkout_expires_at`,
        [checkoutToken, expiresAt, agentId, taskId]
      );

      if (!result) {
        // Task is already checked out or not in a checkable state
        const task = await queryOne<Task>(
          'SELECT * FROM tasks WHERE id = $1',
          [taskId]
        );

        if (!task) {
          return {
            success: false,
            task_id: taskId,
            checkout_token: null,
            expires_at: null,
            error: 'Task not found',
          };
        }

        if (task.checkout_token && task.checkout_expires_at && task.checkout_expires_at > new Date()) {
          return {
            success: false,
            task_id: taskId,
            checkout_token: null,
            expires_at: null,
            error: `Task is already checked out until ${task.checkout_expires_at.toISOString()}`,
          };
        }

        return {
          success: false,
          task_id: taskId,
          checkout_token: null,
          expires_at: null,
          error: `Task is in invalid state for checkout: ${task.status}`,
        };
      }

      // Log the checkout
      await this.logAuditEntry(taskId, 'checked_out', 'agent', agentId, null, {
        checkout_token: checkoutToken,
        checkout_expires_at: expiresAt.toISOString(),
        assigned_agent_id: agentId,
      });

      return {
        success: true,
        task_id: taskId,
        checkout_token: checkoutToken,
        expires_at: expiresAt,
      };
    } catch (error) {
      console.error('Error checking out task:', error);
      return {
        success: false,
        task_id: taskId,
        checkout_token: null,
        expires_at: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Releases a task checkout.
   * Optionally updates the task status (completed, failed, etc.)
   */
  async release(
    taskId: string,
    checkoutToken: string,
    newStatus: TaskStatus = 'ready',
    actualCostUsd?: number
  ): Promise<TaskReleaseResult> {
    try {
      // Verify token and release
      const isTerminalStatus = ['completed', 'failed', 'cancelled'].includes(newStatus);
      const result = await queryOne<{ id: string; status: string }>(
        `UPDATE tasks
         SET checkout_token = NULL,
             checkout_expires_at = NULL,
             status = $1::VARCHAR,
             completed_at = CASE WHEN $5 THEN NOW() ELSE completed_at END,
             actual_cost_usd = COALESCE($2::DECIMAL, actual_cost_usd),
             updated_at = NOW()
         WHERE id = $3
           AND checkout_token = $4
         RETURNING id, status`,
        [newStatus, actualCostUsd ?? null, taskId, checkoutToken, isTerminalStatus]
      );

      if (!result) {
        return {
          success: false,
          task_id: taskId,
          status: 'pending',
          error: 'Invalid checkout token or task not found',
        };
      }

      // Log the release
      await this.logAuditEntry(taskId, 'released', 'agent', null, null, {
        status: newStatus,
        actual_cost_usd: actualCostUsd,
      });

      return {
        success: true,
        task_id: taskId,
        status: newStatus,
      };
    } catch (error) {
      console.error('Error releasing task:', error);
      return {
        success: false,
        task_id: taskId,
        status: 'pending',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Extends a checkout by updating the expiration time
   */
  async extendCheckout(
    taskId: string,
    checkoutToken: string,
    additionalMs: number = DEFAULT_CHECKOUT_DURATION_MS
  ): Promise<TaskCheckoutResult> {
    const newExpiresAt = new Date(Date.now() + additionalMs);

    try {
      const result = await queryOne<{ id: string; checkout_token: string; checkout_expires_at: Date }>(
        `UPDATE tasks
         SET checkout_expires_at = $1,
             updated_at = NOW()
         WHERE id = $2
           AND checkout_token = $3
         RETURNING id, checkout_token, checkout_expires_at`,
        [newExpiresAt, taskId, checkoutToken]
      );

      if (!result) {
        return {
          success: false,
          task_id: taskId,
          checkout_token: null,
          expires_at: null,
          error: 'Invalid checkout token or task not found',
        };
      }

      return {
        success: true,
        task_id: taskId,
        checkout_token: checkoutToken,
        expires_at: newExpiresAt,
      };
    } catch (error) {
      console.error('Error extending checkout:', error);
      return {
        success: false,
        task_id: taskId,
        checkout_token: null,
        expires_at: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Force-releases expired checkouts.
   * Should be called periodically to clean up stale checkouts.
   */
  async releaseExpiredCheckouts(): Promise<number> {
    const result = await query<{ id: string }>(
      `UPDATE tasks
       SET checkout_token = NULL,
           checkout_expires_at = NULL,
           status = 'ready',
           updated_at = NOW()
       WHERE checkout_token IS NOT NULL
         AND checkout_expires_at < NOW()
       RETURNING id`
    );

    // Log all expired releases
    for (const task of result) {
      await this.logAuditEntry(task.id, 'released', 'system', 'expired_checkout_cleanup', null, {
        reason: 'checkout_expired',
      });
    }

    return result.length;
  }

  /**
   * Gets the current checkout status of a task
   */
  async getCheckoutStatus(taskId: string): Promise<{
    isCheckedOut: boolean;
    assignedAgentId: string | null;
    checkoutExpiresAt: Date | null;
    timeRemainingMs: number | null;
  }> {
    const task = await queryOne<Task>(
      'SELECT assigned_agent_id, checkout_token, checkout_expires_at FROM tasks WHERE id = $1',
      [taskId]
    );

    if (!task || !task.checkout_token) {
      return {
        isCheckedOut: false,
        assignedAgentId: null,
        checkoutExpiresAt: null,
        timeRemainingMs: null,
      };
    }

    const now = new Date();
    const expiresAt = task.checkout_expires_at ? new Date(task.checkout_expires_at) : null;
    const isExpired = expiresAt ? expiresAt < now : true;

    if (isExpired) {
      return {
        isCheckedOut: false,
        assignedAgentId: null,
        checkoutExpiresAt: null,
        timeRemainingMs: null,
      };
    }

    return {
      isCheckedOut: true,
      assignedAgentId: task.assigned_agent_id,
      checkoutExpiresAt: expiresAt,
      timeRemainingMs: expiresAt ? expiresAt.getTime() - now.getTime() : null,
    };
  }

  /**
   * Lists all currently checked out tasks
   */
  async listCheckedOutTasks(): Promise<Array<{
    task_id: string;
    task_title: string;
    assigned_agent_id: string;
    checkout_expires_at: Date;
    time_remaining_ms: number;
  }>> {
    const tasks = await query<{
      id: string;
      title: string;
      assigned_agent_id: string;
      checkout_expires_at: Date;
    }>(
      `SELECT id, title, assigned_agent_id, checkout_expires_at
       FROM tasks
       WHERE checkout_token IS NOT NULL
         AND checkout_expires_at > NOW()
       ORDER BY checkout_expires_at ASC`
    );

    const now = new Date();
    return tasks.map(task => ({
      task_id: task.id,
      task_title: task.title,
      assigned_agent_id: task.assigned_agent_id,
      checkout_expires_at: task.checkout_expires_at,
      time_remaining_ms: new Date(task.checkout_expires_at).getTime() - now.getTime(),
    }));
  }

  /**
   * Validates a checkout token for a task
   */
  async validateToken(taskId: string, checkoutToken: string): Promise<boolean> {
    const task = await queryOne<{ checkout_token: string; checkout_expires_at: Date }>(
      `SELECT checkout_token, checkout_expires_at
       FROM tasks
       WHERE id = $1 AND checkout_token = $2`,
      [taskId, checkoutToken]
    );

    if (!task) {
      return false;
    }

    return task.checkout_expires_at > new Date();
  }

  private async logAuditEntry(
    taskId: string,
    action: TaskAuditAction,
    actorType: 'user' | 'agent' | 'system',
    actorId: string | null,
    previousState: Record<string, unknown> | null,
    newState: Record<string, unknown> | null
  ): Promise<void> {
    await query(
      `INSERT INTO task_audit_log (task_id, action, actor_type, actor_id, previous_state, new_state)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        taskId,
        action,
        actorType,
        actorId,
        previousState ? JSON.stringify(previousState) : null,
        newState ? JSON.stringify(newState) : null,
      ]
    );
  }
}

// Export singleton instance
export const taskCheckout = new TaskCheckout();
