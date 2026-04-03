'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AgentWizardData } from '@/types/agent';
import { X, Plus } from 'lucide-react';

interface CapabilitiesStepProps {
  data: Partial<AgentWizardData>;
  onChange: (data: Partial<AgentWizardData>) => void;
}

const SUGGESTED_CAPABILITIES = [
  'code_execution',
  'code_review',
  'testing',
  'deployment',
  'debugging',
  'file_operations',
  'documentation',
  'planning',
  'design',
  'architecture',
  'security_analysis',
  'performance_optimization',
  'task_management',
  'delegation',
  'ci_cd',
  'monitoring',
  'database',
  'api_development',
];

const SUGGESTED_SPECIALIZATIONS = [
  'software_engineering',
  'system_design',
  'technical_leadership',
  'quality_assurance',
  'devops',
  'cloud_engineering',
  'security',
  'frontend',
  'backend',
  'fullstack',
  'mobile',
  'data_engineering',
  'machine_learning',
  'project_management',
];

export function CapabilitiesStep({ data, onChange }: CapabilitiesStepProps) {
  const [capabilityInput, setCapabilityInput] = useState('');
  const [specializationInput, setSpecializationInput] = useState('');

  const capabilities = data.capabilities || [];
  const specializations = data.specializations || [];

  const addCapability = (cap: string) => {
    const normalized = cap.toLowerCase().replace(/\s+/g, '_');
    if (normalized && !capabilities.includes(normalized)) {
      onChange({ capabilities: [...capabilities, normalized] });
    }
    setCapabilityInput('');
  };

  const removeCapability = (cap: string) => {
    onChange({ capabilities: capabilities.filter(c => c !== cap) });
  };

  const addSpecialization = (spec: string) => {
    const normalized = spec.toLowerCase().replace(/\s+/g, '_');
    if (normalized && !specializations.includes(normalized)) {
      onChange({ specializations: [...specializations, normalized] });
    }
    setSpecializationInput('');
  };

  const removeSpecialization = (spec: string) => {
    onChange({ specializations: specializations.filter(s => s !== spec) });
  };

  const availableCapabilities = SUGGESTED_CAPABILITIES.filter(
    cap => !capabilities.includes(cap)
  );

  const availableSpecializations = SUGGESTED_SPECIALIZATIONS.filter(
    spec => !specializations.includes(spec)
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Capabilities & Specializations</h3>
        <p className="text-sm text-muted-foreground">
          Define what this agent can do and its areas of expertise
        </p>
      </div>

      {/* Capabilities */}
      <div className="space-y-4">
        <Label>Capabilities</Label>
        <p className="text-xs text-muted-foreground">
          Actions and tasks this agent can perform
        </p>

        {/* Selected capabilities */}
        <div className="flex flex-wrap gap-2 min-h-10 p-3 border rounded-lg bg-muted/30">
          {capabilities.length === 0 ? (
            <span className="text-sm text-muted-foreground">
              No capabilities selected
            </span>
          ) : (
            capabilities.map(cap => (
              <Badge
                key={cap}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {cap.replace(/_/g, ' ')}
                <button
                  type="button"
                  onClick={() => removeCapability(cap)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>

        {/* Add custom capability */}
        <div className="flex gap-2">
          <Input
            placeholder="Add custom capability..."
            value={capabilityInput}
            onChange={(e) => setCapabilityInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCapability(capabilityInput);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => addCapability(capabilityInput)}
            disabled={!capabilityInput}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggested capabilities */}
        {availableCapabilities.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Suggested:</p>
            <div className="flex flex-wrap gap-1.5">
              {availableCapabilities.map(cap => (
                <Badge
                  key={cap}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => addCapability(cap)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {cap.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Specializations */}
      <div className="space-y-4">
        <Label>Specializations</Label>
        <p className="text-xs text-muted-foreground">
          Areas of deep expertise and focus
        </p>

        {/* Selected specializations */}
        <div className="flex flex-wrap gap-2 min-h-10 p-3 border rounded-lg bg-muted/30">
          {specializations.length === 0 ? (
            <span className="text-sm text-muted-foreground">
              No specializations selected
            </span>
          ) : (
            specializations.map(spec => (
              <Badge
                key={spec}
                variant="default"
                className="flex items-center gap-1"
              >
                {spec.replace(/_/g, ' ')}
                <button
                  type="button"
                  onClick={() => removeSpecialization(spec)}
                  className="ml-1 hover:opacity-70"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>

        {/* Add custom specialization */}
        <div className="flex gap-2">
          <Input
            placeholder="Add custom specialization..."
            value={specializationInput}
            onChange={(e) => setSpecializationInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSpecialization(specializationInput);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => addSpecialization(specializationInput)}
            disabled={!specializationInput}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggested specializations */}
        {availableSpecializations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Suggested:</p>
            <div className="flex flex-wrap gap-1.5">
              {availableSpecializations.map(spec => (
                <Badge
                  key={spec}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => addSpecialization(spec)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {spec.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
