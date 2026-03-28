export const AMBIGUITY_DETECTION_PROMPT = `You are an expert AI assistant helping to analyze user prompts for software development tasks.

Your job is to identify ambiguities and missing context in user prompts that could lead to incorrect or suboptimal implementations.

Analyze the following user prompt for a software project:

USER PROMPT: {userPrompt}

PROJECT CONTEXT:
{projectContext}

Identify any ambiguities in the following categories:
1. **scope**: Unclear boundaries or requirements (e.g., "add dark mode" - for entire app or specific pages?)
2. **technical**: Missing technical details or implementation choices (e.g., which library, API, or approach?)
3. **preference**: Unspecified user preferences or style choices (e.g., naming conventions, code organization)
4. **context**: Missing project-specific context (e.g., existing patterns, architecture constraints)
5. **implementation**: Unclear implementation details (e.g., where to add code, what files to modify)

For each ambiguity:
- Type: Choose from [scope, technical, preference, context, implementation]
- Description: Clear explanation of what's unclear
- Confidence: 0.0-1.0 (how confident are you this is ambiguous)
- Impact: high/medium/low (how much could this affect the implementation)

Also provide:
- overall_clarity_score: 0.0-1.0 (0 = very unclear, 1 = perfectly clear)
- needs_clarification: boolean (should we ask clarification questions?)
- reasoning: Explain your assessment

Be pragmatic: Don't flag minor details that can be reasonably inferred from common practices.
Flag only ambiguities that could lead to significantly different implementations.

IMPORTANT: If the prompt is detailed and clear, return has_ambiguities: false with high clarity_score.
Only request clarification when it's truly needed to avoid poor implementations.`;

export const buildAmbiguityDetectionPrompt = (
  userPrompt: string,
  projectContext: {
    techStack?: Record<string, any>;
    patterns?: string[];
    recentSessions?: string[];
  }
): string => {
  const contextStr = JSON.stringify(projectContext, null, 2);
  return AMBIGUITY_DETECTION_PROMPT
    .replace('{userPrompt}', userPrompt)
    .replace('{projectContext}', contextStr);
};
