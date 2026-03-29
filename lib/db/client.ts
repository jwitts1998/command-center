import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a connection to the Neon database
const sql = neon(process.env.DATABASE_URL);

// Helper to execute queries with better error handling
export async function query<T = any>(
  queryText: string,
  params?: any[]
): Promise<T[]> {
  try {
    // Use sql.query() for parameterized queries
    const result = await sql.query(queryText, params || []);
    return result as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper to execute a single query and return the first result
export async function queryOne<T = any>(
  queryText: string,
  params?: any[]
): Promise<T | null> {
  const results = await query<T>(queryText, params);
  return results.length > 0 ? results[0] : null;
}

// Export sql for tagged template literal usage
export { sql };

// Type definitions for database tables
export interface Project {
  id: string;
  name: string;
  description: string | null;
  tech_stack: Record<string, any>;
  repo_path: string | null;
  status: string;
  monthly_budget: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface AgentSession {
  id: string;
  project_id: string;
  agent_type: string | null;
  task_id: string | null;
  status: string | null;
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

export interface ClarificationSession {
  id: string;
  project_id: string;
  user_prompt: string;
  ambiguities: any[];
  questions: any[];
  answers: Record<string, any>;
  enriched_prompt: string | null;
  status: string;
  created_at: Date;
  completed_at: Date | null;
}

export interface Pattern {
  id: string;
  pattern_type: string | null;
  name: string | null;
  description: string | null;
  pattern_data: Record<string, any>;
  source_projects: string[];
  applicable_to: Record<string, any>;
  confidence: number;
  auto_apply: boolean;
  times_applied: number;
  times_rejected: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserPreference {
  id: string;
  preference_type: string | null;
  key: string | null;
  value: Record<string, any>;
  confidence: number;
  learned_from: any[];
  created_at: Date;
  updated_at: Date;
}

export interface CostBudget {
  id: string;
  project_id: string;
  month: string;
  limit_usd: number | null;
  spent_usd: number;
  alert_threshold: number;
  alerted: boolean;
  created_at: Date;
}

export interface Stakeholder {
  id: string;
  project_id: string;
  name: string;
  role: string | null;
  email: string | null;
  communication_preferences: Record<string, any>;
  approval_required_for: any[];
  created_at: Date;
}

// Phase 1: Intelligent Work System
export interface Goal {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  target_date: Date | null;
  created_at: Date;
  completed_at: Date | null;
  updated_at: Date;
}

export interface Task {
  id: string;
  goal_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  complexity: string | null;
  estimated_cost_usd: number | null;
  assigned_agent_id: string | null;
  checkout_token: string | null;
  checkout_expires_at: Date | null;
  run_id: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  actual_cost_usd: number | null;
  depth: number;
  created_at: Date;
  updated_at: Date;
}

export interface TaskAuditLog {
  id: string;
  task_id: string;
  action: string;
  actor_type: string;
  actor_id: string | null;
  previous_state: Record<string, any> | null;
  new_state: Record<string, any> | null;
  created_at: Date;
}

// Phase 2: Dynamic Agent Registry
export interface Agent {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  role: string;
  capabilities: string[];
  specializations: string[];
  system_prompt_path: string | null;
  adapter_type: string;
  adapter_config: Record<string, any>;
  reports_to: string | null;
  status: string;
  heartbeat_mode: string;
  heartbeat_interval_seconds: number;
  last_heartbeat: Date | null;
  monthly_budget_usd: number | null;
  current_month_spend_usd: number;
  created_at: Date;
  updated_at: Date;
}

export interface AgentExecutionSession {
  id: string;
  agent_id: string;
  task_id: string | null;
  status: string;
  checkpoint_state: Record<string, any>;
  conversation_history: any[];
  total_tokens: number;
  total_cost_usd: number;
  created_at: Date;
  updated_at: Date;
}

// Phase 3: Trust-Based Governance
export interface ApprovalPolicy {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, any>;
  requires_approval: boolean;
  auto_approve_confidence: number;
  times_approved: number;
  times_rejected: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ApprovalRequest {
  id: string;
  policy_id: string | null;
  task_id: string | null;
  agent_id: string | null;
  operation_type: string;
  operation_details: Record<string, any>;
  risk_assessment: Record<string, any> | null;
  status: string;
  requested_at: Date;
  decided_at: Date | null;
  decided_by: string | null;
  decision_reason: string | null;
  created_at: Date;
}

// Phase 4: Organization & Delegation
export interface Team {
  id: string;
  name: string;
  description: string | null;
  lead_agent_id: string | null;
  budget_usd: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface TeamMember {
  id: string;
  team_id: string;
  agent_id: string;
  role: string;
  joined_at: Date;
}

export interface Delegation {
  id: string;
  task_id: string;
  from_agent_id: string;
  to_agent_id: string;
  depth: number;
  reason: string | null;
  status: string;
  delegated_at: Date;
  completed_at: Date | null;
}
