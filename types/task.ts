// Task types for the Intelligent Work System

export type TaskStatus = 'pending' | 'ready' | 'in_progress' | 'blocked' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskComplexity = 'trivial' | 'simple' | 'moderate' | 'complex' | 'epic';

export interface Task {
  id: string;
  goal_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  complexity: TaskComplexity | null;
  estimated_cost_usd: number | null;

  // Assignment & Checkout
  assigned_agent_id: string | null;
  checkout_token: string | null;
  checkout_expires_at: Date | null;

  // Execution
  run_id: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  actual_cost_usd: number | null;

  // Hierarchy
  depth: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskInput {
  goal_id?: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  complexity?: TaskComplexity;
  estimated_cost_usd?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  complexity?: TaskComplexity;
  estimated_cost_usd?: number;
  assigned_agent_id?: string | null;
  run_id?: string;
  actual_cost_usd?: number;
}

export interface TaskWithSubtasks extends Task {
  subtasks: Task[];
  subtask_count: number;
  completed_subtask_count: number;
}

export interface TaskCheckoutResult {
  success: boolean;
  task_id: string;
  checkout_token: string | null;
  expires_at: Date | null;
  error?: string;
}

export interface TaskReleaseResult {
  success: boolean;
  task_id: string;
  status: TaskStatus;
  error?: string;
}

export interface TaskAuditLogEntry {
  id: string;
  task_id: string;
  action: TaskAuditAction;
  actor_type: 'user' | 'agent' | 'system';
  actor_id: string | null;
  previous_state: Partial<Task> | null;
  new_state: Partial<Task> | null;
  created_at: Date;
}

export type TaskAuditAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'checked_out'
  | 'released'
  | 'assigned'
  | 'unassigned'
  | 'delegated'
  | 'completed'
  | 'failed'
  | 'cancelled';
