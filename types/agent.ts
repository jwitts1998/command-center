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

// Agent Templates for quick setup
export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  role: AgentRole;
  capabilities: string[];
  specializations: string[];
  adapter_type: AdapterType;
  heartbeat_mode: HeartbeatMode;
  suggested_budget?: number;
  icon?: string;
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'coder',
    name: 'Code Writer',
    description: 'Writes and implements code based on specifications',
    role: 'worker',
    capabilities: ['code_execution', 'file_operations', 'debugging'],
    specializations: ['software_engineering'],
    adapter_type: 'claude',
    heartbeat_mode: 'on_demand',
    suggested_budget: 50,
    icon: 'code',
  },
  {
    id: 'reviewer',
    name: 'Code Reviewer',
    description: 'Reviews code for quality, security, and best practices',
    role: 'specialist',
    capabilities: ['code_review', 'testing', 'security_analysis'],
    specializations: ['code_quality', 'security'],
    adapter_type: 'claude',
    heartbeat_mode: 'on_demand',
    suggested_budget: 30,
    icon: 'search-code',
  },
  {
    id: 'architect',
    name: 'System Architect',
    description: 'Designs system architecture and makes technical decisions',
    role: 'executive',
    capabilities: ['planning', 'design', 'technical_review', 'documentation'],
    specializations: ['system_design', 'technical_leadership'],
    adapter_type: 'claude',
    heartbeat_mode: 'on_demand',
    suggested_budget: 75,
    icon: 'layers',
  },
  {
    id: 'coordinator',
    name: 'Task Coordinator',
    description: 'Coordinates tasks and manages delegation between agents',
    role: 'coordinator',
    capabilities: ['task_management', 'delegation', 'prioritization'],
    specializations: ['project_management', 'resource_allocation'],
    adapter_type: 'claude',
    heartbeat_mode: 'continuous',
    suggested_budget: 40,
    icon: 'git-branch',
  },
  {
    id: 'tester',
    name: 'QA Tester',
    description: 'Writes and executes tests, ensures quality',
    role: 'specialist',
    capabilities: ['testing', 'qa', 'test_automation', 'bug_reporting'],
    specializations: ['quality_assurance', 'test_engineering'],
    adapter_type: 'claude',
    heartbeat_mode: 'on_demand',
    suggested_budget: 35,
    icon: 'test-tube',
  },
  {
    id: 'devops',
    name: 'DevOps Engineer',
    description: 'Manages deployments, CI/CD, and infrastructure',
    role: 'specialist',
    capabilities: ['deployment', 'ci_cd', 'infrastructure', 'monitoring'],
    specializations: ['devops', 'cloud_engineering'],
    adapter_type: 'claude',
    heartbeat_mode: 'continuous',
    suggested_budget: 60,
    icon: 'cloud',
  },
];

// Wizard form data type
export interface AgentWizardData {
  // Step 1: Basic Info
  slug: string;
  name: string;
  description: string;
  role: AgentRole;

  // Step 2: Capabilities
  capabilities: string[];
  specializations: string[];

  // Step 3: Adapter Config
  adapter_type: AdapterType;
  adapter_config: Record<string, unknown>;

  // Step 4: Budget & Limits
  monthly_budget_usd: number | null;
  heartbeat_mode: HeartbeatMode;
  heartbeat_interval_seconds: number;

  // Step 5: System Prompt
  system_prompt_path: string;
}
