// A2UI widget system types - extends types/widget.ts with runtime helpers

import { Widget, WidgetAction, WidgetType } from '@/types/widget';

// Widget creation helper
export function createWidget<T extends WidgetType>(
  type: T,
  props: Record<string, unknown>,
  options?: {
    id?: string;
    children?: Widget[];
    actions?: WidgetAction[];
  }
): Widget {
  return {
    id: options?.id || `widget-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    props,
    children: options?.children,
    actions: options?.actions,
  };
}

// Widget action creation helper
export function createAction(
  label: string,
  actionType: WidgetAction['actionType'],
  options?: Partial<Omit<WidgetAction, 'id' | 'label' | 'actionType'>>
): WidgetAction {
  return {
    id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    label,
    actionType,
    ...options,
  };
}

// Streaming event types for JSONL parsing
export interface StreamEvent {
  type: 'widget' | 'text' | 'action' | 'surface' | 'error' | 'done';
  data: unknown;
}

export interface WidgetStreamEvent extends StreamEvent {
  type: 'widget';
  data: Widget;
}

export interface TextStreamEvent extends StreamEvent {
  type: 'text';
  data: string;
}

export interface ActionStreamEvent extends StreamEvent {
  type: 'action';
  data: {
    widgetId: string;
    actionId: string;
    result: unknown;
  };
}

export interface SurfaceStreamEvent extends StreamEvent {
  type: 'surface';
  data: {
    surface: 'workbench' | 'modal' | 'notification';
    action: 'show' | 'hide' | 'update';
    widget?: Widget;
    options?: Record<string, unknown>;
  };
}

export interface ErrorStreamEvent extends StreamEvent {
  type: 'error';
  data: {
    message: string;
    code?: string;
  };
}

export interface DoneStreamEvent extends StreamEvent {
  type: 'done';
  data: {
    messageId: string;
    conversationId: string;
  };
}

export type ParsedStreamEvent =
  | WidgetStreamEvent
  | TextStreamEvent
  | ActionStreamEvent
  | SurfaceStreamEvent
  | ErrorStreamEvent
  | DoneStreamEvent;

// Widget validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Widget render context
export interface WidgetRenderContext {
  // Current conversation context
  conversationId?: string;
  // Handler for widget actions
  onAction?: (action: WidgetAction, widgetId: string) => void;
  // Data fetcher for data binding
  fetchData?: (source: Widget['dataBinding']) => Promise<unknown>;
  // Whether widgets are interactive
  interactive?: boolean;
  // Compact mode
  compact?: boolean;
}

// Re-export widget types for convenience
export * from '@/types/widget';
