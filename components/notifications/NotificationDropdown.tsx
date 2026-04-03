'use client';

import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { NotificationItem } from './NotificationItem';
import type { Notification } from '@/types/notification';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

export function NotificationDropdown({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClose,
}: NotificationDropdownProps) {
  const router = useRouter();

  const handleNotificationClick = (notification: Notification) => {
    const actionUrl = notification.metadata?.action_url as string | undefined;
    if (actionUrl) {
      router.push(actionUrl);
      onClose?.();
    }
  };

  const handleViewAll = () => {
    router.push('/notifications');
    onClose?.();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="w-80 md:w-96">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onMarkAllAsRead}
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-[400px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Bell className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              No notifications yet
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              You'll see alerts here when something important happens
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                onClick={handleNotificationClick}
                compact
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={handleViewAll}
        >
          View all notifications
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
