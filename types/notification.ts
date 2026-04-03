// Notification types for real-time alerts

export type NotificationType =
  | 'approval_required'
  | 'task_assigned'
  | 'agent_status_change'
  | 'budget_alert'
  | 'goal_completed'
  | 'task_completed'
  | 'delegation_received'
  | 'system';

export interface Notification {
  id: string;
  user_id: string | null;
  type: NotificationType;
  title: string;
  message: string | null;
  metadata: NotificationMetadata;
  is_read: boolean;
  read_at: Date | null;
  created_at: Date;
  expires_at: Date | null;
}

export interface NotificationMetadata {
  entity_id?: string;
  entity_type?: 'task' | 'goal' | 'agent' | 'team' | 'approval' | 'delegation';
  action_url?: string;
  agent_id?: string;
  agent_name?: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  [key: string]: unknown;
}

export interface CreateNotificationInput {
  user_id?: string;
  type: NotificationType;
  title: string;
  message?: string;
  metadata?: NotificationMetadata;
  expires_at?: Date;
}

export interface NotificationFilters {
  user_id?: string;
  type?: NotificationType;
  is_read?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<NotificationType, number>;
}
