import { cn } from '@/lib/utils';
import type { AgentStatus } from '@/types/agent';

interface HeartbeatIndicatorProps {
  status: AgentStatus;
  lastHeartbeat: Date | string | null;
  className?: string;
  showLabel?: boolean;
}

function getHeartbeatHealth(status: AgentStatus, lastHeartbeat: Date | string | null): {
  color: string;
  pulseColor: string;
  label: string;
  isHealthy: boolean;
} {
  // Check if agent is not active
  if (status === 'paused') {
    return {
      color: 'bg-yellow-500',
      pulseColor: 'bg-yellow-400',
      label: 'Paused',
      isHealthy: false,
    };
  }

  if (status === 'inactive') {
    return {
      color: 'bg-gray-400',
      pulseColor: 'bg-gray-300',
      label: 'Inactive',
      isHealthy: false,
    };
  }

  if (status === 'error') {
    return {
      color: 'bg-red-500',
      pulseColor: 'bg-red-400',
      label: 'Error',
      isHealthy: false,
    };
  }

  // Agent is active - check heartbeat recency
  if (!lastHeartbeat) {
    return {
      color: 'bg-gray-400',
      pulseColor: 'bg-gray-300',
      label: 'No heartbeat',
      isHealthy: false,
    };
  }

  const now = new Date();
  const lastBeat = new Date(lastHeartbeat);
  const diffMs = now.getTime() - lastBeat.getTime();
  const diffMins = diffMs / (1000 * 60);

  // Healthy: heartbeat within 5 minutes
  if (diffMins < 5) {
    return {
      color: 'bg-green-500',
      pulseColor: 'bg-green-400',
      label: 'Healthy',
      isHealthy: true,
    };
  }

  // Warning: heartbeat within 15 minutes
  if (diffMins < 15) {
    return {
      color: 'bg-yellow-500',
      pulseColor: 'bg-yellow-400',
      label: 'Stale',
      isHealthy: false,
    };
  }

  // Critical: no heartbeat for 15+ minutes
  return {
    color: 'bg-red-500',
    pulseColor: 'bg-red-400',
    label: 'Offline',
    isHealthy: false,
  };
}

export function HeartbeatIndicator({
  status,
  lastHeartbeat,
  className,
  showLabel = false,
}: HeartbeatIndicatorProps) {
  const health = getHeartbeatHealth(status, lastHeartbeat);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="relative flex h-3 w-3">
        {health.isHealthy && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              health.pulseColor
            )}
          />
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full h-3 w-3',
            health.color
          )}
        />
      </span>
      {showLabel && (
        <span className="text-xs text-muted-foreground">{health.label}</span>
      )}
    </div>
  );
}
