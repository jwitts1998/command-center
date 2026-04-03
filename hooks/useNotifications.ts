'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Notification } from '@/types/notification';

interface UseNotificationsOptions {
  interval?: number;
  autoFetch?: boolean;
}

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsResult {
  const { interval = 10000, autoFetch = true } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notificationsRes, countRes] = await Promise.all([
        fetch('/api/notifications?limit=20'),
        fetch('/api/notifications/count'),
      ]);

      if (!notificationsRes.ok || !countRes.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const [notificationsData, countData] = await Promise.all([
        notificationsRes.json(),
        countRes.json(),
      ]);

      if (notificationsData.success) {
        setNotifications(notificationsData.data);
      }

      if (countData.success) {
        setUnreadCount(countData.data.unread);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Optimistically update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, is_read: true, read_at: new Date() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Refresh to get correct state
      await fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Optimistically update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      // Refresh to get correct state
      await fetchNotifications();
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Remove from local state
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      // Refresh to get correct state
      await fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchNotifications();
  }, [fetchNotifications]);

  // Initial fetch and polling
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();

      if (interval > 0) {
        intervalRef.current = setInterval(fetchNotifications, interval);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoFetch, interval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  };
}
