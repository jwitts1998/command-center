// ActionHandler - Handles widget actions and integrates with services

import { WidgetAction, ActionType, Widget } from '@/types/widget';
import type { UserActionEvent, ConversationContext } from '@/types/chat';
import { query, queryOne } from '@/lib/db/client';
import { createWidget } from '@/lib/a2ui/types';

// Action result structure
export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
  widget?: Widget;
  error?: string;
}

// Action handler function type
type ActionHandlerFn = (
  action: WidgetAction,
  context: ActionContext
) => Promise<ActionResult>;

// Context provided to action handlers
export interface ActionContext {
  conversationId?: string;
  conversationContext?: ConversationContext;
  userId?: string;
  payload?: Record<string, unknown>;
}

// Registry of action handlers
const actionHandlers = new Map<ActionType, ActionHandlerFn>();

// Register an action handler
export function registerActionHandler(
  type: ActionType,
  handler: ActionHandlerFn
): void {
  actionHandlers.set(type, handler);
}

// Handle an action
export async function handleAction(
  action: WidgetAction,
  context: ActionContext
): Promise<ActionResult> {
  const handler = actionHandlers.get(action.actionType);

  if (!handler) {
    return {
      success: false,
      message: `Unknown action type: ${action.actionType}`,
      error: 'UNKNOWN_ACTION',
    };
  }

  try {
    // Merge action payload with context payload
    const mergedContext: ActionContext = {
      ...context,
      payload: { ...context.payload, ...action.payload },
    };

    return await handler(action, mergedContext);
  } catch (error) {
    console.error(`Error handling action ${action.actionType}:`, error);
    return {
      success: false,
      message: `Failed to execute action: ${action.label}`,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Handle a user action event (from widget interaction)
export async function handleUserAction(
  event: UserActionEvent,
  context: ActionContext
): Promise<ActionResult> {
  // Convert event to action format
  const action: WidgetAction = {
    id: event.actionId,
    label: event.actionType,
    actionType: event.actionType as ActionType,
    payload: event.payload,
  };

  return handleAction(action, context);
}

// ============================================================================
// Built-in Action Handlers
// ============================================================================

// Navigate action
registerActionHandler('navigate', async (action, context) => {
  const target = action.payload?.target as string;
  if (!target) {
    return {
      success: false,
      message: 'No navigation target specified',
      error: 'MISSING_TARGET',
    };
  }

  return {
    success: true,
    message: `Navigate to ${target}`,
    data: { url: target },
  };
});

// Show workbench action
registerActionHandler('show_workbench', async (action, context) => {
  const widget = action.payload?.widget as Widget;
  return {
    success: true,
    message: 'Showing workbench',
    widget,
  };
});

// Close workbench action
registerActionHandler('close_workbench', async () => {
  return {
    success: true,
    message: 'Workbench closed',
  };
});

// Approve request action
registerActionHandler('approve', async (action, context) => {
  const approvalId = action.payload?.approvalId as string;
  const reason = action.payload?.reason as string;

  if (!approvalId) {
    return {
      success: false,
      message: 'No approval ID specified',
      error: 'MISSING_APPROVAL_ID',
    };
  }

  try {
    const result = await queryOne<any>(
      `UPDATE approval_requests
       SET status = 'approved',
           decided_at = NOW(),
           decided_by = $2,
           decision_reason = $3
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [approvalId, context.userId || 'user', reason || null]
    );

    if (!result) {
      return {
        success: false,
        message: 'Approval request not found or already processed',
        error: 'NOT_FOUND',
      };
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

    return {
      success: true,
      message: 'Request approved successfully',
      data: result,
      widget: createWidget('confirmation', {
        title: 'Request Approved',
        message: `Approval request has been approved.`,
        variant: 'info',
      }),
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to approve request',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Reject request action
registerActionHandler('reject', async (action, context) => {
  const approvalId = action.payload?.approvalId as string;
  const reason = action.payload?.reason as string;

  if (!approvalId) {
    return {
      success: false,
      message: 'No approval ID specified',
      error: 'MISSING_APPROVAL_ID',
    };
  }

  try {
    const result = await queryOne<any>(
      `UPDATE approval_requests
       SET status = 'rejected',
           decided_at = NOW(),
           decided_by = $2,
           decision_reason = $3
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [approvalId, context.userId || 'user', reason || null]
    );

    if (!result) {
      return {
        success: false,
        message: 'Approval request not found or already processed',
        error: 'NOT_FOUND',
      };
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

    return {
      success: true,
      message: 'Request rejected',
      data: result,
      widget: createWidget('confirmation', {
        title: 'Request Rejected',
        message: `Approval request has been rejected.`,
        variant: 'warning',
      }),
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to reject request',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Checkout task action
registerActionHandler('checkout_task', async (action, context) => {
  const taskId = action.payload?.taskId as string;
  const agentId = action.payload?.agentId as string;

  if (!taskId) {
    return {
      success: false,
      message: 'No task ID specified',
      error: 'MISSING_TASK_ID',
    };
  }

  try {
    // Generate checkout token
    const checkoutToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const result = await queryOne<any>(
      `UPDATE tasks
       SET checkout_token = $2,
           checkout_expires_at = $3,
           assigned_agent_id = $4
       WHERE id = $1
         AND (checkout_token IS NULL OR checkout_expires_at < NOW())
         AND status IN ('pending', 'ready')
       RETURNING *`,
      [taskId, checkoutToken, expiresAt, agentId || null]
    );

    if (!result) {
      return {
        success: false,
        message: 'Task not available for checkout',
        error: 'CHECKOUT_FAILED',
      };
    }

    // Log the checkout
    await query(
      `INSERT INTO task_audit_log (task_id, action, actor_type, actor_id, new_state)
       VALUES ($1, 'checkout', 'user', $2, $3)`,
      [taskId, context.userId || 'user', JSON.stringify({ checkout_token: checkoutToken })]
    );

    return {
      success: true,
      message: 'Task checked out successfully',
      data: {
        taskId,
        checkoutToken,
        expiresAt,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to checkout task',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Release task action
registerActionHandler('release_task', async (action, context) => {
  const taskId = action.payload?.taskId as string;

  if (!taskId) {
    return {
      success: false,
      message: 'No task ID specified',
      error: 'MISSING_TASK_ID',
    };
  }

  try {
    const result = await queryOne<any>(
      `UPDATE tasks
       SET checkout_token = NULL,
           checkout_expires_at = NULL
       WHERE id = $1
       RETURNING *`,
      [taskId]
    );

    if (!result) {
      return {
        success: false,
        message: 'Task not found',
        error: 'NOT_FOUND',
      };
    }

    // Log the release
    await query(
      `INSERT INTO task_audit_log (task_id, action, actor_type, actor_id, new_state)
       VALUES ($1, 'release', 'user', $2, $3)`,
      [taskId, context.userId || 'user', JSON.stringify({ released: true })]
    );

    return {
      success: true,
      message: 'Task released successfully',
      data: { taskId },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to release task',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Pause agent action
registerActionHandler('pause_agent', async (action, context) => {
  const agentId = action.payload?.agentId as string;

  if (!agentId) {
    return {
      success: false,
      message: 'No agent ID specified',
      error: 'MISSING_AGENT_ID',
    };
  }

  try {
    const result = await queryOne<any>(
      `UPDATE agents
       SET status = 'paused'
       WHERE id = $1 AND status = 'active'
       RETURNING *`,
      [agentId]
    );

    if (!result) {
      return {
        success: false,
        message: 'Agent not found or not active',
        error: 'NOT_FOUND',
      };
    }

    return {
      success: true,
      message: `Agent ${result.name} paused`,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to pause agent',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Resume agent action
registerActionHandler('resume_agent', async (action, context) => {
  const agentId = action.payload?.agentId as string;

  if (!agentId) {
    return {
      success: false,
      message: 'No agent ID specified',
      error: 'MISSING_AGENT_ID',
    };
  }

  try {
    const result = await queryOne<any>(
      `UPDATE agents
       SET status = 'active'
       WHERE id = $1 AND status = 'paused'
       RETURNING *`,
      [agentId]
    );

    if (!result) {
      return {
        success: false,
        message: 'Agent not found or not paused',
        error: 'NOT_FOUND',
      };
    }

    return {
      success: true,
      message: `Agent ${result.name} resumed`,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to resume agent',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Create action
registerActionHandler('create', async (action, context) => {
  const entityType = action.payload?.entityType as string;
  const data = action.payload?.data as Record<string, unknown>;

  if (!entityType || !data) {
    return {
      success: false,
      message: 'Missing entity type or data',
      error: 'MISSING_DATA',
    };
  }

  // This is a generic handler - specific creation should go through the API
  return {
    success: true,
    message: `Create ${entityType} requested`,
    data: { entityType, data },
  };
});

// Submit form action
registerActionHandler('submit_form', async (action, context) => {
  const formData = action.payload?.formData as Record<string, unknown>;
  const formType = action.payload?.formType as string;

  if (!formData) {
    return {
      success: false,
      message: 'No form data provided',
      error: 'MISSING_DATA',
    };
  }

  return {
    success: true,
    message: `Form submitted: ${formType || 'unknown'}`,
    data: formData,
  };
});

// Custom action (pass-through for AI-defined actions)
registerActionHandler('custom', async (action, context) => {
  return {
    success: true,
    message: `Custom action: ${action.label}`,
    data: action.payload,
  };
});
