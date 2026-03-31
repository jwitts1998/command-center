// Chat types for AI-first interface

import { Widget, WidgetAction } from './widget';

// Message roles
export type ChatRole = 'user' | 'assistant' | 'system';

// Intent categories for message classification
export type IntentCategory =
  | 'navigation'   // "Show agents", "Go to tasks"
  | 'query'        // "Status of goal X?", "Pending approvals?"
  | 'action'       // "Create goal", "Approve #123"
  | 'workflow'     // "Decompose this goal", "Start execution"
  | 'config'       // "Set agent budget", "Update policy"
  | 'conversation' // General chat, clarification
  | 'unknown';

// Parsed intent from a user message
export interface ParsedIntent {
  category: IntentCategory;
  action: string;
  entities: IntentEntity[];
  confidence: number;
  rawText: string;
}

// Entity extracted from intent
export interface IntentEntity {
  type: 'goal' | 'task' | 'agent' | 'approval' | 'team' | 'number' | 'date' | 'string';
  value: string;
  id?: string;
  rawMatch: string;
}

// Chat message structure
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string | null;
  widgets: Widget[];
  actions: WidgetAction[];
  metadata: ChatMessageMetadata;
  createdAt: Date;
}

// Metadata attached to messages
export interface ChatMessageMetadata {
  intent?: ParsedIntent;
  toolCalls?: ToolCallRecord[];
  streamComplete?: boolean;
  error?: string;
  processingTime?: number;
}

// Record of a tool call made during message generation
export interface ToolCallRecord {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

// Conversation structure
export interface Conversation {
  id: string;
  userId: string | null;
  title: string | null;
  context: ConversationContext;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Context maintained across a conversation
export interface ConversationContext {
  // Referenced entities
  referencedGoals?: string[];
  referencedTasks?: string[];
  referencedAgents?: string[];
  referencedApprovals?: string[];
  referencedTeams?: string[];

  // Active focus
  activeGoalId?: string;
  activeTaskId?: string;
  activeAgentId?: string;

  // User preferences learned in conversation
  preferences?: Record<string, unknown>;

  // Summary of conversation for context window
  summary?: string;

  // Custom context from actions
  custom?: Record<string, unknown>;
}

// Conversation with messages included
export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
}

// Surface types for UI rendering
export type SurfaceType = 'primary_chat' | 'workbench' | 'modal' | 'notification';

// Surface action from AI
export interface SurfaceAction {
  surface: SurfaceType;
  action: 'show' | 'hide' | 'update' | 'clear';
  widget?: Widget;
  options?: SurfaceOptions;
}

// Options for surface rendering
export interface SurfaceOptions {
  title?: string;
  closeable?: boolean;
  width?: 'narrow' | 'medium' | 'wide' | 'full';
  position?: 'left' | 'right' | 'center';
}

// Chat API request
export interface ChatRequest {
  conversationId?: string;
  message: string;
  context?: Partial<ConversationContext>;
}

// Chat API streaming response event
export interface ChatStreamEvent {
  type: 'text' | 'widget' | 'surface' | 'tool_call' | 'tool_result' | 'error' | 'done';
  data: ChatStreamEventData;
}

export type ChatStreamEventData =
  | { type: 'text'; content: string }
  | { type: 'widget'; widget: Widget }
  | { type: 'surface'; action: SurfaceAction }
  | { type: 'tool_call'; id: string; name: string; arguments: Record<string, unknown> }
  | { type: 'tool_result'; id: string; result: unknown }
  | { type: 'error'; message: string; code?: string }
  | { type: 'done'; messageId: string; conversationId: string };

// Chat state for UI
export interface ChatState {
  conversation: Conversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  workbenchWidget: Widget | null;
  workbenchOptions: SurfaceOptions | null;
}

// User action event (from widget interactions)
export interface UserActionEvent {
  actionId: string;
  widgetId: string;
  actionType: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}
