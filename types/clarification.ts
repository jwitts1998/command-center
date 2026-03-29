export interface ClarificationSession {
  id: string;
  project_id: string;
  user_prompt: string;
  ambiguities: Ambiguity[];
  questions: ClarificationQuestion[];
  answers: Record<string, string>;
  enriched_prompt: string | null;
  status: 'pending_questions' | 'answered' | 'enriched';
  created_at: Date;
  completed_at: Date | null;
}

export interface Ambiguity {
  type: 'scope' | 'technical' | 'preference' | 'context' | 'implementation';
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  header: string;
  options: QuestionOption[];
  recommended?: string;
  reasoning?: string;
}

export interface QuestionOption {
  value: string;
  label: string;
  description: string;
  isRecommended?: boolean;
}

export interface CreateClarificationInput {
  project_id: string;
  user_prompt: string;
}

export interface AnswerClarificationInput {
  session_id: string;
  answers: Record<string, string>;
}

export interface SuggestedPattern {
  patternId: string;
  patternName: string;
  patternType: string;
  relevance: number;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface EnrichmentResult {
  enrichedPrompt: string;
  contextApplied: string[];
  patternsApplied: string[];
  estimatedCost?: { min_usd: number; max_usd: number };
  suggestedAgents?: string[];
  suggestedPatterns?: SuggestedPattern[];
  needsClarification: boolean;
}
