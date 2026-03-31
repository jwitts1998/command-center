'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { ActiveSessions } from '@/components/live-ops/ActiveSessions';
import { CostBurnRate } from '@/components/live-ops/CostBurnRate';
import { ApprovalQueue } from '@/components/live-ops/ApprovalQueue';
import { AgentUtilization } from '@/components/live-ops/AgentUtilization';
import { RecentActivity } from '@/components/live-ops/RecentActivity';

function ComponentSkeleton({ height = 'h-48' }: { height?: string }) {
  return (
    <Card>
      <CardContent className={`${height} flex items-center justify-center`}>
        <div className="animate-pulse flex space-x-2">
          <div className="h-2 w-2 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="h-2 w-2 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="h-2 w-2 bg-muted-foreground/30 rounded-full animate-bounce" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Live Operations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time monitoring and control center
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/chat">
            <Button className="gap-2">
              <MessageSquare className="h-4 w-4" />
              New Task
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Link href="/chat">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-sm">Chat</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/goals">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </div>
                <span className="font-medium text-sm">Goals</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/tasks">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Zap className="h-4 w-4 text-blue-500" />
                </div>
                <span className="font-medium text-sm">Tasks</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/agents">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Zap className="h-4 w-4 text-green-500" />
                </div>
                <span className="font-medium text-sm">Agents</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Operations Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Active Sessions & Approvals */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<ComponentSkeleton height="h-64" />}>
            <ActiveSessions />
          </Suspense>

          <Suspense fallback={<ComponentSkeleton height="h-48" />}>
            <ApprovalQueue />
          </Suspense>
        </div>

        {/* Right Column - Utilization & Cost */}
        <div className="space-y-6">
          <Suspense fallback={<ComponentSkeleton height="h-48" />}>
            <AgentUtilization />
          </Suspense>

          <Suspense fallback={<ComponentSkeleton height="h-48" />}>
            <CostBurnRate />
          </Suspense>
        </div>
      </div>

      {/* Activity Feed - Full Width */}
      <Suspense fallback={<ComponentSkeleton height="h-64" />}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}
