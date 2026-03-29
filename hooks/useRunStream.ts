'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface RunEvent {
  type: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface UseRunStreamOptions {
  runId: string;
  onEvent?: (event: RunEvent) => void;
  onError?: (error: Error) => void;
  autoConnect?: boolean;
}

export interface UseRunStreamResult {
  events: RunEvent[];
  isConnected: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
}

export function useRunStream({
  runId,
  onEvent,
  onError,
  autoConnect = true,
}: UseRunStreamOptions): UseRunStreamResult {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/runs/${runId}/stream`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (e) => {
      try {
        const event: RunEvent = JSON.parse(e.data);
        setEvents((prev) => [...prev, event]);
        onEvent?.(event);
      } catch (err) {
        console.error('Failed to parse event:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      const err = new Error('Connection to event stream lost');
      setError(err);
      onError?.(err);
      eventSource.close();
    };
  }, [runId, onEvent, onError]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    events,
    isConnected,
    error,
    connect,
    disconnect,
  };
}

/**
 * Hook to poll for runs list (used when SSE isn't available for list)
 */
export interface UseRunsPollingOptions {
  interval?: number;
  enabled?: boolean;
}

export interface Run {
  runId: string;
  state: 'queued' | 'running' | 'completed' | 'failed' | 'pending_confirmation';
  phase?: string;
  agent?: string;
  title?: string;
  summary?: string;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
}

export function useRunsPolling({
  interval = 5000,
  enabled = true,
}: UseRunsPollingOptions = {}): {
  runs: Run[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [runs, setRuns] = useState<Run[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRuns = useCallback(async () => {
    try {
      const response = await fetch('/api/runs');
      if (!response.ok) {
        throw new Error('Failed to fetch runs');
      }
      const data = await response.json();
      setRuns(data.runs || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    fetchRuns();
    const intervalId = setInterval(fetchRuns, interval);

    return () => clearInterval(intervalId);
  }, [enabled, interval, fetchRuns]);

  return {
    runs,
    isLoading,
    error,
    refresh: fetchRuns,
  };
}
