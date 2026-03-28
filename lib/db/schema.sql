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
