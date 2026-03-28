export interface AgentSession {
  id: string;
  project_id: string;
  agent_type: string | null;
  task_id: string | null;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | null;
  started_at: Date;
  completed_at: Date | null;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  model_used: string | null;
  user_prompt: string | null;
  enriched_prompt: string | null;
  metadata: Record<string, any>;
}

export interface CreateSessionInput {
  project_id: string;
  agent_type?: string;
  task_id?: string;
  user_prompt?: string;
  enriched_prompt?: string;
  model_used?: string;
}

export interface UpdateSessionInput {
  status?: 'running' | 'completed' | 'failed' | 'cancelled';
  completed_at?: Date;
  tokens_input?: number;
  tokens_output?: number;
  cost_usd?: number;
  metadata?: Record<string, any>;
}

export interface SessionStats {
  total_sessions: number;
  active_sessions: number;
  total_cost: number;
  total_tokens: number;
  avg_session_cost: number;
}
