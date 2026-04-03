'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WizardProgress } from './WizardProgress';
import { AgentTemplateSelector } from './AgentTemplateSelector';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { CapabilitiesStep } from './steps/CapabilitiesStep';
import { AdapterConfigStep } from './steps/AdapterConfigStep';
import { BudgetLimitsStep } from './steps/BudgetLimitsStep';
import { SystemPromptStep } from './steps/SystemPromptStep';
import type { Agent, AgentTemplate, AgentWizardData } from '@/types/agent';
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';

interface AgentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editAgent?: Agent;
  onSuccess?: (agent: Agent) => void;
}

const STEPS = [
  { title: 'Basic Info', description: 'Name and role' },
  { title: 'Capabilities', description: 'Skills and expertise' },
  { title: 'Adapter', description: 'AI provider' },
  { title: 'Budget', description: 'Limits and monitoring' },
  { title: 'System Prompt', description: 'Behavior configuration' },
];

const initialFormData: Partial<AgentWizardData> = {
  slug: '',
  name: '',
  description: '',
  role: 'worker',
  capabilities: [],
  specializations: [],
  adapter_type: 'claude',
  adapter_config: {},
  monthly_budget_usd: null,
  heartbeat_mode: 'on_demand',
  heartbeat_interval_seconds: 300,
  system_prompt_path: '',
};

export function AgentWizard({
  open,
  onOpenChange,
  editAgent,
  onSuccess,
}: AgentWizardProps) {
  const [showTemplates, setShowTemplates] = useState(!editAgent);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<AgentWizardData>>(
    editAgent
      ? {
          slug: editAgent.slug,
          name: editAgent.name,
          description: editAgent.description || '',
          role: editAgent.role,
          capabilities: editAgent.capabilities || [],
          specializations: editAgent.specializations || [],
          adapter_type: editAgent.adapter_type,
          adapter_config: editAgent.adapter_config || {},
          monthly_budget_usd: editAgent.monthly_budget_usd,
          heartbeat_mode: editAgent.heartbeat_mode,
          heartbeat_interval_seconds: editAgent.heartbeat_interval_seconds,
          system_prompt_path: editAgent.system_prompt_path || '',
        }
      : initialFormData
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editAgent;

  const handleTemplateSelect = (template: AgentTemplate) => {
    setFormData({
      ...initialFormData,
      slug: template.id,
      name: template.name,
      description: template.description,
      role: template.role,
      capabilities: template.capabilities,
      specializations: template.specializations,
      adapter_type: template.adapter_type,
      heartbeat_mode: template.heartbeat_mode,
      monthly_budget_usd: template.suggested_budget || null,
    });
    setShowTemplates(false);
  };

  const handleSkipTemplates = () => {
    setFormData(initialFormData);
    setShowTemplates(false);
  };

  const handleFormChange = useCallback((updates: Partial<AgentWizardData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    const clearedErrors = { ...errors };
    Object.keys(updates).forEach(key => {
      delete clearedErrors[key];
    });
    setErrors(clearedErrors);
  }, [errors]);

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!formData.slug?.trim()) {
        newErrors.slug = 'Slug is required';
      } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
        newErrors.slug = 'Slug must be lowercase alphanumeric with hyphens';
      }
      if (!formData.name?.trim()) {
        newErrors.name = 'Name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        slug: formData.slug,
        name: formData.name,
        description: formData.description || undefined,
        role: formData.role,
        capabilities: formData.capabilities,
        specializations: formData.specializations,
        adapter_type: formData.adapter_type,
        adapter_config: formData.adapter_config,
        heartbeat_mode: formData.heartbeat_mode,
        heartbeat_interval_seconds: formData.heartbeat_interval_seconds,
        monthly_budget_usd: formData.monthly_budget_usd,
        system_prompt_path: formData.system_prompt_path || undefined,
      };

      const url = isEditMode ? `/api/agents/${editAgent.id}` : '/api/agents';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.(data.data);
        handleClose();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving agent:', error);
      alert('Failed to save agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowTemplates(!editAgent);
    setCurrentStep(0);
    setFormData(editAgent ? formData : initialFormData);
    setErrors({});
    onOpenChange(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            data={formData}
            onChange={handleFormChange}
            errors={errors}
          />
        );
      case 1:
        return <CapabilitiesStep data={formData} onChange={handleFormChange} />;
      case 2:
        return <AdapterConfigStep data={formData} onChange={handleFormChange} />;
      case 3:
        return <BudgetLimitsStep data={formData} onChange={handleFormChange} />;
      case 4:
        return <SystemPromptStep data={formData} onChange={handleFormChange} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {isEditMode ? 'Edit Agent' : 'Create New Agent'}
          </DialogTitle>
          <DialogDescription>
            {showTemplates
              ? 'Choose a template or start from scratch'
              : `Step ${currentStep + 1} of ${STEPS.length}: ${STEPS[currentStep].title}`}
          </DialogDescription>
        </DialogHeader>

        {showTemplates ? (
          <AgentTemplateSelector
            onSelect={handleTemplateSelect}
            onSkip={handleSkipTemplates}
          />
        ) : (
          <div className="space-y-6">
            {/* Progress Indicator */}
            <WizardProgress currentStep={currentStep} steps={STEPS} />

            {/* Step Content */}
            <div className="min-h-[400px]">{renderStepContent()}</div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              <div className="flex items-center gap-2">
                {!isEditMode && currentStep === 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowTemplates(true)}
                  >
                    Back to Templates
                  </Button>
                )}

                {currentStep === STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isEditMode ? 'Saving...' : 'Creating...'}
                      </>
                    ) : (
                      <>{isEditMode ? 'Save Changes' : 'Create Agent'}</>
                    )}
                  </Button>
                ) : (
                  <Button type="button" onClick={handleNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
