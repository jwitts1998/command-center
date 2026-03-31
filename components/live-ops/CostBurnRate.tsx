'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CostData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  monthlyBudget: number;
  hourlyRate: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

export function CostBurnRate() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        const res = await fetch('/api/costs/summary');
        if (res.ok) {
          const costData = await res.json();
          setData(costData);
        } else {
          // Mock data for demo
          setData({
            today: 12.47,
            thisWeek: 67.23,
            thisMonth: 234.89,
            monthlyBudget: 500,
            hourlyRate: 1.56,
            trend: 'up',
            trendPercent: 12,
          });
        }
      } catch {
        // Mock data for demo
        setData({
          today: 12.47,
          thisWeek: 67.23,
          thisMonth: 234.89,
          monthlyBudget: 500,
          hourlyRate: 1.56,
          trend: 'up',
          trendPercent: 12,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCosts();
    const interval = setInterval(fetchCosts, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Cost Burn Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  const budgetPercent = (data.thisMonth / data.monthlyBudget) * 100;
  const isOverBudget = budgetPercent > 100;
  const isWarning = budgetPercent > 80;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Cost Burn Rate
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              data.trend === 'up' && 'text-red-600 border-red-500/20 bg-red-500/10',
              data.trend === 'down' && 'text-green-600 border-green-500/20 bg-green-500/10',
              data.trend === 'stable' && 'text-muted-foreground'
            )}
          >
            {data.trend === 'up' ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : data.trend === 'down' ? (
              <TrendingDown className="h-3 w-3 mr-1" />
            ) : null}
            {data.trendPercent}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Rate */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">${data.hourlyRate.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">per hour (avg)</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">${data.today.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">today</div>
          </div>
        </div>

        {/* Monthly Budget Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monthly Budget</span>
            <span className={cn('font-medium', isWarning && 'text-yellow-600', isOverBudget && 'text-red-600')}>
              ${data.thisMonth.toFixed(2)} / ${data.monthlyBudget.toFixed(0)}
            </span>
          </div>
          <Progress
            value={Math.min(budgetPercent, 100)}
            className={cn(
              'h-2',
              isOverBudget && '[&>div]:bg-red-500',
              isWarning && !isOverBudget && '[&>div]:bg-yellow-500'
            )}
          />
          {isWarning && (
            <div className={cn(
              'flex items-center gap-1 text-xs',
              isOverBudget ? 'text-red-600' : 'text-yellow-600'
            )}>
              <AlertTriangle className="h-3 w-3" />
              {isOverBudget
                ? `Over budget by $${(data.thisMonth - data.monthlyBudget).toFixed(2)}`
                : `${(100 - budgetPercent).toFixed(0)}% remaining`}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div>
            <div className="text-sm font-medium">${data.thisWeek.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">This week</div>
          </div>
          <div>
            <div className="text-sm font-medium">${data.thisMonth.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">This month</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
