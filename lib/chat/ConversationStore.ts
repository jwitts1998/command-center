// ConversationStore - Database operations for conversations and messages

import { query, queryOne } from '@/lib/db/client';
import type {
  Conversation,
  ChatMessage,
  ConversationContext,
  ConversationWithMessages,
} from '@/types/chat';
import type { Widget, WidgetAction } from '@/types/widget';

// Convert database row to Conversation type
function rowToConversation(row: any): Conversation {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    context: row.context || {},
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Convert database row to ChatMessage type
function rowToMessage(row: any): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    widgets: row.widgets || [],
    actions: row.actions || [],
    metadata: row.metadata || {},
    createdAt: new Date(row.created_at),
  };
}

// Create a new conversation
export async function createConversation(
  options: {
    userId?: string;
    title?: string;
    context?: ConversationContext;
  } = {}
): Promise<Conversation> {
  const result = await queryOne<any>(
    `INSERT INTO conversations (user_id, title, context)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [
      options.userId || null,
      options.title || null,
      JSON.stringify(options.context || {}),
    ]
  );

  if (!result) {
    throw new Error('Failed to create conversation');
  }

  return rowToConversation(result);
}

// Get a conversation by ID
export async function getConversation(id: string): Promise<Conversation | null> {
  const result = await queryOne<any>(
    `SELECT * FROM conversations WHERE id = $1`,
    [id]
  );

  return result ? rowToConversation(result) : null;
}

// Get a conversation with its messages
export async function getConversationWithMessages(
  id: string,
  messageLimit = 100
): Promise<ConversationWithMessages | null> {
  const conversation = await getConversation(id);
  if (!conversation) {
    return null;
  }

  const messages = await getMessages(id, messageLimit);

  return {
    ...conversation,
    messages,
  };
}

// List conversations
export async function listConversations(options: {
  userId?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<Conversation[]> {
  const { userId, isActive, limit = 50, offset = 0 } = options;

  let sql = `SELECT * FROM conversations WHERE 1=1`;
  const params: any[] = [];

  if (userId !== undefined) {
    params.push(userId);
    sql += ` AND user_id = $${params.length}`;
  }

  if (isActive !== undefined) {
    params.push(isActive);
    sql += ` AND is_active = $${params.length}`;
  }

  sql += ` ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const results = await query<any>(sql, params);
  return results.map(rowToConversation);
}

// Update conversation
export async function updateConversation(
  id: string,
  updates: {
    title?: string;
    context?: ConversationContext;
    isActive?: boolean;
  }
): Promise<Conversation | null> {
  const sets: string[] = [];
  const params: any[] = [id];

  if (updates.title !== undefined) {
    params.push(updates.title);
    sets.push(`title = $${params.length}`);
  }

  if (updates.context !== undefined) {
    params.push(JSON.stringify(updates.context));
    sets.push(`context = $${params.length}`);
  }

  if (updates.isActive !== undefined) {
    params.push(updates.isActive);
    sets.push(`is_active = $${params.length}`);
  }

  if (sets.length === 0) {
    return getConversation(id);
  }

  const result = await queryOne<any>(
    `UPDATE conversations SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );

  return result ? rowToConversation(result) : null;
}

// Delete a conversation
export async function deleteConversation(id: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM conversations WHERE id = $1`,
    [id]
  );
  return (result as any).rowCount > 0;
}

// Add a message to a conversation
export async function addMessage(
  conversationId: string,
  message: {
    role: 'user' | 'assistant' | 'system';
    content: string | null;
    widgets?: Widget[];
    actions?: WidgetAction[];
    metadata?: Record<string, unknown>;
  }
): Promise<ChatMessage> {
  const result = await queryOne<any>(
    `INSERT INTO chat_messages (conversation_id, role, content, widgets, actions, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      conversationId,
      message.role,
      message.content,
      JSON.stringify(message.widgets || []),
      JSON.stringify(message.actions || []),
      JSON.stringify(message.metadata || {}),
    ]
  );

  if (!result) {
    throw new Error('Failed to add message');
  }

  // Update conversation's updated_at
  await query(
    `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
    [conversationId]
  );

  return rowToMessage(result);
}

// Get messages for a conversation
export async function getMessages(
  conversationId: string,
  limit = 100,
  offset = 0
): Promise<ChatMessage[]> {
  const results = await query<any>(
    `SELECT * FROM chat_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC
     LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset]
  );

  return results.map(rowToMessage);
}

// Get recent messages for context window
export async function getRecentMessages(
  conversationId: string,
  limit = 20
): Promise<ChatMessage[]> {
  // Get the most recent messages, but return them in chronological order
  const results = await query<any>(
    `SELECT * FROM (
       SELECT * FROM chat_messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2
     ) sub ORDER BY created_at ASC`,
    [conversationId, limit]
  );

  return results.map(rowToMessage);
}

// Update message
export async function updateMessage(
  id: string,
  updates: {
    content?: string;
    widgets?: Widget[];
    actions?: WidgetAction[];
    metadata?: Record<string, unknown>;
  }
): Promise<ChatMessage | null> {
  const sets: string[] = [];
  const params: any[] = [id];

  if (updates.content !== undefined) {
    params.push(updates.content);
    sets.push(`content = $${params.length}`);
  }

  if (updates.widgets !== undefined) {
    params.push(JSON.stringify(updates.widgets));
    sets.push(`widgets = $${params.length}`);
  }

  if (updates.actions !== undefined) {
    params.push(JSON.stringify(updates.actions));
    sets.push(`actions = $${params.length}`);
  }

  if (updates.metadata !== undefined) {
    params.push(JSON.stringify(updates.metadata));
    sets.push(`metadata = $${params.length}`);
  }

  if (sets.length === 0) {
    return queryOne<any>(
      `SELECT * FROM chat_messages WHERE id = $1`,
      [id]
    ).then(r => r ? rowToMessage(r) : null);
  }

  const result = await queryOne<any>(
    `UPDATE chat_messages SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );

  return result ? rowToMessage(result) : null;
}

// Delete a message
export async function deleteMessage(id: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM chat_messages WHERE id = $1`,
    [id]
  );
  return (result as any).rowCount > 0;
}

// Generate a title for a conversation based on the first message
export async function generateConversationTitle(
  conversationId: string
): Promise<string | null> {
  const messages = await getMessages(conversationId, 1);
  if (messages.length === 0 || !messages[0].content) {
    return null;
  }

  // Simple title generation - take first 50 chars of first message
  const content = messages[0].content;
  const title = content.length > 50 ? content.substring(0, 47) + '...' : content;

  await updateConversation(conversationId, { title });

  return title;
}

// Update conversation context with new entity references
export async function updateContextWithEntities(
  conversationId: string,
  entities: {
    goalIds?: string[];
    taskIds?: string[];
    agentIds?: string[];
    approvalIds?: string[];
    teamIds?: string[];
  }
): Promise<Conversation | null> {
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    return null;
  }

  const context = conversation.context;

  // Merge entity references (deduplicate)
  if (entities.goalIds) {
    context.referencedGoals = [
      ...new Set([...(context.referencedGoals || []), ...entities.goalIds]),
    ];
  }
  if (entities.taskIds) {
    context.referencedTasks = [
      ...new Set([...(context.referencedTasks || []), ...entities.taskIds]),
    ];
  }
  if (entities.agentIds) {
    context.referencedAgents = [
      ...new Set([...(context.referencedAgents || []), ...entities.agentIds]),
    ];
  }
  if (entities.approvalIds) {
    context.referencedApprovals = [
      ...new Set([...(context.referencedApprovals || []), ...entities.approvalIds]),
    ];
  }
  if (entities.teamIds) {
    context.referencedTeams = [
      ...new Set([...(context.referencedTeams || []), ...entities.teamIds]),
    ];
  }

  return updateConversation(conversationId, { context });
}

// Search conversations by content
export async function searchConversations(
  searchTerm: string,
  options: {
    userId?: string;
    limit?: number;
  } = {}
): Promise<Conversation[]> {
  const { userId, limit = 20 } = options;

  let sql = `
    SELECT DISTINCT c.* FROM conversations c
    JOIN chat_messages m ON m.conversation_id = c.id
    WHERE m.content ILIKE $1
  `;
  const params: any[] = [`%${searchTerm}%`];

  if (userId) {
    params.push(userId);
    sql += ` AND c.user_id = $${params.length}`;
  }

  sql += ` ORDER BY c.updated_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const results = await query<any>(sql, params);
  return results.map(rowToConversation);
}
