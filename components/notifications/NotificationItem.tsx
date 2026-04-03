'use client';

import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/notification';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Bot,
  Target,
  CheckSquare,
  DollarSign,
  ArrowRightLeft,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: Notification) => void;
  compact?: boolean;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  approval_required: AlertTriangle,
  task_assigned: CheckSquare,
  agent_status_change: Bot,
  budget_alert: DollarSign,
  goal_completed: Target,
  task_completed: CheckCircle2,
  delegation_received: ArrowRightLeft,
  system: Info,
};

const severityColors: Record<string, string> = {
  info: 'text-blue-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
  success: 'text-green-500',
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  compact = false,
}: NotificationItemProps) {
  const Icon = typeIcons[notification.type] || Bell;
  const severity = notification.metadata?.severity as string || 'info';
  const iconColor = severityColors[severity] || severityColors.info;

  const handleClick = () => {
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onClick) {
      onClick(notification);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead && !notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer group',
        notification.is_read
          ? 'bg-transparent hover:bg-accent/50'
          : 'bg-accent/30 hover:bg-accent/50',
        compact && 'p-2 gap-2'
      )}
      onClick={handleClick}
    >
      <div className={cn('mt-0.5 shrink-0', iconColor)}>
        <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm font-medium leading-tight',
              notification.is_read && 'text-muted-foreground'
            )}
          >
            {notification.title}
          </p>
          {!notification.is_read && (
            <span className="shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />
          )}
        </div>

        {notification.message && !compact && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>

      {!compact && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleMarkAsRead}
              title="Mark as read"
            >
              <CheckCircle2 className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            title="Delete"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
