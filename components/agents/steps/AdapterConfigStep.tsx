'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AdapterType, AgentWizardData } from '@/types/agent';
import { Bot, Sparkles, Settings2 } from 'lucide-react';

interface AdapterConfigStepProps {
  data: Partial<AgentWizardData>;
  onChange: (data: Partial<AgentWizardData>) => void;
}

const adapters: {
  type: AdapterType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  configFields: { key: string; label: string; placeholder: string; type: string }[];
}[] = [
  {
    type: 'claude',
    name: 'Claude',
    description: 'Anthropic Claude API - Recommended for most use cases',
    icon: Sparkles,
    configFields: [
      { key: 'model', label: 'Model', placeholder: 'claude-sonnet-4-20250514', type: 'text' },
      { key: 'max_tokens', label: 'Max Tokens', placeholder: '4096', type: 'number' },
    ],
  },
  {
    type: 'openai',
    name: 'OpenAI',
    description: 'OpenAI GPT models via API',
    icon: Bot,
    configFields: [
      { key: 'model', label: 'Model', placeholder: 'gpt-4-turbo-preview', type: 'text' },
      { key: 'max_tokens', label: 'Max Tokens', placeholder: '4096', type: 'number' },
      { key: 'temperature', label: 'Temperature', placeholder: '0.7', type: 'number' },
    ],
  },
  {
    type: 'custom',
    name: 'Custom',
    description: 'Custom adapter for specialized integrations',
    icon: Settings2,
    configFields: [
      { key: 'endpoint', label: 'API Endpoint', placeholder: 'https://api.example.com', type: 'text' },
      { key: 'api_key_env', label: 'API Key Env Var', placeholder: 'CUSTOM_API_KEY', type: 'text' },
    ],
  },
];

export function AdapterConfigStep({ data, onChange }: AdapterConfigStepProps) {
  const selectedAdapter = adapters.find(a => a.type === data.adapter_type) || adapters[0];
  const adapterConfig = data.adapter_config || {};

  const handleAdapterChange = (type: AdapterType) => {
    onChange({
      adapter_type: type,
      adapter_config: {},
    });
  };

  const handleConfigChange = (key: string, value: string) => {
    onChange({
      adapter_config: {
        ...adapterConfig,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Adapter Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Choose the AI provider and configure connection settings
        </p>
      </div>

      {/* Adapter Selection */}
      <div className="grid gap-4 md:grid-cols-3">
        {adapters.map((adapter) => {
          const Icon = adapter.icon;
          const isSelected = data.adapter_type === adapter.type;

          return (
            <Card
              key={adapter.type}
              className={cn(
                'cursor-pointer transition-all',
                isSelected
                  ? 'border-primary ring-1 ring-primary'
                  : 'hover:border-primary/50'
              )}
              onClick={() => handleAdapterChange(adapter.type)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{adapter.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  {adapter.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Fields */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-medium">
          {selectedAdapter.name} Configuration
        </h4>

        <div className="grid gap-4 md:grid-cols-2">
          {selectedAdapter.configFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type={field.type}
                placeholder={field.placeholder}
                value={(adapterConfig[field.key] as string) || ''}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          These settings can be modified later in the agent's configuration.
        </p>
      </div>
    </div>
  );
}
