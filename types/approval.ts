// Approval types for Trust-Based Governance

export type ApprovalTriggerType = 'cost_threshold' | 'operation_type' | 'agent_type' | 'pattern_match' | 'custom';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'auto_approved';

export interface ApprovalPolicy {
  id: string;
  name: string;
  description: string | null;
  trigger_type: ApprovalTriggerType;
  trigger_config: ApprovalTriggerConfig;
  requires_approval: boolean;
  auto_approve_confidence: number; // 0-1, above this confidence auto-approve
  times_approved: number;
  times_rejected: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type ApprovalTriggerConfig =
  | CostThresholdConfig
  | OperationTypeConfig
  | AgentTypeConfig
  | PatternMatchConfig
  | CustomConfig;

export interface CostThresholdConfig {
  threshold_usd: number;
}

export interface OperationTypeConfig {
  operations: string[];
}

export interface AgentTypeConfig {
  agent_roles: string[];
  agent_slugs?: string[];
}

export interface PatternMatchConfig {
  patterns: string[];
  match_type: 'any' | 'all';
}

export interface CustomConfig {
  evaluator: string; // function name or expression
  params: Record<string, unknown>;
}

export interface CreateApprovalPolicyInput {
  name: string;
  description?: string;
  trigger_type: ApprovalTriggerType;
  trigger_config: ApprovalTriggerConfig;
  requires_approval?: boolean;
  auto_approve_confidence?: number;
}

export interface UpdateApprovalPolicyInput {
  name?: string;
  description?: string;
  trigger_config?: ApprovalTriggerConfig;
  requires_approval?: boolean;
  auto_approve_confidence?: number;
  is_active?: boolean;
}

export interface ApprovalRequest {
  id: string;
  policy_id: string | null;
  task_id: string | null;
  agent_id: string | null;
  operation_type: string;
  operation_details: OperationDetails;
  risk_assessment: RiskAssessment | null;
  status: ApprovalStatus;
  requested_at: Date;
  decided_at: Date | null;
  decided_by: string | null;
  decision_reason: string | null;
  created_at: Date;
}

export interface OperationDetails {
  description: string;
  affected_resources?: string[];
  estimated_cost_usd?: number;
  reversible?: boolean;
  metadata?: Record<string, unknown>;
}

export interface RiskAssessment {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: string[];
  mitigation_suggestions?: string[];
  confidence: number;
}

export interface CreateApprovalRequestInput {
  policy_id?: string;
  task_id?: string;
  agent_id?: string;
  operation_type: string;
  operation_details: OperationDetails;
  risk_assessment?: RiskAssessment;
}

export interface ApprovalDecision {
  request_id: string;
  decision: 'approved' | 'rejected';
  decided_by: string;
  reason?: string;
}

export interface ApprovalCheckResult {
  requires_approval: boolean;
  matching_policies: ApprovalPolicy[];
  auto_approved: boolean;
  approval_request_id?: string;
  reason: string;
}

export interface ApprovalStats {
  total_requests: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  auto_approved_count: number;
  average_decision_time_ms: number;
  approval_rate: number;
}
