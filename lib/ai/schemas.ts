import { z } from 'zod';

// Schema for ambiguity detection
export const AmbiguitySchema = z.object({
  type: z.enum(['scope', 'technical', 'preference', 'context', 'implementation']),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  impact: z.enum(['high', 'medium', 'low']),
});

export const AmbiguityDetectionResultSchema = z.object({
  has_ambiguities: z.boolean(),
  ambiguities: z.array(AmbiguitySchema),
  overall_clarity_score: z.number().min(0).max(1),
  needs_clarification: z.boolean(),
  reasoning: z.string(),
});

// Schema for question generation
export const QuestionOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string(),
  isRecommended: z.boolean().optional(),
});

export const ClarificationQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  header: z.string(),
  options: z.array(QuestionOptionSchema),
  recommended: z.string().optional(),
  reasoning: z.string().optional(),
});

export const QuestionGenerationResultSchema = z.object({
  questions: z.array(ClarificationQuestionSchema),
  total_questions: z.number(),
  estimated_resolution_time: z.string(),
});

// Schema for prompt enrichment
export const EnrichmentContextSchema = z.object({
  tech_stack: z.record(z.string(), z.any()).optional(),
  patterns: z.array(z.string()).optional(),
  user_preferences: z.record(z.string(), z.string()).optional(),
  project_conventions: z.array(z.string()).optional(),
});

export const EnrichedPromptResultSchema = z.object({
  enriched_prompt: z.string(),
  context_applied: z.array(z.string()),
  patterns_applied: z.array(z.string()),
  estimated_complexity: z.enum(['low', 'medium', 'high']),
  suggested_agents: z.array(z.string()).optional(),
  estimated_cost_range: z.object({
    min_usd: z.number(),
    max_usd: z.number(),
  }).optional(),
  reasoning: z.string(),
});

// Schema for pattern detection
export const DetectedPatternSchema = z.object({
  pattern_type: z.enum([
    'tech_stack',
    'architecture',
    'code_style',
    'naming_convention',
    'user_preference',
    'clarification_response',
    'error_handling',
    'testing_approach',
  ]),
  name: z.string(),
  description: z.string(),
  pattern_data: z.record(z.string(), z.any()),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()),
  applicable_to: z.object({
    languages: z.array(z.string()).optional(),
    frameworks: z.array(z.string()).optional(),
    project_types: z.array(z.string()).optional(),
  }).optional(),
});

export const PatternDetectionResultSchema = z.object({
  patterns: z.array(DetectedPatternSchema),
  total_patterns: z.number(),
  high_confidence_patterns: z.number(),
  recommendations: z.array(z.string()),
});

// Export types from schemas
export type AmbiguityDetectionResult = z.infer<typeof AmbiguityDetectionResultSchema>;
export type QuestionGenerationResult = z.infer<typeof QuestionGenerationResultSchema>;
export type EnrichedPromptResult = z.infer<typeof EnrichedPromptResultSchema>;
export type PatternDetectionResult = z.infer<typeof PatternDetectionResultSchema>;
export type DetectedPattern = z.infer<typeof DetectedPatternSchema>;
export type ClarificationQuestionType = z.infer<typeof ClarificationQuestionSchema>;
export type QuestionOption = z.infer<typeof QuestionOptionSchema>;
