'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { HeartbeatMode, AgentWizardData } from '@/types/agent';
import { DollarSign, Activity, Clock } from 'lucide-react';

interface BudgetLimitsStepProps {
  data: Partial<AgentWizardData>;
  onChange: (data: Partial<AgentWizardData>) => void;
}

export function BudgetLimitsStep({ data, onChange }: BudgetLimitsStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Budget & Limits</h3>
        <p className="text-sm text-muted-foreground">
          Set spending limits and operational parameters
        </p>
      </div>

      {/* Budget Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-base">Monthly Budget</CardTitle>
              <CardDescription className="text-xs">
                Maximum spend allowed per month
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="budget">Budget (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                placeholder="100.00"
                className="pl-7"
                value={data.monthly_budget_usd || ''}
                onChange={(e) =>
                  onChange({
                    monthly_budget_usd: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty for unlimited budget. Alerts will be sent at 80% usage.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Heartbeat Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-base">Heartbeat Mode</CardTitle>
              <CardDescription className="text-xs">
                How the agent reports its health status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heartbeat_mode">Mode</Label>
            <Select
              value={data.heartbeat_mode || 'on_demand'}
              onValueChange={(value) => onChange({ heartbeat_mode: value as HeartbeatMode })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on_demand">
                  <div className="flex flex-col">
                    <span>On Demand</span>
                    <span className="text-xs text-muted-foreground">
                      Only when tasks are active
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="continuous">
                  <div className="flex flex-col">
                    <span>Continuous</span>
                    <span className="text-xs text-muted-foreground">
                      Always running and monitoring
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="scheduled">
                  <div className="flex flex-col">
                    <span>Scheduled</span>
                    <span className="text-xs text-muted-foreground">
                      Runs at specific intervals
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(data.heartbeat_mode === 'continuous' || data.heartbeat_mode === 'scheduled') && (
            <div className="space-y-2">
              <Label htmlFor="interval">Heartbeat Interval</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="interval"
                  type="number"
                  min="60"
                  step="30"
                  placeholder="300"
                  value={data.heartbeat_interval_seconds || 300}
                  onChange={(e) =>
                    onChange({
                      heartbeat_interval_seconds: parseInt(e.target.value, 10) || 300,
                    })
                  }
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">seconds</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 60 seconds. Default is 300 seconds (5 minutes).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="rounded-lg bg-muted/50 p-4 space-y-2">
        <h4 className="text-sm font-medium">Configuration Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">Monthly Budget:</div>
          <div>
            {data.monthly_budget_usd
              ? `$${data.monthly_budget_usd.toFixed(2)}`
              : 'Unlimited'}
          </div>
          <div className="text-muted-foreground">Heartbeat Mode:</div>
          <div className="capitalize">{(data.heartbeat_mode || 'on_demand').replace(/_/g, ' ')}</div>
          {(data.heartbeat_mode === 'continuous' || data.heartbeat_mode === 'scheduled') && (
            <>
              <div className="text-muted-foreground">Check Interval:</div>
              <div>{data.heartbeat_interval_seconds || 300}s</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
