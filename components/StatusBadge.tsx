import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType =
  // Goal statuses
  | 'active' | 'completed' | 'paused' | 'cancelled'
  // Task statuses
  | 'pending' | 'ready' | 'in_progress' | 'blocked' | 'failed'
  // Agent statuses
  | 'inactive' | 'error'
  // Approval statuses
  | 'approved' | 'rejected' | 'expired' | 'auto_approved'
  // Delegation statuses
  | 'revoked'
  // Generic
  | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  size?: 'sm' | 'default';
}

const statusConfig: Record<string, { bg: string; text: string; label?: string }> = {
  // Green statuses
  active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  auto_approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Auto Approved' },

  // Blue statuses
  pending: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  ready: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'In Progress' },

  // Yellow statuses
  paused: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  blocked: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  inactive: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  expired: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },

  // Red statuses
  failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  error: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  revoked: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
};

export function StatusBadge({ status, className, size = 'default' }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-400'
  };

  const label = config.label || status.replace(/_/g, ' ');

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-0 capitalize',
        config.bg,
        config.text,
        size === 'sm' && 'text-[10px] px-1.5 py-0',
        className
      )}
    >
      {label}
    </Badge>
  );
}
