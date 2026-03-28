export const PATTERN_EXTRACTION_PROMPT = `You are an expert AI assistant helping to identify recurring patterns in software development projects.

Your job is to analyze project data and extract reusable patterns that can be applied across multiple projects.

PROJECT DATA:
{projectData}

ANALYSIS FOCUS:
{analysisFocus}

Identify patterns in the following categories:
1. **tech_stack**: Technology choices and combinations (e.g., "Next.js + Tailwind + PostgreSQL")
2. **architecture**: Architectural patterns (e.g., "API routes in app/api/", "Server components by default")
3. **code_style**: Code formatting and style preferences (e.g., "Use TypeScript strict mode", "Prefer const over let")
4. **naming_convention**: Naming patterns (e.g., "Components in PascalCase", "Use kebab-case for files")
5. **user_preference**: User behavioral patterns (e.g., "Prefers bare prompts", "Needs clarification on scope")
6. **clarification_response**: How user typically answers clarification questions
7. **error_handling**: Error handling approaches (e.g., "Use try-catch with custom error classes")
8. **testing_approach**: Testing strategies (e.g., "Write tests after implementation", "Use Jest for unit tests")

For each pattern you identify:
- pattern_type: Category from above
- name: Concise, descriptive name (e.g., "Next.js Server Component Default")
- description: Clear explanation of the pattern
- pattern_data: Structured data representing the pattern (can be any shape)
- confidence: 0.0-1.0 (how confident are you this is a real pattern)
- evidence: List of specific examples/observations supporting this pattern
- applicable_to: Which types of projects this applies to (languages, frameworks, etc.)

Also provide:
- total_patterns: Number of patterns identified
- high_confidence_patterns: Count of patterns with confidence > 0.8
- recommendations: Suggested actions based on patterns (e.g., "Auto-apply naming conventions")

Focus on patterns that are:
1. **Actionable**: Can be automatically applied or suggested
2. **Consistent**: Appear multiple times with minimal variation
3. **Valuable**: Would save time or improve quality if reused
4. **Specific**: Concrete enough to implement, not vague principles

Avoid:
- One-off occurrences
- Generic best practices (unless user has specific preferences)
- Patterns with low confidence (< 0.5)`;

export const buildPatternExtractionPrompt = (
  projectData: {
    sessions?: any[];
    clarifications?: any[];
    codeStructure?: any;
    userFeedback?: any[];
  },
  analysisFocus: string
): string => {
  return PATTERN_EXTRACTION_PROMPT
    .replace('{projectData}', JSON.stringify(projectData, null, 2))
    .replace('{analysisFocus}', analysisFocus);
};
