// Goal types for the Intelligent Work System

export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Goal {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: GoalStatus;
  priority: GoalPriority;
  target_date: Date | null;
  created_at: Date;
  completed_at: Date | null;
  updated_at: Date;
}

export interface CreateGoalInput {
  project_id?: string;
  title: string;
  description?: string;
  priority?: GoalPriority;
  target_date?: string; // ISO date string
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  status?: GoalStatus;
  priority?: GoalPriority;
  target_date?: string | null;
}

export interface GoalWithTasks extends Goal {
  tasks: import('./task').Task[];
  task_count: number;
  completed_task_count: number;
  total_estimated_cost: number;
  total_actual_cost: number;
}

export interface GoalDecompositionResult {
  goal_id: string;
  tasks: import('./task').CreateTaskInput[];
  reasoning: string;
  estimated_total_cost: number;
  estimated_complexity: string;
}
