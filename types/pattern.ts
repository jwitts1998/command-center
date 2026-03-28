export interface Pattern {
  id: string;
  pattern_type: PatternType;
  name: string;
  description: string;
  pattern_data: Record<string, any>;
  source_projects: string[];
  applicable_to: ApplicabilityRules;
  confidence: number;
  auto_apply: boolean;
  times_applied: number;
  times_rejected: number;
  created_at: Date;
  updated_at: Date;
}

export type PatternType =
  | 'tech_stack'
  | 'architecture'
  | 'code_style'
  | 'naming_convention'
  | 'user_preference'
  | 'clarification_response'
  | 'error_handling'
  | 'testing_approach';

export interface ApplicabilityRules {
  languages?: string[];
  frameworks?: string[];
  project_types?: string[];
  exclude_projects?: string[];
  min_confidence?: number;
}

export interface CreatePatternInput {
  pattern_type: PatternType;
  name: string;
  description: string;
  pattern_data: Record<string, any>;
  source_projects: string[];
  applicable_to?: ApplicabilityRules;
  confidence?: number;
  auto_apply?: boolean;
}

export interface UpdatePatternInput {
  name?: string;
  description?: string;
  pattern_data?: Record<string, any>;
  applicable_to?: ApplicabilityRules;
  confidence?: number;
  auto_apply?: boolean;
}

export interface PatternMatch {
  pattern: Pattern;
  relevance_score: number;
  reasoning: string;
  auto_apply: boolean;
}
