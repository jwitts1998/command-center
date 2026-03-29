// Agent types for the Dynamic Agent Registry

export type AgentStatus = 'active' | 'paused' | 'inactive' | 'error';
export type AgentRole = 'executive' | 'specialist' | 'worker' | 'coordinator';
export type HeartbeatMode = 'continuous' | 'on_demand' | 'scheduled';
export type AdapterType = 'claude' | 'openai' | 'custom';

export interface Agent {
  id: string;
  slug: string;
  name: string;
  description: string | null;

  // Role & capabilities
  role: AgentRole;
  capabilities: string[];
  specializations: string[];

  // Configuration
  system_prompt_path: string | null;
  adapter_type: AdapterType;
  adapter_config: Record<string, unknown>;

  // Hierarchy
  reports_to: string | null;

  // State
  status: AgentStatus;

  // Heartbeat
  heartbeat_mode: HeartbeatMode;
  heartbeat_interval_seconds: number;
  last_heartbeat: Date | null;

  // Budget
  monthly_budget_usd: number | null;
  current_month_spend_usd: number;

  created_at: Date;
  updated_at: Date;
}

export interface CreateAgentInput {
  slug: string;
  name: string;
  description?: string;
  role: AgentRole;
  capabilities?: string[];
  specializations?: string[];
  system_prompt_path?: string;
  adapter_type?: AdapterType;
  adapter_config?: Record<string, unknown>;
  reports_to?: string;
  heartbeat_mode?: HeartbeatMode;
  heartbeat_interval_seconds?: number;
  monthly_budget_usd?: number;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  role?: AgentRole;
  capabilities?: string[];
  specializations?: string[];
  system_prompt_path?: string;
  adapter_type?: AdapterType;
  adapter_config?: Record<string, unknown>;
  reports_to?: string | null;
  status?: AgentStatus;
  heartbeat_mode?: HeartbeatMode;
  heartbeat_interval_seconds?: number;
  monthly_budget_usd?: number;
}

export interface AgentWithHierarchy extends Agent {
  subordinates: Agent[];
  manager: Agent | null;
  team: import('./team').Team | null;
}

export interface AgentExecutionSession {
  id: string;
  agent_id: string;
  task_id: string | null;
  status: 'active' | 'paused' | 'completed' | 'failed';
  checkpoint_state: Record<string, unknown>;
  conversation_history: ConversationMessage[];
  total_tokens: number;
  total_cost_usd: number;
  created_at: Date;
  updated_at: Date;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tokens?: number;
}

export interface AgentRoutingRequest {
  task_id: string;
  task_description: string;
  required_capabilities?: string[];
  preferred_agent_id?: string;
  exclude_agent_ids?: string[];
  max_cost_usd?: number;
}

export interface AgentRoutingResult {
  selected_agent_id: string;
  agent_slug: string;
  confidence: number;
  reasoning: string;
  alternative_agents: Array<{
    agent_id: string;
    agent_slug: string;
    confidence: number;
    reason: string;
  }>;
}

export interface AgentHeartbeat {
  agent_id: string;
  status: AgentStatus;
  current_task_id: string | null;
  memory_usage_mb?: number;
  uptime_seconds?: number;
  last_activity?: string;
}
