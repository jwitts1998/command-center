// ContextManager - Manages conversation context and builds prompts

import type { ChatMessage, ConversationContext, Conversation } from '@/types/chat';
import { query } from '@/lib/db/client';
import type { Goal, Task, Agent, ApprovalRequest, Team } from '@/types';

// Maximum tokens for context window (approximate)
const MAX_CONTEXT_TOKENS = 4000;
const AVG_CHARS_PER_TOKEN = 4;

// Build system context from conversation and entities
export async function buildSystemContext(
  conversation: Conversation | null,
  recentMessages: ChatMessage[]
): Promise<string> {
  const parts: string[] = [];

  // Add conversation context if available
  if (conversation?.context) {
    const ctx = conversation.context;

    // Active focus
    if (ctx.activeGoalId) {
      parts.push(`Current focus: Goal ${ctx.activeGoalId}`);
    }
    if (ctx.activeTaskId) {
      parts.push(`Current focus: Task ${ctx.activeTaskId}`);
    }
    if (ctx.activeAgentId) {
      parts.push(`Current focus: Agent ${ctx.activeAgentId}`);
    }

    // Summary if available
    if (ctx.summary) {
      parts.push(`Conversation summary: ${ctx.summary}`);
    }
  }

  // Fetch referenced entity details
  if (conversation?.context) {
    const entityContext = await buildEntityContext(conversation.context);
    if (entityContext) {
      parts.push(entityContext);
    }
  }

  // Build recent message summary
  if (recentMessages.length > 0) {
    const messageSummary = buildMessageSummary(recentMessages);
    if (messageSummary) {
      parts.push(`Recent conversation:\n${messageSummary}`);
    }
  }

  return parts.join('\n\n');
}

// Build context from referenced entities
async function buildEntityContext(context: ConversationContext): Promise<string | null> {
  const parts: string[] = [];

  // Fetch goals
  if (context.referencedGoals && context.referencedGoals.length > 0) {
    const goals = await fetchGoals(context.referencedGoals.slice(-3)); // Last 3
    if (goals.length > 0) {
      parts.push('Referenced Goals:');
      for (const goal of goals) {
        parts.push(`  - ${goal.title} (${goal.status}, ${goal.priority} priority)`);
      }
    }
  }

  // Fetch tasks
  if (context.referencedTasks && context.referencedTasks.length > 0) {
    const tasks = await fetchTasks(context.referencedTasks.slice(-5)); // Last 5
    if (tasks.length > 0) {
      parts.push('Referenced Tasks:');
      for (const task of tasks) {
        parts.push(`  - ${task.title} (${task.status})`);
      }
    }
  }

  // Fetch agents
  if (context.referencedAgents && context.referencedAgents.length > 0) {
    const agents = await fetchAgents(context.referencedAgents.slice(-3)); // Last 3
    if (agents.length > 0) {
      parts.push('Referenced Agents:');
      for (const agent of agents) {
        parts.push(`  - ${agent.name} (@${agent.slug}, ${agent.status})`);
      }
    }
  }

  // Fetch approvals
  if (context.referencedApprovals && context.referencedApprovals.length > 0) {
    const approvals = await fetchApprovals(context.referencedApprovals.slice(-3)); // Last 3
    if (approvals.length > 0) {
      parts.push('Referenced Approvals:');
      for (const approval of approvals) {
        parts.push(`  - ${approval.operation_type} (${approval.status})`);
      }
    }
  }

  return parts.length > 0 ? parts.join('\n') : null;
}

// Build summary of recent messages
function buildMessageSummary(messages: ChatMessage[]): string {
  const lines: string[] = [];
  let tokenCount = 0;
  const maxTokens = MAX_CONTEXT_TOKENS / 2;

  // Process messages from oldest to newest, but stop if we exceed token limit
  for (const msg of messages) {
    const content = msg.content || '';
    const role = msg.role === 'assistant' ? 'Assistant' : 'User';
    const line = `${role}: ${truncateContent(content, 200)}`;

    const lineTokens = Math.ceil(line.length / AVG_CHARS_PER_TOKEN);
    if (tokenCount + lineTokens > maxTokens) {
      break;
    }

    lines.push(line);
    tokenCount += lineTokens;
  }

  return lines.join('\n');
}

// Truncate content to a max length
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength - 3) + '...';
}

// Fetch helper functions
async function fetchGoals(ids: string[]): Promise<Goal[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  return query<Goal>(
    `SELECT * FROM goals WHERE id IN (${placeholders})`,
    ids
  );
}

async function fetchTasks(ids: string[]): Promise<Task[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  return query<Task>(
    `SELECT * FROM tasks WHERE id IN (${placeholders})`,
    ids
  );
}

async function fetchAgents(ids: string[]): Promise<Agent[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  return query<Agent>(
    `SELECT * FROM agents WHERE id IN (${placeholders})`,
    ids
  );
}

async function fetchApprovals(ids: string[]): Promise<ApprovalRequest[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  return query<ApprovalRequest>(
    `SELECT * FROM approval_requests WHERE id IN (${placeholders})`,
    ids
  );
}

// Extract entities from AI response and update context
export function extractEntitiesFromResponse(
  content: string
): Partial<ConversationContext> {
  const context: Partial<ConversationContext> = {};

  // UUID pattern
  const uuidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi;

  // Look for entity mentions with context
  const goalMatches = content.match(/goal[:\s]+([a-f0-9-]{36})/gi);
  if (goalMatches) {
    context.referencedGoals = goalMatches.map((m) => m.match(uuidPattern)?.[0] || '').filter(Boolean);
  }

  const taskMatches = content.match(/task[:\s]+([a-f0-9-]{36})/gi);
  if (taskMatches) {
    context.referencedTasks = taskMatches.map((m) => m.match(uuidPattern)?.[0] || '').filter(Boolean);
  }

  const agentMatches = content.match(/agent[:\s]+([a-f0-9-]{36})/gi);
  if (agentMatches) {
    context.referencedAgents = agentMatches.map((m) => m.match(uuidPattern)?.[0] || '').filter(Boolean);
  }

  return context;
}

// Summarize a long conversation for context
export async function summarizeConversation(
  messages: ChatMessage[]
): Promise<string> {
  // For now, just extract key points
  // In production, this would call an LLM to summarize
  const keyPoints: string[] = [];

  for (const msg of messages) {
    if (msg.role === 'user' && msg.content) {
      // Extract first line of user messages as key points
      const firstLine = msg.content.split('\n')[0].trim();
      if (firstLine.length > 10 && firstLine.length < 100) {
        keyPoints.push(firstLine);
      }
    }
  }

  // Keep last 5 unique points
  const uniquePoints = [...new Set(keyPoints)].slice(-5);
  return uniquePoints.join('; ');
}

// Get current system stats for context
export async function getSystemStats(): Promise<{
  pendingApprovals: number;
  activeTasks: number;
  activeAgents: number;
  activeGoals: number;
}> {
  const [approvals, tasks, agents, goals] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM approval_requests WHERE status = 'pending'`
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM tasks WHERE status IN ('pending', 'ready', 'in_progress')`
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM agents WHERE status = 'active'`
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM goals WHERE status = 'active'`
    ),
  ]);

  return {
    pendingApprovals: parseInt(approvals[0]?.count || '0', 10),
    activeTasks: parseInt(tasks[0]?.count || '0', 10),
    activeAgents: parseInt(agents[0]?.count || '0', 10),
    activeGoals: parseInt(goals[0]?.count || '0', 10),
  };
}
