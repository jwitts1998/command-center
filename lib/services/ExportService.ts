import { query } from '@/lib/db/client';

export type ExportFormat = 'csv' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  start_date?: string;
  end_date?: string;
  project_id?: string;
  status?: string;
}

export interface ExportResult {
  data: string;
  filename: string;
  contentType: string;
}

export class ExportService {
  /**
   * Exports agent sessions
   */
  async exportSessions(options: ExportOptions): Promise<ExportResult> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options.start_date) {
      conditions.push(`started_at >= $${paramIndex}`);
      params.push(options.start_date);
      paramIndex++;
    }

    if (options.end_date) {
      conditions.push(`started_at <= $${paramIndex}`);
      params.push(options.end_date);
      paramIndex++;
    }

    if (options.project_id) {
      conditions.push(`project_id = $${paramIndex}`);
      params.push(options.project_id);
      paramIndex++;
    }

    if (options.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(options.status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sessions = await query<{
      id: string;
      project_id: string | null;
      agent_type: string | null;
      task_id: string | null;
      status: string | null;
      started_at: Date;
      completed_at: Date | null;
      tokens_input: number;
      tokens_output: number;
      cost_usd: number;
      model_used: string | null;
    }>(
      `SELECT id, project_id, agent_type, task_id, status, started_at, completed_at,
              tokens_input, tokens_output, cost_usd, model_used
       FROM agent_sessions
       ${whereClause}
       ORDER BY started_at DESC`,
      params
    );

    const filename = this.generateFilename('sessions', options.format);

    if (options.format === 'json') {
      return {
        data: JSON.stringify(sessions, null, 2),
        filename,
        contentType: 'application/json',
      };
    }

    // CSV format
    const headers = [
      'ID',
      'Project ID',
      'Agent Type',
      'Task ID',
      'Status',
      'Started At',
      'Completed At',
      'Tokens Input',
      'Tokens Output',
      'Cost USD',
      'Model Used',
    ];

    const rows = sessions.map((s) => [
      s.id,
      s.project_id || '',
      s.agent_type || '',
      s.task_id || '',
      s.status || '',
      this.formatDate(s.started_at),
      s.completed_at ? this.formatDate(s.completed_at) : '',
      s.tokens_input.toString(),
      s.tokens_output.toString(),
      s.cost_usd.toFixed(4),
      s.model_used || '',
    ]);

    return {
      data: this.toCSV(headers, rows),
      filename,
      contentType: 'text/csv',
    };
  }

  /**
   * Exports cost data
   */
  async exportCosts(options: ExportOptions): Promise<ExportResult> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options.start_date) {
      conditions.push(`started_at >= $${paramIndex}`);
      params.push(options.start_date);
      paramIndex++;
    }

    if (options.end_date) {
      conditions.push(`started_at <= $${paramIndex}`);
      params.push(options.end_date);
      paramIndex++;
    }

    if (options.project_id) {
      conditions.push(`project_id = $${paramIndex}`);
      params.push(options.project_id);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Aggregate costs by date and agent type
    const costs = await query<{
      date: string;
      agent_type: string | null;
      model_used: string | null;
      total_sessions: string;
      tokens_input: string;
      tokens_output: string;
      total_cost: string;
    }>(
      `SELECT
         DATE(started_at) as date,
         agent_type,
         model_used,
         COUNT(*) as total_sessions,
         SUM(tokens_input) as tokens_input,
         SUM(tokens_output) as tokens_output,
         SUM(cost_usd) as total_cost
       FROM agent_sessions
       ${whereClause}
       GROUP BY DATE(started_at), agent_type, model_used
       ORDER BY date DESC, agent_type`,
      params
    );

    const filename = this.generateFilename('costs', options.format);

    if (options.format === 'json') {
      return {
        data: JSON.stringify(costs, null, 2),
        filename,
        contentType: 'application/json',
      };
    }

    const headers = [
      'Date',
      'Agent Type',
      'Model',
      'Sessions',
      'Tokens Input',
      'Tokens Output',
      'Total Cost USD',
    ];

    const rows = costs.map((c) => [
      c.date,
      c.agent_type || 'Unknown',
      c.model_used || 'Unknown',
      c.total_sessions,
      c.tokens_input,
      c.tokens_output,
      parseFloat(c.total_cost).toFixed(4),
    ]);

    return {
      data: this.toCSV(headers, rows),
      filename,
      contentType: 'text/csv',
    };
  }

  /**
   * Exports tasks
   */
  async exportTasks(options: ExportOptions): Promise<ExportResult> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options.start_date) {
      conditions.push(`t.created_at >= $${paramIndex}`);
      params.push(options.start_date);
      paramIndex++;
    }

    if (options.end_date) {
      conditions.push(`t.created_at <= $${paramIndex}`);
      params.push(options.end_date);
      paramIndex++;
    }

    if (options.status) {
      conditions.push(`t.status = $${paramIndex}`);
      params.push(options.status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const tasks = await query<{
      id: string;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      complexity: string | null;
      estimated_cost_usd: number | null;
      actual_cost_usd: number | null;
      agent_name: string | null;
      goal_title: string | null;
      created_at: Date;
      started_at: Date | null;
      completed_at: Date | null;
    }>(
      `SELECT t.id, t.title, t.description, t.status, t.priority, t.complexity,
              t.estimated_cost_usd, t.actual_cost_usd,
              a.name as agent_name, g.title as goal_title,
              t.created_at, t.started_at, t.completed_at
       FROM tasks t
       LEFT JOIN agents a ON t.assigned_agent_id = a.id
       LEFT JOIN goals g ON t.goal_id = g.id
       ${whereClause}
       ORDER BY t.created_at DESC`,
      params
    );

    const filename = this.generateFilename('tasks', options.format);

    if (options.format === 'json') {
      return {
        data: JSON.stringify(tasks, null, 2),
        filename,
        contentType: 'application/json',
      };
    }

    const headers = [
      'ID',
      'Title',
      'Description',
      'Status',
      'Priority',
      'Complexity',
      'Estimated Cost',
      'Actual Cost',
      'Assigned Agent',
      'Goal',
      'Created At',
      'Started At',
      'Completed At',
    ];

    const rows = tasks.map((t) => [
      t.id,
      this.escapeCSV(t.title),
      this.escapeCSV(t.description || ''),
      t.status,
      t.priority,
      t.complexity || '',
      t.estimated_cost_usd?.toFixed(4) || '',
      t.actual_cost_usd?.toFixed(4) || '',
      t.agent_name || '',
      this.escapeCSV(t.goal_title || ''),
      this.formatDate(t.created_at),
      t.started_at ? this.formatDate(t.started_at) : '',
      t.completed_at ? this.formatDate(t.completed_at) : '',
    ]);

    return {
      data: this.toCSV(headers, rows),
      filename,
      contentType: 'text/csv',
    };
  }

  /**
   * Exports agents
   */
  async exportAgents(options: ExportOptions): Promise<ExportResult> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(options.status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const agents = await query<{
      id: string;
      slug: string;
      name: string;
      description: string | null;
      role: string;
      capabilities: string[];
      specializations: string[];
      status: string;
      adapter_type: string;
      heartbeat_mode: string;
      monthly_budget_usd: number | null;
      current_month_spend_usd: number;
      last_heartbeat: Date | null;
      created_at: Date;
    }>(
      `SELECT id, slug, name, description, role, capabilities, specializations,
              status, adapter_type, heartbeat_mode, monthly_budget_usd,
              current_month_spend_usd, last_heartbeat, created_at
       FROM agents
       ${whereClause}
       ORDER BY name`,
      params
    );

    const filename = this.generateFilename('agents', options.format);

    if (options.format === 'json') {
      return {
        data: JSON.stringify(agents, null, 2),
        filename,
        contentType: 'application/json',
      };
    }

    const headers = [
      'ID',
      'Slug',
      'Name',
      'Description',
      'Role',
      'Capabilities',
      'Specializations',
      'Status',
      'Adapter Type',
      'Heartbeat Mode',
      'Monthly Budget',
      'Current Spend',
      'Last Heartbeat',
      'Created At',
    ];

    const rows = agents.map((a) => [
      a.id,
      a.slug,
      this.escapeCSV(a.name),
      this.escapeCSV(a.description || ''),
      a.role,
      Array.isArray(a.capabilities) ? a.capabilities.join('; ') : '',
      Array.isArray(a.specializations) ? a.specializations.join('; ') : '',
      a.status,
      a.adapter_type,
      a.heartbeat_mode,
      a.monthly_budget_usd?.toFixed(2) || '',
      a.current_month_spend_usd.toFixed(4),
      a.last_heartbeat ? this.formatDate(a.last_heartbeat) : '',
      this.formatDate(a.created_at),
    ]);

    return {
      data: this.toCSV(headers, rows),
      filename,
      contentType: 'text/csv',
    };
  }

  private toCSV(headers: string[], rows: string[][]): string {
    const headerLine = headers.join(',');
    const dataLines = rows.map((row) => row.join(','));
    return [headerLine, ...dataLines].join('\n');
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private formatDate(date: Date): string {
    return new Date(date).toISOString();
  }

  private generateFilename(type: string, format: ExportFormat): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${type}-${timestamp}.${format}`;
  }
}

export const exportService = new ExportService();
