'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface WizardProgressProps {
  currentStep: number;
  steps: { title: string; description: string }[];
}

export function WizardProgress({ currentStep, steps }: WizardProgressProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className={cn(
              'relative flex-1',
              index !== steps.length - 1 && 'pr-8 sm:pr-20'
            )}
          >
            {/* Connector line */}
            {index !== steps.length - 1 && (
              <div
                className="absolute top-4 left-7 -right-2 h-0.5 bg-muted"
                aria-hidden="true"
              >
                <div
                  className={cn(
                    'h-full bg-primary transition-all duration-300',
                    index < currentStep ? 'w-full' : 'w-0'
                  )}
                />
              </div>
            )}

            <div className="relative flex items-start group">
              <span className="flex h-9 items-center" aria-hidden="true">
                <span
                  className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                    index < currentStep
                      ? 'bg-primary border-primary'
                      : index === currentStep
                        ? 'border-primary bg-background'
                        : 'border-muted bg-background'
                  )}
                >
                  {index < currentStep ? (
                    <Check className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <span
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        index === currentStep ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  )}
                </span>
              </span>
              <span className="ml-3 min-w-0 hidden sm:flex sm:flex-col">
                <span
                  className={cn(
                    'text-sm font-medium',
                    index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {step.description}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
