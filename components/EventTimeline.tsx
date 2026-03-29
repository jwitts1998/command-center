'use client';

import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, formatDate } from '@/lib/utils';

export interface TimelineEvent {
  type: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

interface EventTimelineProps {
  events: TimelineEvent[];
  isLive?: boolean;
}

const eventTypeStyles: Record<string, { color: string; icon: string }> = {
  run_started: { color: 'bg-blue-500', icon: '▶' },
  run_completed: { color: 'bg-green-500', icon: '✓' },
  run_failed: { color: 'bg-red-500', icon: '✗' },
  triage_started: { color: 'bg-purple-500', icon: '🔍' },
  triage_completed: { color: 'bg-purple-500', icon: '📋' },
  dispatch_started: { color: 'bg-orange-500', icon: '📤' },
  dispatch_completed: { color: 'bg-orange-500', icon: '📨' },
  agent_output: { color: 'bg-gray-500', icon: '💬' },
  tool_call: { color: 'bg-cyan-500', icon: '🔧' },
  tool_result: { color: 'bg-cyan-500', icon: '📦' },
  status_update: { color: 'bg-yellow-500', icon: '📊' },
  error: { color: 'bg-red-500', icon: '⚠' },
};

function getEventStyle(type: string): { color: string; icon: string } {
  return eventTypeStyles[type] || { color: 'bg-gray-400', icon: '•' };
}

function formatEventType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function EventContent({ event }: { event: TimelineEvent }) {
  const { type, data } = event;

  if (!data) {
    return null;
  }

  switch (type) {
    case 'triage_completed': {
      const d = data as Record<string, string>;
      return (
        <div className="mt-2 p-2 bg-muted rounded text-sm">
          {d.lane ? <p>Lane: <Badge variant="outline">{d.lane}</Badge></p> : null}
          {d.agent ? <p>Agent: <Badge variant="outline" className="uppercase">{d.agent}</Badge></p> : null}
          {d.title ? <p className="font-medium mt-1">{d.title}</p> : null}
          {d.summary ? <p className="text-muted-foreground mt-1">{d.summary}</p> : null}
        </div>
      );
    }

    case 'agent_output': {
      const content = ('content' in data ? data.content : null) || ('output' in data ? data.output : null);
      return (
        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-40">
          {String(content || JSON.stringify(data, null, 2))}
        </pre>
      );
    }

    case 'tool_call': {
      const d = data as Record<string, unknown>;
      const toolName = String(d.name || d.tool || 'unknown');
      const args = d.arguments;
      return (
        <div className="mt-2 p-2 bg-muted rounded text-sm font-mono">
          <span className="text-cyan-600">{toolName}</span>
          {args ? (
            <pre className="text-xs mt-1 text-muted-foreground">
              {typeof args === 'string' ? args : JSON.stringify(args, null, 2)}
            </pre>
          ) : null}
        </div>
      );
    }

    case 'tool_result': {
      const result = 'result' in data ? data.result : data;
      return (
        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-40">
          {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
        </pre>
      );
    }

    case 'error': {
      const errorMsg = ('message' in data ? data.message : null) || ('error' in data ? data.error : null);
      return (
        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-600">
          {String(errorMsg || JSON.stringify(data))}
        </div>
      );
    }

    case 'status_update': {
      const d = data as Record<string, string>;
      return (
        <div className="mt-2 p-2 bg-muted rounded text-sm">
          {d.phase ? <p>Phase: {d.phase}</p> : null}
          {d.health ? <p>Health: <Badge variant="outline">{d.health}</Badge></p> : null}
          {d.currentTask ? <p>Task: {d.currentTask}</p> : null}
        </div>
      );
    }

    default:
      if (Object.keys(data).length > 0) {
        return (
          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-40">
            {JSON.stringify(data, null, 2)}
          </pre>
        );
      }
      return null;
  }
}

export function EventTimeline({ events, isLive = false }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {isLive ? 'Waiting for events...' : 'No events recorded'}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

      {/* Events */}
      <div className="space-y-4">
        {events.map((event, index) => {
          const { color, icon } = getEventStyle(event.type);
          const isLast = index === events.length - 1;

          return (
            <div key={`${event.timestamp}-${index}`} className="relative pl-8">
              {/* Event dot */}
              <div
                className={`absolute left-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${color} text-white ${isLast && isLive ? 'animate-pulse' : ''}`}
              >
                {icon}
              </div>

              {/* Event content */}
              <div className="pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatEventType(event.type)}
                  </span>
                  <span className="text-xs text-muted-foreground" title={formatDate(event.timestamp)}>
                    {formatRelativeTime(event.timestamp)}
                  </span>
                </div>
                <EventContent event={event} />
              </div>
            </div>
          );
        })}

        {/* Live indicator */}
        {isLive && (
          <div className="relative pl-8">
            <div className="absolute left-1.5 w-4 h-4 rounded-full bg-blue-500 animate-ping opacity-75" />
            <div className="absolute left-1.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-[8px] text-white">●</span>
            </div>
            <span className="text-sm text-muted-foreground">Live</span>
          </div>
        )}
      </div>
    </div>
  );
}
