import { query, queryOne } from '@/lib/db/client';
import type { Project, Pattern, UserPreference, AgentSession } from '@/lib/db/client';

export interface ProjectContext {
  project: Project;
  techStack: Record<string, any>;
  patterns: Array<{
    id: string;
    name: string;
    description: string;
    pattern_type: string;
    confidence: number;
  }>;
  userPreferences: Record<string, any>;
  recentSessions: Array<{
    user_prompt: string;
    enriched_prompt: string;
    created_at: Date;
  }>;
}

export class ContextBuilder {
  /**
   * Builds comprehensive context for a project
   */
  async buildContext(projectId: string): Promise<ProjectContext> {
    const [project, patterns, preferences, sessions] = await Promise.all([
      this.getProject(projectId),
      this.getApplicablePatterns(projectId),
      this.getUserPreferences(),
      this.getRecentSessions(projectId),
    ]);

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    return {
      project,
      techStack: project.tech_stack || {},
      patterns: patterns.map(p => ({
        id: p.id,
        name: p.name || 'Unnamed pattern',
        description: p.description || '',
        pattern_type: p.pattern_type || 'unknown',
        confidence: p.confidence,
      })),
      userPreferences: this.formatPreferences(preferences),
      recentSessions: sessions.map(s => ({
        user_prompt: s.user_prompt || '',
        enriched_prompt: s.enriched_prompt || '',
        created_at: s.started_at,
      })),
    };
  }

  /**
   * Gets project details
   */
  private async getProject(projectId: string): Promise<Project | null> {
    return queryOne<Project>(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );
  }

  /**
   * Gets patterns applicable to this project
   */
  private async getApplicablePatterns(projectId: string): Promise<Pattern[]> {
    // Get project to check tech stack
    const project = await this.getProject(projectId);
    if (!project) return [];

    // Get all patterns with confidence > 0.5
    const allPatterns = await query<Pattern>(
      `SELECT * FROM patterns
       WHERE confidence > 0.5
       ORDER BY confidence DESC, times_applied DESC
       LIMIT 20`
    );

    // Filter patterns that apply to this project
    return allPatterns.filter(pattern => {
      // If pattern has no applicability rules, it applies to all
      if (!pattern.applicable_to || Object.keys(pattern.applicable_to).length === 0) {
        return true;
      }

      const rules = pattern.applicable_to;

      // Check if project is explicitly excluded
      if (rules.exclude_projects?.includes(projectId)) {
        return false;
      }

      // Check tech stack compatibility
      if (rules.languages && project.tech_stack?.languages) {
        const hasMatchingLanguage = rules.languages.some((lang: string) =>
          project.tech_stack.languages?.includes(lang)
        );
        if (!hasMatchingLanguage) return false;
      }

      if (rules.frameworks && project.tech_stack?.frameworks) {
        const hasMatchingFramework = rules.frameworks.some((fw: string) =>
          project.tech_stack.frameworks?.includes(fw)
        );
        if (!hasMatchingFramework) return false;
      }

      return true;
    });
  }

  /**
   * Gets user preferences
   */
  private async getUserPreferences(): Promise<UserPreference[]> {
    return query<UserPreference>(
      `SELECT * FROM user_preferences
       WHERE confidence > 0.6
       ORDER BY confidence DESC`
    );
  }

  /**
   * Gets recent sessions for learning patterns
   */
  private async getRecentSessions(projectId: string, limit: number = 10): Promise<AgentSession[]> {
    return query<AgentSession>(
      `SELECT user_prompt, enriched_prompt, started_at
       FROM agent_sessions
       WHERE project_id = $1
         AND user_prompt IS NOT NULL
         AND enriched_prompt IS NOT NULL
       ORDER BY started_at DESC
       LIMIT $2`,
      [projectId, limit]
    );
  }

  /**
   * Formats preferences into a simple key-value map
   */
  private formatPreferences(preferences: UserPreference[]): Record<string, any> {
    const formatted: Record<string, any> = {};

    preferences.forEach(pref => {
      const key = pref.key || 'unknown';
      formatted[key] = pref.value;
    });

    return formatted;
  }

  /**
   * Builds a lightweight context for quick checks
   */
  async buildLightweightContext(projectId: string): Promise<{
    techStack: Record<string, any>;
    topPatterns: string[];
  }> {
    const project = await this.getProject(projectId);

    if (!project) {
      return {
        techStack: {},
        topPatterns: [],
      };
    }

    const topPatterns = await query<Pattern>(
      `SELECT name FROM patterns
       WHERE confidence > 0.7
       ORDER BY confidence DESC
       LIMIT 5`
    );

    return {
      techStack: project.tech_stack || {},
      topPatterns: topPatterns.map(p => p.name || '').filter(Boolean),
    };
  }

  /**
   * Gets context summary for display
   */
  getContextSummary(context: ProjectContext): {
    techStackSummary: string;
    patternCount: number;
    topPatterns: string[];
    preferenceCount: number;
    recentSessionCount: number;
  } {
    const techStackItems = Object.values(context.techStack)
      .flat()
      .filter(Boolean) as string[];

    return {
      techStackSummary: techStackItems.slice(0, 5).join(', ') || 'Not specified',
      patternCount: context.patterns.length,
      topPatterns: context.patterns
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3)
        .map(p => p.name),
      preferenceCount: Object.keys(context.userPreferences).length,
      recentSessionCount: context.recentSessions.length,
    };
  }
}

// Export singleton instance
export const contextBuilder = new ContextBuilder();
