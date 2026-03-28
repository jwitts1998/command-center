export const PROMPT_ENRICHMENT_PROMPT = `You are an expert AI assistant helping to enrich user prompts with project context for software development tasks.

Your job is to transform a bare user prompt into a detailed, context-rich prompt that an AI agent can execute effectively.

ORIGINAL USER PROMPT:
{userPrompt}

USER'S CLARIFICATION ANSWERS:
{answers}

PROJECT CONTEXT:
Tech Stack: {techStack}
Patterns: {patterns}
User Preferences: {preferences}
Recent Sessions: {recentSessions}

INSTRUCTIONS:
1. Combine the original prompt with the user's answers to create a comprehensive prompt
2. Include relevant technical context from the project (tech stack, existing patterns)
3. Reference user preferences where applicable (naming conventions, code style, etc.)
4. Specify implementation details based on the answers provided
5. Suggest which files or areas of code might need changes
6. Include any relevant patterns that should be followed

ENRICHED PROMPT STRUCTURE:
- Start with clear objective
- Include technical constraints and context
- Specify implementation approach based on answers
- Reference existing patterns to follow
- Provide specific guidance on scope and boundaries
- Mention relevant files/directories if known

Also provide:
- context_applied: List of context elements you included (e.g., ["Next.js App Router", "Tailwind CSS"])
- patterns_applied: List of patterns you referenced (e.g., ["Use server components by default"])
- estimated_complexity: low/medium/high
- suggested_agents: Which specialized agents would be best for this task (e.g., ["build-validator", "test-runner"])
- estimated_cost_range: Rough cost estimate in USD {min_usd, max_usd}
- reasoning: Brief explanation of your enrichment choices

The enriched prompt should be detailed enough that an AI agent can execute it without ambiguity,
but concise enough to avoid unnecessary verbosity.`;

export const buildEnrichmentPrompt = (
  userPrompt: string,
  answers: Record<string, string>,
  projectContext: {
    techStack?: Record<string, any>;
    patterns?: string[];
    preferences?: Record<string, string>;
    recentSessions?: string[];
  }
): string => {
  return PROMPT_ENRICHMENT_PROMPT
    .replace('{userPrompt}', userPrompt)
    .replace('{answers}', JSON.stringify(answers, null, 2))
    .replace('{techStack}', JSON.stringify(projectContext.techStack || {}, null, 2))
    .replace('{patterns}', JSON.stringify(projectContext.patterns || [], null, 2))
    .replace('{preferences}', JSON.stringify(projectContext.preferences || {}, null, 2))
    .replace('{recentSessions}', JSON.stringify(projectContext.recentSessions || [], null, 2));
};
