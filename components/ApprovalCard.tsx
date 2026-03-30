'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatRelativeTime, formatCurrency } from '@/lib/utils';
import type { ApprovalRequest, RiskAssessment } from '@/types/approval';
import { AlertTriangle, CheckCircle2, XCircle, Clock, DollarSign, Shield } from 'lucide-react';

interface ApprovalCardProps {
  approval: ApprovalRequest;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  showActions?: boolean;
}

const riskColors: Record<string, string> = {
  low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  critical: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

const riskIcons: Record<string, React.ReactNode> = {
  low: <Shield className="h-3 w-3" />,
  medium: <AlertTriangle className="h-3 w-3" />,
  high: <AlertTriangle className="h-3 w-3" />,
  critical: <AlertTriangle className="h-3 w-3" />,
};

export function ApprovalCard({
  approval,
  onApprove,
  onReject,
  showActions = true,
}: ApprovalCardProps) {
  const isPending = approval.status === 'pending';
  const riskLevel = approval.risk_assessment?.risk_level || 'medium';

  return (
    <Card className={isPending ? 'border-yellow-500/50' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg truncate">
                {approval.operation_type.replace(/_/g, ' ')}
              </CardTitle>
              <StatusBadge status={approval.status} />
            </div>
            <CardDescription className="line-clamp-2">
              {approval.operation_details.description}
            </CardDescription>
          </div>
          {approval.risk_assessment && (
            <Badge
              variant="outline"
              className={`capitalize flex-shrink-0 ${riskColors[riskLevel]}`}
            >
              {riskIcons[riskLevel]}
              <span className="ml-1">{riskLevel} risk</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(approval.requested_at)}
          </span>
          {approval.operation_details.estimated_cost_usd && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(approval.operation_details.estimated_cost_usd)}
            </span>
          )}
          {approval.operation_details.reversible !== undefined && (
            <Badge variant={approval.operation_details.reversible ? 'secondary' : 'destructive'} className="text-[10px]">
              {approval.operation_details.reversible ? 'Reversible' : 'Irreversible'}
            </Badge>
          )}
        </div>

        {approval.operation_details.affected_resources && approval.operation_details.affected_resources.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Affected Resources:</p>
            <div className="flex flex-wrap gap-1">
              {approval.operation_details.affected_resources.slice(0, 5).map((resource) => (
                <Badge key={resource} variant="outline" className="text-[10px]">
                  {resource}
                </Badge>
              ))}
              {approval.operation_details.affected_resources.length > 5 && (
                <Badge variant="outline" className="text-[10px]">
                  +{approval.operation_details.affected_resources.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {approval.risk_assessment?.risk_factors && approval.risk_assessment.risk_factors.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Risk Factors:</p>
            <ul className="text-xs space-y-0.5">
              {approval.risk_assessment.risk_factors.map((factor, i) => (
                <li key={i} className="text-muted-foreground">• {factor}</li>
              ))}
            </ul>
          </div>
        )}

        {approval.decided_at && (
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <span>
              {approval.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
              {approval.decided_by || 'Unknown'} on {formatDate(approval.decided_at)}
            </span>
            {approval.decision_reason && (
              <p className="mt-1 italic">&quot;{approval.decision_reason}&quot;</p>
            )}
          </div>
        )}

        {isPending && showActions && (onApprove || onReject) && (
          <div className="flex gap-2 pt-2">
            {onApprove && (
              <Button
                size="sm"
                onClick={() => onApprove(approval.id)}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </Button>
            )}
            {onReject && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(approval.id)}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
