'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Target,
  MessageSquare,
  ChevronRight,
  Bot,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'task_completed' | 'task_started' | 'task_failed' | 'goal_created' | 'message_received' | 'agent_action';
  title: string;
  description?: string;
  agent?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const activityConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  task_completed: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-500',
  },
  task_started: {
    icon: <Zap className="h-4 w-4" />,
    color: 'text-blue-500',
  },
  task_failed: {
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-500',
  },
  goal_created: {
    icon: <Target className="h-4 w-4" />,
    color: 'text-purple-500',
  },
  message_received: {
    icon: <MessageSquare className="h-4 w-4" />,
    color: 'text-cyan-500',
  },
  agent_action: {
    icon: <Bot className="h-4 w-4" />,
    color: 'text-orange-500',
  },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const hours = Math.floor(diffMins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch('/api/activity?limit=8');
        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities || []);
        } else {
          // Mock data for demo
          const now = new Date();
          setActivities([
            {
              id: '1',
              type: 'task_completed',
              title: 'Dark mode toggle added',
              agent: 'CTO',
              timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
            },
            {
              id: '2',
              type: 'task_started',
              title: 'Implementing user profile page',
              agent: 'CTO',
              timestamp: new Date(now.getTime() - 12 * 60000).toISOString(),
            },
            {
              id: '3',
              type: 'goal_created',
              title: 'Q2 Marketing Campaign',
              timestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
            },
            {
              id: '4',
              type: 'message_received',
              title: 'New request: Add analytics dashboard',
              timestamp: new Date(now.getTime() - 90 * 60000).toISOString(),
            },
            {
              id: '5',
              type: 'task_completed',
              title: 'API documentation updated',
              agent: 'CTO',
              timestamp: new Date(now.getTime() - 150 * 60000).toISOString(),
            },
          ]);
        }
      } catch {
        // Mock data on error
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
          <Link href="/activity">
            <Button variant="ghost" size="sm" className="text-xs">
              View All
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Loading...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity, index) => {
              const config = activityConfig[activity.type] || {
                icon: <Clock className="h-4 w-4" />,
                color: 'text-muted-foreground',
              };

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 py-2 group"
                >
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className={cn('p-1 rounded', config.color)}>
                      {config.icon}
                    </div>
                    {index < activities.length - 1 && (
                      <div className="w-px h-full bg-border mt-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {activity.title}
                      </span>
                      {activity.agent && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {activity.agent}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
