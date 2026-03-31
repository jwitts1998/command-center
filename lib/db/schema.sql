-- Multi-Project Command Center Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Projects (Business Units)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tech_stack JSONB DEFAULT '{}',
  repo_path VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active',
  monthly_budget DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agent Sessions (tracks every agent invocation)
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  agent_type VARCHAR(100),
  task_id VARCHAR(255),
  status VARCHAR(50),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  -- Cost tracking
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  model_used VARCHAR(100),

  -- Prompts
  user_prompt TEXT,
  enriched_prompt TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Clarification Sessions (prompt enrichment flow)
CREATE TABLE IF NOT EXISTS clarification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_prompt TEXT NOT NULL,
  ambiguities JSONB DEFAULT '[]', -- Detected ambiguities
  questions JSONB DEFAULT '[]', -- Generated questions
  answers JSONB DEFAULT '{}', -- User answers
  enriched_prompt TEXT,
  status VARCHAR(50) DEFAULT 'pending_questions', -- pending_questions, answered, enriched
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Learned Patterns (cross-project intelligence)
CREATE TABLE IF NOT EXISTS patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type VARCHAR(100),
  name VARCHAR(255),
  description TEXT,
  pattern_data JSONB DEFAULT '{}',

  source_projects UUID[] DEFAULT '{}',
  applicable_to JSONB DEFAULT '{}',

  confidence DECIMAL(3,2) DEFAULT 0.50,
  auto_apply BOOLEAN DEFAULT false,
  times_applied INTEGER DEFAULT 0,
  times_rejected INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Preferences (learned behaviors)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preference_type VARCHAR(100),
  key VARCHAR(255),
  value JSONB DEFAULT '{}',
  confidence DECIMAL(3,2) DEFAULT 0.50,
  learned_from JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(preference_type, key)
);

-- Cost Budgets (monthly limits)
CREATE TABLE IF NOT EXISTS cost_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  month VARCHAR(7), -- '2026-03'
  limit_usd DECIMAL(10,2),
  spent_usd DECIMAL(10,4) DEFAULT 0,
  alert_threshold DECIMAL(3,2) DEFAULT 0.8,
  alerted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, month)
);

-- Stakeholders (for future phase)
CREATE TABLE IF NOT EXISTS stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  email VARCHAR(255),
  communication_preferences JSONB DEFAULT '{}',
  approval_required_for JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_sessions_project_id ON agent_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_created_at ON agent_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_clarification_sessions_project_id ON clarification_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_clarification_sessions_status ON clarification_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cost_budgets_project_month ON cost_budgets(project_id, month);
CREATE INDEX IF NOT EXISTS idx_patterns_confidence ON patterns(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_auto_apply ON patterns(auto_apply) WHERE auto_apply = true;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patterns_updated_at BEFORE UPDATE ON patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PHASE 1: Intelligent Work System
-- ============================================================================

-- Goals: High-level user objectives
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  priority VARCHAR(20) DEFAULT 'medium',
  target_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks: Work units (AI-managed)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  complexity VARCHAR(20),
  estimated_cost_usd DECIMAL(10,4),

  -- Assignment & Checkout
  assigned_agent_id UUID,
  checkout_token UUID,
  checkout_expires_at TIMESTAMP,

  -- Execution
  run_id VARCHAR(100),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  actual_cost_usd DECIMAL(10,4),

  -- Hierarchy
  depth INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Task audit log (immutable)
CREATE TABLE IF NOT EXISTS task_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  actor_type VARCHAR(20) NOT NULL,
  actor_id VARCHAR(100),
  previous_state JSONB,
  new_state JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Phase 1
CREATE INDEX IF NOT EXISTS idx_goals_project_id ON goals(project_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_agent ON tasks(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_checkout_token ON tasks(checkout_token) WHERE checkout_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_audit_log_task_id ON task_audit_log(task_id);
CREATE INDEX IF NOT EXISTS idx_task_audit_log_created_at ON task_audit_log(created_at DESC);

-- Triggers for Phase 1
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PHASE 2: Dynamic Agent Registry
-- ============================================================================

-- Agents: Dynamic registry
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Role & capabilities
  role VARCHAR(100) NOT NULL,
  capabilities JSONB DEFAULT '[]',
  specializations JSONB DEFAULT '[]',

  -- Configuration
  system_prompt_path VARCHAR(500),
  adapter_type VARCHAR(50) DEFAULT 'claude',
  adapter_config JSONB DEFAULT '{}',

  -- Hierarchy
  reports_to UUID REFERENCES agents(id) ON DELETE SET NULL,

  -- State
  status VARCHAR(50) DEFAULT 'active',

  -- Heartbeat
  heartbeat_mode VARCHAR(20) DEFAULT 'on_demand',
  heartbeat_interval_seconds INTEGER DEFAULT 300,
  last_heartbeat TIMESTAMP,

  -- Budget
  monthly_budget_usd DECIMAL(10,2),
  current_month_spend_usd DECIMAL(10,4) DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agent execution sessions (continuity)
CREATE TABLE IF NOT EXISTS agent_execution_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active',
  checkpoint_state JSONB DEFAULT '{}',
  conversation_history JSONB DEFAULT '[]',
  total_tokens INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key to tasks for assigned_agent_id
ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_assigned_agent
  FOREIGN KEY (assigned_agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- Indexes for Phase 2
CREATE INDEX IF NOT EXISTS idx_agents_slug ON agents(slug);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_role ON agents(role);
CREATE INDEX IF NOT EXISTS idx_agents_reports_to ON agents(reports_to);
CREATE INDEX IF NOT EXISTS idx_agent_execution_sessions_agent_id ON agent_execution_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_sessions_task_id ON agent_execution_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_sessions_status ON agent_execution_sessions(status);

-- Triggers for Phase 2
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_execution_sessions_updated_at BEFORE UPDATE ON agent_execution_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PHASE 3: Trust-Based Governance
-- ============================================================================

-- Approval policies
CREATE TABLE IF NOT EXISTS approval_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL,
  trigger_config JSONB NOT NULL,
  requires_approval BOOLEAN DEFAULT true,
  auto_approve_confidence DECIMAL(3,2) DEFAULT 0,
  times_approved INTEGER DEFAULT 0,
  times_rejected INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Approval requests
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES approval_policies(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  operation_type VARCHAR(100) NOT NULL,
  operation_details JSONB NOT NULL,
  risk_assessment JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT NOW(),
  decided_at TIMESTAMP,
  decided_by VARCHAR(100),
  decision_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Default approval policies
INSERT INTO approval_policies (name, description, trigger_type, trigger_config) VALUES
  ('High Cost Operations', 'Operations estimated to cost more than $25', 'cost_threshold', '{"threshold_usd": 25}'),
  ('Production Deployments', 'Any deployment to production environment', 'operation_type', '{"operations": ["deploy_production", "production_deploy"]}'),
  ('Code Deletion', 'Deletion of source code files', 'operation_type', '{"operations": ["delete_files", "remove_code"]}'),
  ('Database Migrations', 'Schema changes to databases', 'operation_type', '{"operations": ["migrate_database", "alter_schema"]}')
ON CONFLICT DO NOTHING;

-- Indexes for Phase 3
CREATE INDEX IF NOT EXISTS idx_approval_policies_trigger_type ON approval_policies(trigger_type);
CREATE INDEX IF NOT EXISTS idx_approval_policies_is_active ON approval_policies(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_task_id ON approval_requests(task_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_agent_id ON approval_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_at ON approval_requests(requested_at DESC);

-- Triggers for Phase 3
CREATE TRIGGER update_approval_policies_updated_at BEFORE UPDATE ON approval_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PHASE 4: Organization & Delegation
-- ============================================================================

-- Teams (optional grouping)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  lead_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  budget_usd DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Team membership
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  role VARCHAR(100) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, agent_id)
);

-- Delegation tracking
CREATE TABLE IF NOT EXISTS delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  from_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  to_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  depth INTEGER DEFAULT 1,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'active',
  delegated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT max_delegation_depth CHECK (depth <= 3)
);

-- Indexes for Phase 4
CREATE INDEX IF NOT EXISTS idx_teams_lead_agent ON teams(lead_agent_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_agent_id ON team_members(agent_id);
CREATE INDEX IF NOT EXISTS idx_delegations_task_id ON delegations(task_id);
CREATE INDEX IF NOT EXISTS idx_delegations_from_agent ON delegations(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_delegations_to_agent ON delegations(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_delegations_status ON delegations(status);

-- Triggers for Phase 4
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED: Default C-Suite Agents
-- ============================================================================

INSERT INTO agents (slug, name, description, role, capabilities, specializations, system_prompt_path, adapter_type) VALUES
  (
    'ceo',
    'CEO Agent',
    'Chief Executive Officer - handles business strategy, prioritization, and product direction',
    'executive',
    '["planning", "delegation", "strategy", "prioritization", "product_direction"]',
    '["business_strategy", "resource_allocation", "cross_team_coordination"]',
    'c-suite/system-prompts/CEO.system.md',
    'claude'
  ),
  (
    'cto',
    'CTO Agent',
    'Chief Technology Officer - handles code implementation, architecture, and technical decisions',
    'executive',
    '["code_generation", "architecture", "technical_review", "deployment", "debugging"]',
    '["software_engineering", "system_design", "technical_leadership"]',
    'c-suite/system-prompts/CTO.system.md',
    'claude'
  ),
  (
    'cmo',
    'CMO Agent',
    'Chief Marketing Officer - handles marketing, positioning, and growth experiments',
    'executive',
    '["marketing", "growth", "positioning", "content_creation", "analytics"]',
    '["growth_hacking", "user_acquisition", "brand_strategy"]',
    'c-suite/system-prompts/CMO.system.md',
    'claude'
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PHASE 5: AI-First Chat Interface
-- ============================================================================

-- Conversations: Persistent chat sessions
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),                     -- For future multi-user support
  title VARCHAR(500),                       -- Auto-generated or user-defined
  context JSONB DEFAULT '{}',               -- Conversation context (entities, preferences)
  is_active BOOLEAN DEFAULT true,           -- Whether conversation is active
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat Messages: Individual messages in conversations
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,                -- 'user', 'assistant', 'system'
  content TEXT,                             -- Text content (can be null if only widgets)
  widgets JSONB DEFAULT '[]',               -- Embedded A2UI widgets
  actions JSONB DEFAULT '[]',               -- Actions taken in this message
  metadata JSONB DEFAULT '{}',              -- Additional metadata (intent, entities, etc.)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Phase 5
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_is_active ON conversations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);

-- Trigger for Phase 5
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PHASE 6: Marketing Portal
-- ============================================================================

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50) DEFAULT 'content', -- launch, content, paid, seo, email
  status VARCHAR(50) DEFAULT 'draft',          -- draft, active, paused, completed
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  goals JSONB DEFAULT '{}',                    -- target metrics, KPIs
  budget_usd DECIMAL(10,2),
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Marketing Assets (content and creative)
CREATE TABLE IF NOT EXISTS marketing_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL,             -- copy, email, social_post, ad_creative, video, landing_page, blog, product_context
  title VARCHAR(255) NOT NULL,
  content JSONB DEFAULT '{}',                  -- structured content (headline, body, CTA, variants)
  status VARCHAR(50) DEFAULT 'draft',          -- draft, review, approved, published
  platform VARCHAR(50),                        -- instagram, tiktok, linkedin, x, youtube, meta_ads, google_ads, email
  metadata JSONB DEFAULT '{}',                 -- dimensions, duration, format, skill_used
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Marketing Videos (Remotion video projects)
CREATE TABLE IF NOT EXISTS marketing_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES marketing_assets(id) ON DELETE CASCADE,
  template_id VARCHAR(100) NOT NULL,           -- Remotion composition ID
  input_props JSONB DEFAULT '{}',              -- Remotion defaultProps (copy, images, colors, timing)
  render_status VARCHAR(50) DEFAULT 'draft',   -- draft, previewing, rendering, completed, failed
  render_config JSONB DEFAULT '{}',            -- fps, width, height, codec, output_format
  output_url TEXT,                             -- rendered video URL or local path
  render_log JSONB,                            -- Lambda render metadata
  duration_seconds DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Marketing Analytics (campaign performance)
CREATE TABLE IF NOT EXISTS marketing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,           -- impressions, clicks, conversions, ctr, cpc, revenue
  metric_value DECIMAL(15,4) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(50) DEFAULT 'manual',         -- manual, agent
  metadata JSONB DEFAULT '{}'
);

-- Indexes for Phase 6
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_project_id ON marketing_campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_campaign_id ON marketing_assets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_project_id ON marketing_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_asset_type ON marketing_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_status ON marketing_assets(status);
CREATE INDEX IF NOT EXISTS idx_marketing_videos_asset_id ON marketing_videos(asset_id);
CREATE INDEX IF NOT EXISTS idx_marketing_videos_render_status ON marketing_videos(render_status);
CREATE INDEX IF NOT EXISTS idx_marketing_analytics_campaign_id ON marketing_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_analytics_recorded_at ON marketing_analytics(recorded_at DESC);

-- Triggers for Phase 6
CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_assets_updated_at BEFORE UPDATE ON marketing_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_videos_updated_at BEFORE UPDATE ON marketing_videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
