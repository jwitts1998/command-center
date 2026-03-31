// Widget Registry - Maps widget types to React components

import { ComponentType } from 'react';
import { Widget, WidgetType, WidgetAction } from '@/types/widget';

// Generic props that all widget components receive
export interface WidgetComponentProps<P = Record<string, unknown>> {
  widget: Widget;
  props: P;
  children?: Widget[];
  actions?: WidgetAction[];
  onAction?: (action: WidgetAction) => void;
  compact?: boolean;
}

// Registry entry with component and metadata
export interface WidgetRegistryEntry {
  component: ComponentType<WidgetComponentProps<any>>;
  displayName: string;
  description?: string;
  supportsChildren?: boolean;
  supportsActions?: boolean;
  defaultProps?: Record<string, unknown>;
}

// The widget registry
const registry = new Map<WidgetType, WidgetRegistryEntry>();

// Register a widget type
export function registerWidget(
  type: WidgetType,
  entry: WidgetRegistryEntry
): void {
  registry.set(type, entry);
}

// Get a widget component by type
export function getWidget(type: WidgetType): WidgetRegistryEntry | undefined {
  return registry.get(type);
}

// Check if a widget type is registered
export function hasWidget(type: WidgetType): boolean {
  return registry.has(type);
}

// Get all registered widget types
export function getRegisteredWidgets(): WidgetType[] {
  return Array.from(registry.keys());
}

// Lookup table for mapping domain widget types to existing components
export const DOMAIN_WIDGET_MAPPINGS: Record<string, {
  component: string;
  fetchEndpoint?: string;
  idParam?: string;
}> = {
  agent_card: {
    component: 'AgentCard',
    fetchEndpoint: '/api/agents',
    idParam: 'agentId',
  },
  task_card: {
    component: 'TaskCard',
    fetchEndpoint: '/api/tasks',
    idParam: 'taskId',
  },
  goal_card: {
    component: 'GoalCard',
    fetchEndpoint: '/api/goals',
    idParam: 'goalId',
  },
  approval_card: {
    component: 'ApprovalCard',
    fetchEndpoint: '/api/approvals',
    idParam: 'approvalId',
  },
  team_card: {
    component: 'TeamCard',
    fetchEndpoint: '/api/teams',
    idParam: 'teamId',
  },
  run_card: {
    component: 'RunCard',
    fetchEndpoint: '/api/runs',
    idParam: 'runId',
  },
  session_card: {
    component: 'SessionCard',
    fetchEndpoint: '/api/sessions',
    idParam: 'sessionId',
  },
  timeline: {
    component: 'EventTimeline',
  },
};

// Helper to validate widget structure
export function validateWidget(widget: unknown): widget is Widget {
  if (!widget || typeof widget !== 'object') {
    return false;
  }

  const w = widget as Record<string, unknown>;

  // Must have id, type, and props
  if (typeof w.id !== 'string' || !w.id) {
    return false;
  }

  if (typeof w.type !== 'string' || !w.type) {
    return false;
  }

  if (typeof w.props !== 'object' || w.props === null) {
    return false;
  }

  // Validate children if present
  if (w.children !== undefined) {
    if (!Array.isArray(w.children)) {
      return false;
    }
    for (const child of w.children) {
      if (!validateWidget(child)) {
        return false;
      }
    }
  }

  // Validate actions if present
  if (w.actions !== undefined) {
    if (!Array.isArray(w.actions)) {
      return false;
    }
    for (const action of w.actions) {
      if (!validateAction(action)) {
        return false;
      }
    }
  }

  return true;
}

// Helper to validate widget action structure
export function validateAction(action: unknown): action is WidgetAction {
  if (!action || typeof action !== 'object') {
    return false;
  }

  const a = action as Record<string, unknown>;

  if (typeof a.id !== 'string' || !a.id) {
    return false;
  }

  if (typeof a.label !== 'string' || !a.label) {
    return false;
  }

  if (typeof a.actionType !== 'string' || !a.actionType) {
    return false;
  }

  return true;
}

// Get the data ID from a domain widget's props
export function getDomainWidgetId(widget: Widget): string | undefined {
  const mapping = DOMAIN_WIDGET_MAPPINGS[widget.type];
  if (!mapping || !mapping.idParam) {
    return undefined;
  }

  return widget.props[mapping.idParam] as string | undefined;
}

// Build fetch URL for a domain widget
export function buildFetchUrl(widget: Widget): string | undefined {
  const mapping = DOMAIN_WIDGET_MAPPINGS[widget.type];
  if (!mapping || !mapping.fetchEndpoint || !mapping.idParam) {
    return undefined;
  }

  const id = widget.props[mapping.idParam];
  if (!id) {
    return undefined;
  }

  return `${mapping.fetchEndpoint}/${id}`;
}
