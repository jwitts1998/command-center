'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { Widget, WidgetAction } from '@/types/widget';
import { DOMAIN_WIDGET_MAPPINGS, buildFetchUrl } from '@/lib/a2ui/WidgetRegistry';

// Import domain card components
import { AgentCard } from '@/components/AgentCard';
import { TaskCard } from '@/components/TaskCard';
import { GoalCard } from '@/components/GoalCard';
import { ApprovalCard } from '@/components/ApprovalCard';
import { TeamCard } from '@/components/TeamCard';
import { RunCard } from '@/components/RunCard';
import { EventTimeline } from '@/components/EventTimeline';
import { StatusBadge } from '@/components/StatusBadge';

// Import UI components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ChatWidgetRendererProps {
  widget: Widget;
  onAction?: (action: WidgetAction, widgetId: string) => void;
  compact?: boolean;
}

export function ChatWidgetRenderer({
  widget,
  onAction,
  compact = false,
}: ChatWidgetRendererProps) {
  const handleAction = useCallback(
    (action: WidgetAction) => {
      if (onAction) {
        onAction(action, widget.id);
      }
    },
    [onAction, widget.id]
  );

  // Render based on widget type
  switch (widget.type) {
    case 'text':
      return <TextWidget widget={widget} />;

    case 'markdown':
      return <MarkdownWidget widget={widget} />;

    case 'card':
      return (
        <CardWidget widget={widget} onAction={handleAction}>
          {widget.children?.map((child) => (
            <ChatWidgetRenderer
              key={child.id}
              widget={child}
              onAction={onAction}
              compact={compact}
            />
          ))}
        </CardWidget>
      );

    case 'list':
      return <ListWidget widget={widget} onAction={handleAction} />;

    case 'table':
      return <TableWidget widget={widget} onAction={handleAction} />;

    case 'progress':
      return <ProgressWidget widget={widget} />;

    case 'stat':
      return <StatWidget widget={widget} />;

    case 'badge':
      return <BadgeWidget widget={widget} />;

    case 'form':
      return <FormWidget widget={widget} onAction={handleAction} />;

    case 'action_group':
      return <ActionGroupWidget widget={widget} onAction={handleAction} />;

    case 'confirmation':
      return <ConfirmationWidget widget={widget} onAction={handleAction} />;

    // Domain widgets - need to fetch data
    case 'agent_card':
      return <DomainAgentCard widget={widget} compact={compact} onAction={handleAction} />;

    case 'task_card':
      return <DomainTaskCard widget={widget} compact={compact} onAction={handleAction} />;

    case 'goal_card':
      return <DomainGoalCard widget={widget} compact={compact} onAction={handleAction} />;

    case 'approval_card':
      return <DomainApprovalCard widget={widget} compact={compact} onAction={handleAction} />;

    case 'team_card':
      return <DomainTeamCard widget={widget} compact={compact} onAction={handleAction} />;

    case 'timeline':
      return <TimelineWidget widget={widget} />;

    case 'row':
      return (
        <div className="flex flex-row gap-2 flex-wrap">
          {widget.children?.map((child) => (
            <ChatWidgetRenderer
              key={child.id}
              widget={child}
              onAction={onAction}
              compact={compact}
            />
          ))}
        </div>
      );

    case 'column':
      return (
        <div className="flex flex-col gap-2">
          {widget.children?.map((child) => (
            <ChatWidgetRenderer
              key={child.id}
              widget={child}
              onAction={onAction}
              compact={compact}
            />
          ))}
        </div>
      );

    case 'grid':
      return (
        <div className={`grid gap-4 ${(widget.props.columns as number) === 2 ? 'grid-cols-2' : (widget.props.columns as number) === 3 ? 'grid-cols-3' : 'grid-cols-1'}`}>
          {widget.children?.map((child) => (
            <ChatWidgetRenderer
              key={child.id}
              widget={child}
              onAction={onAction}
              compact={compact}
            />
          ))}
        </div>
      );

    default:
      return (
        <div className="p-2 bg-muted rounded text-sm text-muted-foreground">
          Unknown widget type: {widget.type}
        </div>
      );
  }
}

// Text widget
function TextWidget({ widget }: { widget: Widget }) {
  const { content, variant = 'body', size = 'md' } = widget.props as {
    content: string;
    variant?: string;
    size?: string;
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const variantClasses = {
    body: '',
    heading: 'font-semibold',
    caption: 'text-muted-foreground',
    label: 'font-medium text-sm',
  };

  return (
    <p className={`${sizeClasses[size as keyof typeof sizeClasses] || ''} ${variantClasses[variant as keyof typeof variantClasses] || ''}`}>
      {content}
    </p>
  );
}

// Markdown widget
function MarkdownWidget({ widget }: { widget: Widget }) {
  const { content } = widget.props as { content: string };

  // Simple markdown parsing
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{
        __html: content
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded">$1</code>')
          .replace(/\n/g, '<br />'),
      }}
    />
  );
}

// Card widget
function CardWidget({
  widget,
  onAction,
  children,
}: {
  widget: Widget;
  onAction: (action: WidgetAction) => void;
  children?: React.ReactNode;
}) {
  const { title, description, footer } = widget.props as {
    title?: string;
    description?: string;
    footer?: string;
  };

  return (
    <Card className={widget.style?.className}>
      {(title || description) && (
        <CardHeader className="pb-2">
          {title && <CardTitle className="text-lg">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="space-y-2">
        {children}
        {footer && (
          <div className="text-xs text-muted-foreground pt-2 border-t">{footer}</div>
        )}
        {widget.actions && widget.actions.length > 0 && (
          <div className="flex gap-2 pt-2">
            {widget.actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant === 'destructive' ? 'destructive' : action.variant === 'ghost' ? 'ghost' : action.variant === 'secondary' ? 'secondary' : 'default'}
                size="sm"
                onClick={() => onAction(action)}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// List widget
function ListWidget({
  widget,
  onAction,
}: {
  widget: Widget;
  onAction: (action: WidgetAction) => void;
}) {
  const { items, variant = 'simple', ordered = false } = widget.props as {
    items: Array<{ id: string; primary: string; secondary?: string }>;
    variant?: string;
    ordered?: boolean;
  };

  const ListTag = ordered ? 'ol' : 'ul';

  return (
    <ListTag className={`space-y-1 ${ordered ? 'list-decimal' : 'list-disc'} list-inside`}>
      {items.map((item) => (
        <li key={item.id} className="text-sm">
          <span className="font-medium">{item.primary}</span>
          {item.secondary && (
            <span className="text-muted-foreground ml-2">{item.secondary}</span>
          )}
        </li>
      ))}
    </ListTag>
  );
}

// Table widget
function TableWidget({
  widget,
  onAction,
}: {
  widget: Widget;
  onAction: (action: WidgetAction) => void;
}) {
  const { columns, rows } = widget.props as {
    columns: Array<{ key: string; header: string }>;
    rows: Array<{ id: string; cells: Record<string, unknown> }>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {columns.map((col) => (
              <th key={col.key} className="text-left py-2 px-3 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              {columns.map((col) => (
                <td key={col.key} className="py-2 px-3">
                  {String(row.cells[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Progress widget
function ProgressWidget({ widget }: { widget: Widget }) {
  const { value, max = 100, label, showValue = true } = widget.props as {
    value: number;
    max?: number;
    label?: string;
    showValue?: boolean;
  };

  const percentage = (value / max) * 100;

  return (
    <div className="space-y-1">
      {(label || showValue) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {label && <span>{label}</span>}
          {showValue && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      <Progress value={percentage} />
    </div>
  );
}

// Stat widget
function StatWidget({ widget }: { widget: Widget }) {
  const { label, value, change, icon } = widget.props as {
    label: string;
    value: string | number;
    change?: { value: number; direction: string };
    icon?: string;
  };

  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <div className={`text-xs ${change.direction === 'up' ? 'text-green-600' : change.direction === 'down' ? 'text-red-600' : ''}`}>
          {change.direction === 'up' ? '↑' : change.direction === 'down' ? '↓' : ''} {change.value}%
        </div>
      )}
    </div>
  );
}

// Badge widget
function BadgeWidget({ widget }: { widget: Widget }) {
  const { label, variant = 'default' } = widget.props as {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };

  return <Badge variant={variant}>{label}</Badge>;
}

// Form widget
function FormWidget({
  widget,
  onAction,
}: {
  widget: Widget;
  onAction: (action: WidgetAction) => void;
}) {
  const { fields, submitLabel = 'Submit', cancelLabel = 'Cancel' } = widget.props as {
    fields: Array<{
      name: string;
      label: string;
      type: string;
      placeholder?: string;
      required?: boolean;
      options?: Array<{ value: string; label: string }>;
    }>;
    submitLabel?: string;
    cancelLabel?: string;
  };

  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitAction = widget.actions?.find((a) => a.actionType === 'submit_form');
    if (submitAction) {
      onAction({
        ...submitAction,
        payload: { ...submitAction.payload, formData },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.type === 'textarea' ? (
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              value={(formData[field.name] as string) || ''}
              onChange={(e) => setFormData((d) => ({ ...d, [field.name]: e.target.value }))}
              required={field.required}
            />
          ) : field.type === 'select' ? (
            <Select
              value={(formData[field.name] as string) || ''}
              onValueChange={(v) => setFormData((d) => ({ ...d, [field.name]: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={(formData[field.name] as string) || ''}
              onChange={(e) => setFormData((d) => ({ ...d, [field.name]: e.target.value }))}
              required={field.required}
            />
          )}
        </div>
      ))}
      <div className="flex gap-2 justify-end">
        {cancelLabel && (
          <Button type="button" variant="outline" onClick={() => setFormData({})}>
            {cancelLabel}
          </Button>
        )}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

// Action group widget
function ActionGroupWidget({
  widget,
  onAction,
}: {
  widget: Widget;
  onAction: (action: WidgetAction) => void;
}) {
  const { layout = 'horizontal', align = 'start' } = widget.props as {
    layout?: string;
    align?: string;
  };

  const alignClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
  };

  return (
    <div className={`flex ${layout === 'vertical' ? 'flex-col' : 'flex-row'} gap-2 ${alignClasses[align as keyof typeof alignClasses] || ''}`}>
      {widget.actions?.map((action) => (
        <Button
          key={action.id}
          variant={action.variant === 'destructive' ? 'destructive' : action.variant === 'ghost' ? 'ghost' : action.variant === 'secondary' ? 'secondary' : 'default'}
          size="sm"
          onClick={() => onAction(action)}
          disabled={action.disabled}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

// Confirmation widget
function ConfirmationWidget({
  widget,
  onAction,
}: {
  widget: Widget;
  onAction: (action: WidgetAction) => void;
}) {
  const { title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'info' } = widget.props as {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: string;
  };

  const variantStyles = {
    info: 'border-blue-500/30 bg-blue-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    danger: 'border-red-500/30 bg-red-500/5',
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${variantStyles[variant as keyof typeof variantStyles] || variantStyles.info}`}>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <div className="flex gap-2 justify-end">
        {widget.actions?.map((action) => (
          <Button
            key={action.id}
            variant={action.variant === 'destructive' ? 'destructive' : action.variant === 'ghost' ? 'ghost' : 'default'}
            size="sm"
            onClick={() => onAction(action)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Timeline widget
function TimelineWidget({ widget }: { widget: Widget }) {
  const { events, isLive } = widget.props as {
    events: Array<{ type: string; timestamp: string; data?: Record<string, unknown> }>;
    isLive?: boolean;
  };

  return <EventTimeline events={events || []} isLive={isLive} />;
}

// Domain card wrappers that fetch data
function useFetchedData(widget: Widget) {
  const [data, setData] = useState<unknown>(widget.props.data);
  const [loading, setLoading] = useState(!widget.props.data);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If data is already provided, don't fetch
    if (widget.props.data) {
      setData(widget.props.data);
      setLoading(false);
      return;
    }

    const fetchUrl = buildFetchUrl(widget);
    if (!fetchUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(fetchUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [widget]);

  return { data, loading, error };
}

function DomainAgentCard({
  widget,
  compact,
  onAction,
}: {
  widget: Widget;
  compact: boolean;
  onAction: (action: WidgetAction) => void;
}) {
  const { data, loading, error } = useFetchedData(widget);

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  if (error) return <div className="text-red-500 text-sm">{error}</div>;
  if (!data) return null;

  return <AgentCard agent={data as any} />;
}

function DomainTaskCard({
  widget,
  compact,
  onAction,
}: {
  widget: Widget;
  compact: boolean;
  onAction: (action: WidgetAction) => void;
}) {
  const { data, loading, error } = useFetchedData(widget);

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  if (error) return <div className="text-red-500 text-sm">{error}</div>;
  if (!data) return null;

  return <TaskCard task={data as any} compact={compact} />;
}

function DomainGoalCard({
  widget,
  compact,
  onAction,
}: {
  widget: Widget;
  compact: boolean;
  onAction: (action: WidgetAction) => void;
}) {
  const { data, loading, error } = useFetchedData(widget);

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  if (error) return <div className="text-red-500 text-sm">{error}</div>;
  if (!data) return null;

  return <GoalCard goal={data as any} />;
}

function DomainApprovalCard({
  widget,
  compact,
  onAction,
}: {
  widget: Widget;
  compact: boolean;
  onAction: (action: WidgetAction) => void;
}) {
  const { data, loading, error } = useFetchedData(widget);

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  if (error) return <div className="text-red-500 text-sm">{error}</div>;
  if (!data) return null;

  const handleApprove = () => {
    const action = widget.actions?.find((a) => a.actionType === 'approve');
    if (action) onAction(action);
  };

  const handleReject = () => {
    const action = widget.actions?.find((a) => a.actionType === 'reject');
    if (action) onAction(action);
  };

  return (
    <ApprovalCard
      approval={data as any}
      onApprove={widget.actions?.some((a) => a.actionType === 'approve') ? handleApprove : undefined}
      onReject={widget.actions?.some((a) => a.actionType === 'reject') ? handleReject : undefined}
    />
  );
}

function DomainTeamCard({
  widget,
  compact,
  onAction,
}: {
  widget: Widget;
  compact: boolean;
  onAction: (action: WidgetAction) => void;
}) {
  const { data, loading, error } = useFetchedData(widget);

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  if (error) return <div className="text-red-500 text-sm">{error}</div>;
  if (!data) return null;

  return <TeamCard team={data as any} />;
}

export default ChatWidgetRenderer;
