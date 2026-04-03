'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AgentWizardData } from '@/types/agent';
import { FileText, Eye, Bot } from 'lucide-react';

interface SystemPromptStepProps {
  data: Partial<AgentWizardData>;
  onChange: (data: Partial<AgentWizardData>) => void;
}

export function SystemPromptStep({ data, onChange }: SystemPromptStepProps) {
  const generatePreview = () => {
    const parts: string[] = [];

    parts.push(`You are ${data.name || 'an AI agent'}.`);

    if (data.description) {
      parts.push(data.description);
    }

    if (data.role) {
      parts.push(`\nYour role: ${data.role}`);
    }

    if (data.capabilities && data.capabilities.length > 0) {
      parts.push(`\nYour capabilities include: ${data.capabilities.join(', ')}.`);
    }

    if (data.specializations && data.specializations.length > 0) {
      parts.push(`\nYour areas of expertise: ${data.specializations.join(', ')}.`);
    }

    parts.push('\nAlways be helpful, accurate, and professional.');

    return parts.join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">System Prompt</h3>
        <p className="text-sm text-muted-foreground">
          Configure the agent's system prompt that defines its behavior
        </p>
      </div>

      {/* System Prompt Path */}
      <div className="space-y-2">
        <Label htmlFor="prompt_path">System Prompt File Path</Label>
        <Input
          id="prompt_path"
          placeholder="c-suite/system-prompts/my-agent.system.md"
          value={data.system_prompt_path || ''}
          onChange={(e) => onChange({ system_prompt_path: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Path to a markdown file containing the system prompt. Leave empty to use auto-generated prompt.
        </p>
      </div>

      {/* Preview Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Eye className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-base">Auto-Generated Preview</CardTitle>
                <CardDescription className="text-xs">
                  Based on your configuration
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline">Preview</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/50 p-4 font-mono text-sm whitespace-pre-wrap">
            {generatePreview()}
          </div>
        </CardContent>
      </Card>

      {/* Agent Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Agent Summary</CardTitle>
              <CardDescription className="text-xs">
                Review your agent configuration
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Slug</p>
              <p className="text-sm font-medium">{data.slug || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="text-sm font-medium">{data.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-medium capitalize">{data.role || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Adapter</p>
              <p className="text-sm font-medium capitalize">{data.adapter_type || 'claude'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-sm font-medium">
                {data.monthly_budget_usd ? `$${data.monthly_budget_usd}/mo` : 'Unlimited'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Heartbeat</p>
              <p className="text-sm font-medium capitalize">
                {(data.heartbeat_mode || 'on_demand').replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {data.capabilities && data.capabilities.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Capabilities</p>
              <div className="flex flex-wrap gap-1">
                {data.capabilities.map(cap => (
                  <Badge key={cap} variant="secondary" className="text-xs">
                    {cap.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.specializations && data.specializations.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Specializations</p>
              <div className="flex flex-wrap gap-1">
                {data.specializations.map(spec => (
                  <Badge key={spec} variant="default" className="text-xs">
                    {spec.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
