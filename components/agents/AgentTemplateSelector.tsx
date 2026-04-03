'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AGENT_TEMPLATES, type AgentTemplate } from '@/types/agent';
import {
  Code2,
  SearchCode,
  Layers,
  GitBranch,
  TestTube,
  Cloud,
  Bot,
  ArrowRight,
} from 'lucide-react';

interface AgentTemplateSelectorProps {
  onSelect: (template: AgentTemplate) => void;
  onSkip: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  code: Code2,
  'search-code': SearchCode,
  layers: Layers,
  'git-branch': GitBranch,
  'test-tube': TestTube,
  cloud: Cloud,
};

export function AgentTemplateSelector({ onSelect, onSkip }: AgentTemplateSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Choose a Template</h3>
        <p className="text-sm text-muted-foreground">
          Start with a pre-configured agent template or create from scratch
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AGENT_TEMPLATES.map((template) => {
          const Icon = iconMap[template.icon || ''] || Bot;

          return (
            <Card
              key={template.id}
              className="cursor-pointer hover:border-primary/50 transition-colors group"
              onClick={() => onSelect(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {template.role}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-3">{template.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {template.capabilities.slice(0, 3).map((cap) => (
                    <Badge key={cap} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {cap.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                  {template.capabilities.length > 3 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      +{template.capabilities.length - 3}
                    </Badge>
                  )}
                </div>
                {template.suggested_budget && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Suggested budget: ${template.suggested_budget}/mo
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
          Start from scratch
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
