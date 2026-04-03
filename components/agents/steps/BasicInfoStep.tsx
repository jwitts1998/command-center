'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AgentRole, AgentWizardData } from '@/types/agent';

interface BasicInfoStepProps {
  data: Partial<AgentWizardData>;
  onChange: (data: Partial<AgentWizardData>) => void;
  errors?: Record<string, string>;
}

export function BasicInfoStep({ data, onChange, errors }: BasicInfoStepProps) {
  const handleSlugChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    onChange({ slug: sanitized });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <p className="text-sm text-muted-foreground">
          Set up the agent's identity and role in your organization
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="slug">
            Slug <span className="text-destructive">*</span>
          </Label>
          <Input
            id="slug"
            placeholder="my-agent"
            value={data.slug || ''}
            onChange={(e) => handleSlugChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Unique identifier (lowercase, hyphens allowed)
          </p>
          {errors?.slug && (
            <p className="text-xs text-destructive">{errors.slug}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="My Agent"
            value={data.name || ''}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Display name for the agent
          </p>
          {errors?.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="What does this agent do? What are its responsibilities?"
          value={data.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Brief description of the agent's purpose and responsibilities
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">
          Role <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.role || 'worker'}
          onValueChange={(value) => onChange({ role: value as AgentRole })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="executive">
              <div>
                <div className="font-medium">Executive</div>
                <div className="text-xs text-muted-foreground">
                  Strategic decisions, high-level planning
                </div>
              </div>
            </SelectItem>
            <SelectItem value="specialist">
              <div>
                <div className="font-medium">Specialist</div>
                <div className="text-xs text-muted-foreground">
                  Deep expertise in specific domains
                </div>
              </div>
            </SelectItem>
            <SelectItem value="worker">
              <div>
                <div className="font-medium">Worker</div>
                <div className="text-xs text-muted-foreground">
                  Executes tasks and implements solutions
                </div>
              </div>
            </SelectItem>
            <SelectItem value="coordinator">
              <div>
                <div className="font-medium">Coordinator</div>
                <div className="text-xs text-muted-foreground">
                  Manages workflows and delegation
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Determines the agent's place in the organizational hierarchy
        </p>
      </div>
    </div>
  );
}
