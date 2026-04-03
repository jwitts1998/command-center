'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { useNotifications } from '@/hooks/useNotifications';
import {
  Bell,
  CheckCheck,
  Inbox,
  AlertTriangle,
  CheckSquare,
  Bot,
  DollarSign,
  Target,
  Filter,
} from 'lucide-react';
import type { Notification, NotificationType } from '@/types/notification';

const typeFilters: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <Inbox className="h-4 w-4" /> },
  { value: 'approval_required', label: 'Approvals', icon: <AlertTriangle className="h-4 w-4" /> },
  { value: 'task_assigned', label: 'Tasks', icon: <CheckSquare className="h-4 w-4" /> },
  { value: 'agent_status_change', label: 'Agents', icon: <Bot className="h-4 w-4" /> },
  { value: 'budget_alert', label: 'Budget', icon: <DollarSign className="h-4 w-4" /> },
  { value: 'goal_completed', label: 'Goals', icon: <Target className="h-4 w-4" /> },
];

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({ interval: 10000 });

  const handleNotificationClick = (notification: Notification) => {
    const actionUrl = notification.metadata?.action_url as string | undefined;
    if (actionUrl) {
      router.push(actionUrl);
    }
  };

  const filterNotifications = (type: string): Notification[] => {
    if (type === 'all') return notifications;
    return notifications.filter(n => n.type === type);
  };

  const unreadByType = (type: string): number => {
    const filtered = filterNotifications(type);
    return filtered.filter(n => !n.is_read).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on important events and actions
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Inbox className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Required</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.type === 'approval_required' && !n.is_read).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List with Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <TabsList>
            {typeFilters.map(filter => (
              <TabsTrigger
                key={filter.value}
                value={filter.value}
                className="flex items-center gap-1.5"
              >
                {filter.icon}
                <span className="hidden sm:inline">{filter.label}</span>
                {unreadByType(filter.value) > 0 && (
                  <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                    {unreadByType(filter.value)}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {typeFilters.map(filter => (
          <TabsContent key={filter.value} value={filter.value} className="space-y-2">
            {filterNotifications(filter.value).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">
                    No {filter.value === 'all' ? '' : filter.label.toLowerCase()} notifications
                  </p>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    {filter.value === 'all'
                      ? "You're all caught up! Notifications will appear here when something important happens."
                      : `You don't have any ${filter.label.toLowerCase()} notifications at the moment.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-2">
                  <div className="divide-y">
                    {filterNotifications(filter.value).map(notification => (
                      <div key={notification.id} className="py-1">
                        <NotificationItem
                          notification={notification}
                          onMarkAsRead={markAsRead}
                          onDelete={deleteNotification}
                          onClick={handleNotificationClick}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
