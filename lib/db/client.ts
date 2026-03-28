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
