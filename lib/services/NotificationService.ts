import { query, queryOne, Notification as DbNotification } from '@/lib/db/client';
import type {
  Notification,
  CreateNotificationInput,
  NotificationFilters,
  NotificationStats,
  NotificationType,
} from '@/types/notification';

export class NotificationService {
  /**
   * Creates a new notification
   */
  async create(input: CreateNotificationInput): Promise<Notification> {
    const result = await queryOne<DbNotification>(
      `INSERT INTO notifications (user_id, type, title, message, metadata, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.user_id || null,
        input.type,
        input.title,
        input.message || null,
        JSON.stringify(input.metadata || {}),
        input.expires_at || null,
      ]
    );

    if (!result) {
      throw new Error('Failed to create notification');
    }

    return this.toNotification(result);
  }

  /**
   * Gets a notification by ID
   */
  async getById(id: string): Promise<Notification | null> {
    const result = await queryOne<DbNotification>(
      'SELECT * FROM notifications WHERE id = $1',
      [id]
    );

    return result ? this.toNotification(result) : null;
  }

  /**
   * Lists notifications with optional filters
   */
  async list(filters: NotificationFilters = {}): Promise<Notification[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Filter out expired notifications
    conditions.push(`(expires_at IS NULL OR expires_at > NOW())`);

    if (filters.user_id !== undefined) {
      conditions.push(`(user_id = $${paramIndex} OR user_id IS NULL)`);
      params.push(filters.user_id);
      paramIndex++;
    }

    if (filters.type) {
      conditions.push(`type = $${paramIndex}`);
      params.push(filters.type);
      paramIndex++;
    }

    if (filters.is_read !== undefined) {
      conditions.push(`is_read = $${paramIndex}`);
      params.push(filters.is_read);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const results = await query<DbNotification>(
      `SELECT * FROM notifications
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return results.map(this.toNotification);
  }

  /**
   * Gets unread notification count
   */
  async getUnreadCount(userId?: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM notifications
       WHERE is_read = false
       AND (expires_at IS NULL OR expires_at > NOW())
       ${userId ? 'AND (user_id = $1 OR user_id IS NULL)' : ''}`,
      userId ? [userId] : []
    );

    return parseInt(result?.count || '0', 10);
  }

  /**
   * Gets notification statistics
   */
  async getStats(userId?: string): Promise<NotificationStats> {
    const baseCondition = userId
      ? '(user_id = $1 OR user_id IS NULL)'
      : '1=1';
    const params = userId ? [userId] : [];

    const countResult = await queryOne<{ total: string; unread: string }>(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE is_read = false) as unread
       FROM notifications
       WHERE ${baseCondition}
       AND (expires_at IS NULL OR expires_at > NOW())`,
      params
    );

    const typeResults = await query<{ type: string; count: string }>(
      `SELECT type, COUNT(*) as count
       FROM notifications
       WHERE ${baseCondition}
       AND (expires_at IS NULL OR expires_at > NOW())
       GROUP BY type`,
      params
    );

    const byType: Record<NotificationType, number> = {} as Record<NotificationType, number>;
    for (const row of typeResults) {
      byType[row.type as NotificationType] = parseInt(row.count, 10);
    }

    return {
      total: parseInt(countResult?.total || '0', 10),
      unread: parseInt(countResult?.unread || '0', 10),
      by_type: byType,
    };
  }

  /**
   * Marks a notification as read
   */
  async markAsRead(id: string): Promise<Notification | null> {
    const result = await queryOne<DbNotification>(
      `UPDATE notifications
       SET is_read = true, read_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return result ? this.toNotification(result) : null;
  }

  /**
   * Marks all notifications as read
   */
  async markAllAsRead(userId?: string): Promise<number> {
    const result = await query<{ id: string }>(
      `UPDATE notifications
       SET is_read = true, read_at = NOW()
       WHERE is_read = false
       ${userId ? 'AND (user_id = $1 OR user_id IS NULL)' : ''}
       RETURNING id`,
      userId ? [userId] : []
    );

    return result.length;
  }

  /**
   * Deletes a notification
   */
  async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM notifications WHERE id = $1 RETURNING id',
      [id]
    );

    return result.length > 0;
  }

  /**
   * Deletes expired notifications (cleanup job)
   */
  async deleteExpired(): Promise<number> {
    const result = await query<{ id: string }>(
      'DELETE FROM notifications WHERE expires_at < NOW() RETURNING id',
      []
    );

    return result.length;
  }

  // ============================================================================
  // Trigger methods for creating notifications from various events
  // ============================================================================

  /**
   * Creates a notification when an approval is required
   */
  async notifyApprovalRequired(input: {
    approval_id: string;
    operation_type: string;
    agent_name?: string;
    task_title?: string;
  }): Promise<Notification> {
    return this.create({
      type: 'approval_required',
      title: 'Approval Required',
      message: `${input.agent_name || 'An agent'} requires approval for: ${input.operation_type}`,
      metadata: {
        entity_id: input.approval_id,
        entity_type: 'approval',
        action_url: `/approvals`,
        agent_name: input.agent_name,
        severity: 'warning',
      },
    });
  }

  /**
   * Creates a notification when a task is assigned
   */
  async notifyTaskAssigned(input: {
    task_id: string;
    task_title: string;
    agent_id: string;
    agent_name: string;
  }): Promise<Notification> {
    return this.create({
      type: 'task_assigned',
      title: 'Task Assigned',
      message: `"${input.task_title}" has been assigned to ${input.agent_name}`,
      metadata: {
        entity_id: input.task_id,
        entity_type: 'task',
        action_url: `/tasks`,
        agent_id: input.agent_id,
        agent_name: input.agent_name,
        severity: 'info',
      },
    });
  }

  /**
   * Creates a notification when an agent's status changes
   */
  async notifyAgentStatusChange(input: {
    agent_id: string;
    agent_name: string;
    old_status: string;
    new_status: string;
  }): Promise<Notification> {
    const severity = input.new_status === 'error' ? 'error' :
                    input.new_status === 'paused' ? 'warning' : 'info';

    return this.create({
      type: 'agent_status_change',
      title: 'Agent Status Changed',
      message: `${input.agent_name} status: ${input.old_status} → ${input.new_status}`,
      metadata: {
        entity_id: input.agent_id,
        entity_type: 'agent',
        action_url: `/agents/${input.agent_id}`,
        agent_id: input.agent_id,
        agent_name: input.agent_name,
        old_status: input.old_status,
        new_status: input.new_status,
        severity,
      },
    });
  }

  /**
   * Creates a notification when budget threshold is reached
   */
  async notifyBudgetAlert(input: {
    agent_id?: string;
    agent_name?: string;
    current_spend: number;
    budget_limit: number;
    percentage: number;
  }): Promise<Notification> {
    const severity = input.percentage >= 100 ? 'error' : 'warning';
    const title = input.percentage >= 100 ? 'Budget Exceeded' : 'Budget Alert';

    return this.create({
      type: 'budget_alert',
      title,
      message: `${input.agent_name || 'System'} has used ${input.percentage.toFixed(0)}% of budget ($${input.current_spend.toFixed(2)}/$${input.budget_limit.toFixed(2)})`,
      metadata: {
        entity_id: input.agent_id,
        entity_type: input.agent_id ? 'agent' : undefined,
        action_url: '/costs',
        agent_id: input.agent_id,
        agent_name: input.agent_name,
        current_spend: input.current_spend,
        budget_limit: input.budget_limit,
        percentage: input.percentage,
        severity,
      },
    });
  }

  /**
   * Creates a notification when a goal is completed
   */
  async notifyGoalCompleted(input: {
    goal_id: string;
    goal_title: string;
  }): Promise<Notification> {
    return this.create({
      type: 'goal_completed',
      title: 'Goal Completed',
      message: `"${input.goal_title}" has been completed`,
      metadata: {
        entity_id: input.goal_id,
        entity_type: 'goal',
        action_url: `/goals/${input.goal_id}`,
        severity: 'success',
      },
    });
  }

  /**
   * Creates a notification when a task is completed
   */
  async notifyTaskCompleted(input: {
    task_id: string;
    task_title: string;
    agent_name?: string;
  }): Promise<Notification> {
    return this.create({
      type: 'task_completed',
      title: 'Task Completed',
      message: `"${input.task_title}" has been completed${input.agent_name ? ` by ${input.agent_name}` : ''}`,
      metadata: {
        entity_id: input.task_id,
        entity_type: 'task',
        action_url: `/tasks`,
        agent_name: input.agent_name,
        severity: 'success',
      },
    });
  }

  /**
   * Creates a notification when a delegation is received
   */
  async notifyDelegationReceived(input: {
    delegation_id: string;
    task_id: string;
    task_title: string;
    from_agent_name: string;
    to_agent_name: string;
  }): Promise<Notification> {
    return this.create({
      type: 'delegation_received',
      title: 'Task Delegated',
      message: `${input.from_agent_name} delegated "${input.task_title}" to ${input.to_agent_name}`,
      metadata: {
        entity_id: input.delegation_id,
        entity_type: 'delegation',
        action_url: `/tasks`,
        task_id: input.task_id,
        from_agent_name: input.from_agent_name,
        to_agent_name: input.to_agent_name,
        severity: 'info',
      },
    });
  }

  /**
   * Creates a system notification
   */
  async notifySystem(input: {
    title: string;
    message: string;
    severity?: 'info' | 'warning' | 'error' | 'success';
    action_url?: string;
  }): Promise<Notification> {
    return this.create({
      type: 'system',
      title: input.title,
      message: input.message,
      metadata: {
        severity: input.severity || 'info',
        action_url: input.action_url,
      },
    });
  }

  private toNotification(db: DbNotification): Notification {
    return {
      ...db,
      type: db.type as NotificationType,
      metadata: typeof db.metadata === 'string' ? JSON.parse(db.metadata) : db.metadata,
    } as Notification;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
