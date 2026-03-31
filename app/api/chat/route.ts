import { streamText, tool, stepCountIs, zodSchema } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { marketingContextBuilder } from '@/lib/services/MarketingContextBuilder';
import { videoRenderer } from '@/lib/services/VideoRenderer';
import type { MarketingCampaign, MarketingAsset, MarketingVideo } from '@/lib/db/client';
import {
  createConversation,
  getConversation,
  addMessage,
  getRecentMessages,
  updateContextWithEntities,
} from '@/lib/chat/ConversationStore';
import { buildSystemPrompt } from '@/lib/chat/prompts/system';
import { buildSystemContext, getSystemStats } from '@/lib/chat/ContextManager';
import { classify } from '@/lib/chat/IntentClassifier';
import type { Goal, Task, Agent, ApprovalRequest, Team } from '@/lib/db/client';

// POST /api/chat - Main chat endpoint with streaming
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get or create conversation
    let conversation = conversationId
      ? await getConversation(conversationId)
      : null;

    if (!conversation) {
      conversation = await createConversation({
        title: message.slice(0, 50),
      });
    }

    // Save user message
    await addMessage(conversation.id, {
      role: 'user',
      content: message,
    });

    // Get recent messages for context
    const recentMessages = await getRecentMessages(conversation.id, 10);

    // Build context
    const systemContext = await buildSystemContext(conversation, recentMessages);
    const systemStats = await getSystemStats();

    // Classify intent for hints
    const intent = classify(message);

    // Build full system prompt
    const contextString = `${systemContext}

System Status:
- Pending Approvals: ${systemStats.pendingApprovals}
- Active Tasks: ${systemStats.activeTasks}
- Active Goals: ${systemStats.activeGoals}
- Active Agents: ${systemStats.activeAgents}

User Intent: ${intent.category} / ${intent.action} (confidence: ${intent.confidence})`;

    const systemPrompt = buildSystemPrompt(contextString);

    // Build messages for AI
    const aiMessages = recentMessages.slice(-8).map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content || '',
    }));

    // Add current message
    aiMessages.push({ role: 'user', content: message });

    // Capture conversation ID for closure
    const convId = conversation.id;

    // Create streaming response
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages: aiMessages,
      tools: chatTools,
      stopWhen: stepCountIs(5),
      onFinish: async ({ text, toolCalls }) => {
        // Save assistant message
        const widgets: unknown[] = [];

        // Extract widgets from tool results
        if (toolCalls) {
          for (const call of toolCalls) {
            if (call.toolName === 'render_widget') {
              widgets.push(call);
            }
          }
        }

        await addMessage(convId, {
          role: 'assistant',
          content: text,
          widgets: widgets as any[],
          metadata: {
            intent,
            toolCalls: toolCalls?.map((c) => ({
              name: c.toolName,
            })),
          },
        });

        // Update context with any entity references
        const goalCalls = toolCalls?.filter((c) => c.toolName === 'get_goal');
        const taskCalls = toolCalls?.filter((c) => c.toolName === 'get_task');
        const agentCalls = toolCalls?.filter((c) => c.toolName === 'get_agent');

        const goalIds = goalCalls?.map(() => 'unknown');
        const taskIds = taskCalls?.map(() => 'unknown');
        const agentIds = agentCalls?.map(() => 'unknown');

        if (goalIds?.length || taskIds?.length || agentIds?.length) {
          await updateContextWithEntities(convId, {
            goalIds,
            taskIds,
            agentIds,
          });
        }
      },
    });

    // Return streaming response with conversation ID
    const response = result.toTextStreamResponse();

    // Add conversation ID to response headers
    response.headers.set('X-Conversation-Id', conversation.id);

    return response;
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Chat failed',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Helper function to generate task suggestions from a goal
function generateTaskSuggestions(goal: Goal, maxTasks: number): Array<{
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}> {
  // Simple rule-based decomposition
  // In a production system, this would call an LLM for intelligent decomposition
  const suggestions: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }> = [];

  const goalTitle = goal.title.toLowerCase();
  const goalDesc = (goal.description || '').toLowerCase();

  // Common patterns for goal decomposition
  if (goalTitle.includes('implement') || goalTitle.includes('build') || goalTitle.includes('create')) {
    suggestions.push(
      { title: `Research and plan: ${goal.title}`, description: 'Gather requirements and create implementation plan', priority: 'high' },
      { title: `Design architecture for: ${goal.title}`, description: 'Design the technical architecture and data models', priority: 'high' },
      { title: `Implement core functionality`, description: 'Build the main features and logic', priority: 'high' },
      { title: `Write tests`, description: 'Create unit and integration tests', priority: 'medium' },
      { title: `Documentation and cleanup`, description: 'Document the implementation and clean up code', priority: 'low' },
    );
  } else if (goalTitle.includes('launch') || goalTitle.includes('release')) {
    suggestions.push(
      { title: `Pre-launch checklist`, description: 'Verify all launch requirements are met', priority: 'critical' },
      { title: `Prepare marketing materials`, description: 'Create launch announcements and content', priority: 'high' },
      { title: `Set up monitoring`, description: 'Ensure proper monitoring and alerting is in place', priority: 'high' },
      { title: `Coordinate launch timing`, description: 'Align with all stakeholders on launch schedule', priority: 'medium' },
      { title: `Post-launch review`, description: 'Monitor and gather feedback after launch', priority: 'medium' },
    );
  } else if (goalTitle.includes('improve') || goalTitle.includes('optimize') || goalTitle.includes('enhance')) {
    suggestions.push(
      { title: `Analyze current state`, description: 'Measure and document current performance', priority: 'high' },
      { title: `Identify improvement opportunities`, description: 'List specific areas for improvement', priority: 'high' },
      { title: `Implement improvements`, description: 'Make the identified changes', priority: 'high' },
      { title: `Validate improvements`, description: 'Measure and verify the improvements worked', priority: 'medium' },
    );
  } else {
    // Generic decomposition
    suggestions.push(
      { title: `Define scope for: ${goal.title}`, description: 'Clarify requirements and success criteria', priority: 'high' },
      { title: `Plan execution`, description: 'Create a detailed execution plan', priority: 'high' },
      { title: `Execute main work`, description: 'Complete the primary work items', priority: 'high' },
      { title: `Review and validate`, description: 'Verify completion against success criteria', priority: 'medium' },
    );
  }

  return suggestions.slice(0, maxTasks);
}

// Chat tools for the AI to use
const chatTools = {
  // Query tools
  list_goals: tool({
    description: 'List goals with optional filters',
    inputSchema: zodSchema(z.object({
      status: z.enum(['active', 'completed', 'paused', 'cancelled']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      limit: z.number().default(10),
    })),
    execute: async ({ status, priority, limit }) => {
      let sql = 'SELECT * FROM goals WHERE 1=1';
      const params: unknown[] = [];

      if (status) {
        params.push(status);
        sql += ` AND status = $${params.length}`;
      }
      if (priority) {
        params.push(priority);
        sql += ` AND priority = $${params.length}`;
      }

      sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const goals = await query<Goal>(sql, params);
      return { goals, count: goals.length };
    },
  }),

  get_goal: tool({
    description: 'Get a specific goal by ID',
    inputSchema: zodSchema(z.object({
      id: z.string().describe('The goal UUID'),
    })),
    execute: async ({ id }) => {
      const goal = await queryOne<Goal>(
        'SELECT * FROM goals WHERE id = $1',
        [id]
      );
      if (!goal) {
        return { error: 'Goal not found' };
      }

      // Get task counts
      const taskStats = await queryOne<{
        total: string;
        completed: string;
      }>(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'completed') as completed
         FROM tasks WHERE goal_id = $1`,
        [id]
      );

      return {
        goal,
        taskCount: parseInt(taskStats?.total || '0', 10),
        completedTaskCount: parseInt(taskStats?.completed || '0', 10),
      };
    },
  }),

  list_tasks: tool({
    description: 'List tasks with optional filters',
    inputSchema: zodSchema(z.object({
      status: z.enum(['pending', 'ready', 'in_progress', 'blocked', 'completed', 'failed', 'cancelled']).optional(),
      goalId: z.string().optional(),
      limit: z.number().default(10),
    })),
    execute: async ({ status, goalId, limit }) => {
      let sql = 'SELECT * FROM tasks WHERE 1=1';
      const params: unknown[] = [];

      if (status) {
        params.push(status);
        sql += ` AND status = $${params.length}`;
      }
      if (goalId) {
        params.push(goalId);
        sql += ` AND goal_id = $${params.length}`;
      }

      sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const tasks = await query<Task>(sql, params);
      return { tasks, count: tasks.length };
    },
  }),

  get_task: tool({
    description: 'Get a specific task by ID',
    inputSchema: zodSchema(z.object({
      id: z.string().describe('The task UUID'),
    })),
    execute: async ({ id }) => {
      const task = await queryOne<Task>(
        'SELECT * FROM tasks WHERE id = $1',
        [id]
      );
      if (!task) {
        return { error: 'Task not found' };
      }

      // Get subtask counts
      const subtaskStats = await queryOne<{
        total: string;
        completed: string;
      }>(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'completed') as completed
         FROM tasks WHERE parent_task_id = $1`,
        [id]
      );

      return {
        task,
        subtaskCount: parseInt(subtaskStats?.total || '0', 10),
        completedSubtaskCount: parseInt(subtaskStats?.completed || '0', 10),
      };
    },
  }),

  list_agents: tool({
    description: 'List all registered agents',
    inputSchema: zodSchema(z.object({
      status: z.enum(['active', 'paused', 'inactive', 'error']).optional(),
      role: z.enum(['executive', 'specialist', 'worker', 'coordinator']).optional(),
    })),
    execute: async ({ status, role }) => {
      let sql = 'SELECT * FROM agents WHERE 1=1';
      const params: unknown[] = [];

      if (status) {
        params.push(status);
        sql += ` AND status = $${params.length}`;
      }
      if (role) {
        params.push(role);
        sql += ` AND role = $${params.length}`;
      }

      sql += ' ORDER BY created_at DESC';

      const agents = await query<Agent>(sql, params);
      return { agents, count: agents.length };
    },
  }),

  get_agent: tool({
    description: 'Get a specific agent by ID or slug',
    inputSchema: zodSchema(z.object({
      id: z.string().optional().describe('The agent UUID'),
      slug: z.string().optional().describe('The agent slug (e.g., "cto")'),
    })),
    execute: async ({ id, slug }) => {
      let agent: Agent | null = null;

      if (id) {
        agent = await queryOne<Agent>(
          'SELECT * FROM agents WHERE id = $1',
          [id]
        );
      } else if (slug) {
        agent = await queryOne<Agent>(
          'SELECT * FROM agents WHERE slug = $1',
          [slug]
        );
      }

      if (!agent) {
        return { error: 'Agent not found' };
      }

      return { agent };
    },
  }),

  list_approvals: tool({
    description: 'List approval requests',
    inputSchema: zodSchema(z.object({
      status: z.enum(['pending', 'approved', 'rejected', 'expired', 'auto_approved']).optional(),
      limit: z.number().default(10),
    })),
    execute: async ({ status, limit }) => {
      let sql = 'SELECT * FROM approval_requests WHERE 1=1';
      const params: unknown[] = [];

      if (status) {
        params.push(status);
        sql += ` AND status = $${params.length}`;
      }

      sql += ` ORDER BY requested_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const approvals = await query<ApprovalRequest>(sql, params);
      return { approvals, count: approvals.length };
    },
  }),

  get_approval: tool({
    description: 'Get a specific approval request by ID',
    inputSchema: zodSchema(z.object({
      id: z.string().describe('The approval request UUID'),
    })),
    execute: async ({ id }) => {
      const approval = await queryOne<ApprovalRequest>(
        'SELECT * FROM approval_requests WHERE id = $1',
        [id]
      );
      if (!approval) {
        return { error: 'Approval request not found' };
      }
      return { approval };
    },
  }),

  list_teams: tool({
    description: 'List all teams',
    inputSchema: zodSchema(z.object({})),
    execute: async () => {
      const teams = await query<Team>('SELECT * FROM teams ORDER BY created_at DESC');
      return { teams, count: teams.length };
    },
  }),

  // Action tools
  create_task: tool({
    description: 'Create a new task, optionally linked to a goal',
    inputSchema: zodSchema(z.object({
      title: z.string().describe('Task title'),
      description: z.string().optional().describe('Task description'),
      goalId: z.string().optional().describe('Parent goal UUID'),
      parentTaskId: z.string().optional().describe('Parent task UUID for subtasks'),
      priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
      estimatedHours: z.number().optional().describe('Estimated hours to complete'),
      requiredCapabilities: z.array(z.string()).optional().describe('Required agent capabilities'),
    })),
    execute: async ({ title, description, goalId, parentTaskId, priority, estimatedHours, requiredCapabilities }) => {
      const result = await queryOne<Task>(
        `INSERT INTO tasks (title, description, goal_id, parent_task_id, priority, estimated_hours, required_capabilities, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
         RETURNING *`,
        [
          title,
          description || null,
          goalId || null,
          parentTaskId || null,
          priority,
          estimatedHours || null,
          requiredCapabilities ? JSON.stringify(requiredCapabilities) : null,
        ]
      );

      return { task: result, success: true };
    },
  }),

  update_task_status: tool({
    description: 'Update the status of a task',
    inputSchema: zodSchema(z.object({
      id: z.string().describe('Task UUID'),
      status: z.enum(['pending', 'ready', 'in_progress', 'blocked', 'completed', 'failed', 'cancelled']).describe('New status'),
      notes: z.string().optional().describe('Status update notes'),
    })),
    execute: async ({ id, status, notes }) => {
      const result = await queryOne<Task>(
        `UPDATE tasks
         SET status = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id, status]
      );

      if (!result) {
        return { error: 'Task not found' };
      }

      // Log the status change
      await query(
        `INSERT INTO task_audit_log (task_id, action, actor_type, actor_id, new_state)
         VALUES ($1, $2, 'user', 'chat_user', $3)`,
        [id, `status_changed_to_${status}`, JSON.stringify({ status, notes })]
      );

      return { task: result, success: true };
    },
  }),

  decompose_goal: tool({
    description: 'Use AI to decompose a goal into actionable tasks. This will analyze the goal and suggest a breakdown of tasks needed to achieve it.',
    inputSchema: zodSchema(z.object({
      goalId: z.string().describe('Goal UUID to decompose'),
      maxTasks: z.number().default(5).describe('Maximum number of tasks to generate'),
      createTasks: z.boolean().default(false).describe('If true, actually create the tasks in the database'),
    })),
    execute: async ({ goalId, maxTasks, createTasks }) => {
      // Get the goal
      const goal = await queryOne<Goal>(
        'SELECT * FROM goals WHERE id = $1',
        [goalId]
      );

      if (!goal) {
        return { error: 'Goal not found' };
      }

      // Generate task suggestions based on goal
      const suggestions = generateTaskSuggestions(goal, maxTasks);

      if (createTasks) {
        const createdTasks: Task[] = [];
        for (const suggestion of suggestions) {
          const task = await queryOne<Task>(
            `INSERT INTO tasks (title, description, goal_id, priority, status)
             VALUES ($1, $2, $3, $4, 'pending')
             RETURNING *`,
            [suggestion.title, suggestion.description, goalId, suggestion.priority]
          );
          if (task) createdTasks.push(task);
        }
        return { goal, tasks: createdTasks, created: true };
      }

      return { goal, suggestions, created: false };
    },
  }),

  update_goal_status: tool({
    description: 'Update the status of a goal',
    inputSchema: zodSchema(z.object({
      id: z.string().describe('Goal UUID'),
      status: z.enum(['active', 'completed', 'paused', 'cancelled']).describe('New status'),
    })),
    execute: async ({ id, status }) => {
      const result = await queryOne<Goal>(
        `UPDATE goals
         SET status = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id, status]
      );

      if (!result) {
        return { error: 'Goal not found' };
      }

      return { goal: result, success: true };
    },
  }),

  create_goal: tool({
    description: 'Create a new goal',
    inputSchema: zodSchema(z.object({
      title: z.string().describe('Goal title'),
      description: z.string().optional().describe('Goal description'),
      priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
      targetDate: z.string().optional().describe('Target date (ISO format)'),
    })),
    execute: async ({ title, description, priority, targetDate }) => {
      const result = await queryOne<Goal>(
        `INSERT INTO goals (title, description, priority, target_date)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [title, description || null, priority, targetDate || null]
      );

      return { goal: result, success: true };
    },
  }),

  approve_request: tool({
    description: 'Approve a pending approval request',
    inputSchema: zodSchema(z.object({
      id: z.string().describe('The approval request UUID'),
      reason: z.string().optional().describe('Reason for approval'),
    })),
    execute: async ({ id, reason }) => {
      const result = await queryOne<ApprovalRequest>(
        `UPDATE approval_requests
         SET status = 'approved',
             decided_at = NOW(),
             decided_by = 'chat_user',
             decision_reason = $2
         WHERE id = $1 AND status = 'pending'
         RETURNING *`,
        [id, reason || null]
      );

      if (!result) {
        return { error: 'Approval request not found or already processed' };
      }

      // Update policy stats
      if (result.policy_id) {
        await query(
          `UPDATE approval_policies
           SET times_approved = times_approved + 1
           WHERE id = $1`,
          [result.policy_id]
        );
      }

      return { approval: result, success: true };
    },
  }),

  reject_request: tool({
    description: 'Reject a pending approval request',
    inputSchema: zodSchema(z.object({
      id: z.string().describe('The approval request UUID'),
      reason: z.string().describe('Reason for rejection'),
    })),
    execute: async ({ id, reason }) => {
      const result = await queryOne<ApprovalRequest>(
        `UPDATE approval_requests
         SET status = 'rejected',
             decided_at = NOW(),
             decided_by = 'chat_user',
             decision_reason = $2
         WHERE id = $1 AND status = 'pending'
         RETURNING *`,
        [id, reason]
      );

      if (!result) {
        return { error: 'Approval request not found or already processed' };
      }

      // Update policy stats
      if (result.policy_id) {
        await query(
          `UPDATE approval_policies
           SET times_rejected = times_rejected + 1
           WHERE id = $1`,
          [result.policy_id]
        );
      }

      return { approval: result, success: true };
    },
  }),

  // Widget rendering tool
  render_widget: tool({
    description: 'Render a rich widget in the chat. Use this to display data visually.',
    inputSchema: zodSchema(z.object({
      type: z.enum([
        'card', 'list', 'table', 'progress', 'stat', 'badge',
        'agent_card', 'task_card', 'goal_card', 'approval_card', 'team_card',
        'timeline', 'form', 'action_group', 'confirmation',
      ]).describe('Widget type'),
      props: z.record(z.string(), z.unknown()).describe('Widget properties'),
      actions: z.array(z.object({
        id: z.string(),
        label: z.string(),
        actionType: z.string(),
        payload: z.record(z.string(), z.unknown()).optional(),
        variant: z.enum(['primary', 'secondary', 'destructive', 'ghost']).optional(),
      })).optional().describe('Widget actions'),
    })),
    execute: async ({ type, props, actions }) => {
      // This tool doesn't actually execute - it signals to the frontend
      // to render the widget. The result is passed through.
      return {
        widget: {
          id: `widget-${Date.now()}`,
          type,
          props,
          actions,
        },
      };
    },
  }),

  // Surface control tools
  show_workbench: tool({
    description: 'Show content in the workbench panel (right side)',
    inputSchema: zodSchema(z.object({
      widget: z.object({
        type: z.string(),
        props: z.record(z.string(), z.unknown()),
      }),
      title: z.string().optional(),
      width: z.enum(['narrow', 'medium', 'wide', 'full']).optional(),
    })),
    execute: async ({ widget, title, width }) => {
      return {
        surface: {
          surface: 'workbench',
          action: 'show',
          widget: {
            id: `workbench-${Date.now()}`,
            ...widget,
          },
          options: { title, width },
        },
      };
    },
  }),

  hide_workbench: tool({
    description: 'Hide the workbench panel',
    inputSchema: zodSchema(z.object({})),
    execute: async () => {
      return {
        surface: {
          surface: 'workbench',
          action: 'hide',
        },
      };
    },
  }),

  // ============================================================================
  // Marketing tools
  // ============================================================================

  list_campaigns: tool({
    description: 'List marketing campaigns for a project',
    inputSchema: zodSchema(z.object({
      project_id: z.string().optional().describe('Filter by project UUID'),
      status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
      limit: z.number().default(10),
    })),
    execute: async ({ project_id, status, limit }) => {
      let sql = 'SELECT * FROM marketing_campaigns WHERE 1=1';
      const params: unknown[] = [];

      if (project_id) { params.push(project_id); sql += ` AND project_id = $${params.length}`; }
      if (status) { params.push(status); sql += ` AND status = $${params.length}`; }

      sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const campaigns = await query<MarketingCampaign>(sql, params);
      return { campaigns, count: campaigns.length };
    },
  }),

  create_campaign: tool({
    description: 'Create a new marketing campaign for a project',
    inputSchema: zodSchema(z.object({
      project_id: z.string().describe('Project UUID'),
      title: z.string().describe('Campaign title'),
      description: z.string().optional().describe('Campaign description'),
      campaign_type: z.enum(['launch', 'content', 'paid', 'seo', 'email']).default('content'),
      start_date: z.string().optional().describe('Start date (ISO format)'),
      end_date: z.string().optional().describe('End date (ISO format)'),
      goals: z.record(z.string(), z.unknown()).optional().describe('Target KPIs and metrics'),
      budget_usd: z.number().optional().describe('Campaign budget in USD'),
    })),
    execute: async ({ project_id, title, description, campaign_type, start_date, end_date, goals, budget_usd }) => {
      const campaign = await queryOne<MarketingCampaign>(
        `INSERT INTO marketing_campaigns (project_id, title, description, campaign_type, start_date, end_date, goals, budget_usd)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [project_id, title, description || null, campaign_type, start_date || null, end_date || null, JSON.stringify(goals || {}), budget_usd || null]
      );
      return { campaign, success: true };
    },
  }),

  list_assets: tool({
    description: 'List marketing assets (copy, social posts, emails, videos, etc.) for a project or campaign',
    inputSchema: zodSchema(z.object({
      project_id: z.string().optional().describe('Filter by project UUID'),
      campaign_id: z.string().optional().describe('Filter by campaign UUID'),
      asset_type: z.enum(['copy', 'email', 'social_post', 'ad_creative', 'video', 'landing_page', 'blog', 'product_context']).optional(),
      status: z.enum(['draft', 'review', 'approved', 'published']).optional(),
      limit: z.number().default(10),
    })),
    execute: async ({ project_id, campaign_id, asset_type, status, limit }) => {
      let sql = 'SELECT * FROM marketing_assets WHERE 1=1';
      const params: unknown[] = [];

      if (project_id) { params.push(project_id); sql += ` AND project_id = $${params.length}`; }
      if (campaign_id) { params.push(campaign_id); sql += ` AND campaign_id = $${params.length}`; }
      if (asset_type) { params.push(asset_type); sql += ` AND asset_type = $${params.length}`; }
      if (status) { params.push(status); sql += ` AND status = $${params.length}`; }

      sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const assets = await query<MarketingAsset>(sql, params);
      return { assets, count: assets.length };
    },
  }),

  create_asset: tool({
    description: 'Create a marketing content asset (copy, social post, email, ad creative, blog post, etc.)',
    inputSchema: zodSchema(z.object({
      project_id: z.string().describe('Project UUID'),
      campaign_id: z.string().optional().describe('Associate with a campaign'),
      asset_type: z.enum(['copy', 'email', 'social_post', 'ad_creative', 'video', 'landing_page', 'blog']).describe('Type of content asset'),
      title: z.string().describe('Asset title'),
      content: z.object({
        headline: z.string().optional(),
        body: z.string().optional(),
        cta: z.string().optional(),
        subject_line: z.string().optional(),
        preview_text: z.string().optional(),
        variants: z.array(z.object({
          label: z.string(),
          headline: z.string().optional(),
          body: z.string().optional(),
          cta: z.string().optional(),
        })).optional(),
      }).passthrough().describe('Structured content (headline, body, CTA, variants)'),
      platform: z.enum(['instagram', 'tiktok', 'linkedin', 'x', 'youtube', 'meta_ads', 'google_ads', 'email']).optional(),
      metadata: z.record(z.string(), z.unknown()).optional().describe('Additional metadata (skill_used, dimensions, etc.)'),
    })),
    execute: async ({ project_id, campaign_id, asset_type, title, content, platform, metadata }) => {
      const asset = await queryOne<MarketingAsset>(
        `INSERT INTO marketing_assets (project_id, campaign_id, asset_type, title, content, platform, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [project_id, campaign_id || null, asset_type, title, JSON.stringify(content), platform || null, JSON.stringify(metadata || {})]
      );
      return { asset, success: true };
    },
  }),

  get_marketing_context: tool({
    description: 'Get the product marketing context for a project. This contains positioning, audience, personas, pain points, and brand voice. Generate it first if it does not exist.',
    inputSchema: zodSchema(z.object({
      project_id: z.string().describe('Project UUID'),
      regenerate: z.boolean().default(false).describe('Set true to regenerate the context from scratch'),
    })),
    execute: async ({ project_id, regenerate }) => {
      if (regenerate) {
        const context = await marketingContextBuilder.buildContext(project_id);
        return { context, source: 'generated' };
      }

      const existing = await marketingContextBuilder.getContext(project_id);
      if (existing) {
        return { context: existing, source: 'cached' };
      }

      // Auto-generate if none exists
      const context = await marketingContextBuilder.buildContext(project_id);
      return { context, source: 'generated' };
    },
  }),

  render_video: tool({
    description: 'Create a video asset and start rendering it with Remotion. First create the marketing asset, then create and render the video.',
    inputSchema: zodSchema(z.object({
      asset_id: z.string().describe('Marketing asset UUID (must be created first via create_asset with type "video")'),
      template_id: z.enum(['SocialClip', 'ProductDemo', 'AdCreative']).describe('Remotion video template'),
      input_props: z.record(z.string(), z.unknown()).describe('Video template props (headline, body, ctaText, brandColors, etc.)'),
      duration_seconds: z.number().optional().describe('Video duration in seconds'),
      aspect_ratio: z.enum(['9:16', '1:1', '16:9', '4:5']).optional().describe('Aspect ratio override'),
    })),
    execute: async ({ asset_id, template_id, input_props, duration_seconds, aspect_ratio }) => {
      const video = await videoRenderer.createVideo(
        asset_id, template_id, input_props, duration_seconds, aspect_ratio
      );
      const rendering = await videoRenderer.renderLocal(video.id);
      return { video: rendering, success: true };
    },
  }),

  list_video_templates: tool({
    description: 'List available Remotion video templates with their descriptions and supported configurations',
    inputSchema: zodSchema(z.object({})),
    execute: async () => {
      const templates = videoRenderer.listTemplates();
      return { templates };
    },
  }),

  list_marketing_skills: tool({
    description: 'List available marketing skills by category. Skills provide best practices for copywriting, CRO, SEO, strategy, growth, and ops.',
    inputSchema: zodSchema(z.object({})),
    execute: async () => {
      return {
        categories: [
          { name: 'Content & Copywriting', skills: ['copywriting', 'copy-editing', 'social-content', 'email-sequence', 'cold-email', 'ad-creative'] },
          { name: 'Conversion Optimization', skills: ['page-cro', 'signup-flow-cro', 'onboarding-cro', 'form-cro', 'popup-cro', 'paywall-upgrade-cro'] },
          { name: 'SEO & Discovery', skills: ['seo-audit', 'ai-seo', 'programmatic-seo', 'site-architecture', 'schema-markup', 'competitor-alternatives'] },
          { name: 'Strategy & Research', skills: ['marketing-ideas', 'marketing-psychology', 'launch-strategy', 'pricing-strategy', 'customer-research', 'content-strategy'] },
          { name: 'Retention & Growth', skills: ['referral-program', 'lead-magnets', 'free-tool-strategy', 'churn-prevention'] },
          { name: 'Marketing Ops', skills: ['analytics-tracking', 'ab-test-setup', 'revops', 'sales-enablement', 'paid-ads'] },
          { name: 'Foundation', skills: ['product-marketing-context'] },
        ],
        total: 33,
      };
    },
  }),
};
