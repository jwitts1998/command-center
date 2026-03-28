'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface QuestionOption {
  value: string;
  label: string;
  description: string;
  isRecommended?: boolean;
}

interface ClarificationQuestion {
  id: string;
  question: string;
  header: string;
  options: QuestionOption[];
  recommended?: string;
  reasoning?: string;
}

interface ClarificationDialogProps {
  questions: ClarificationQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  userPrompt?: string;
}

export function ClarificationDialog({
  questions,
  onSubmit,
  onCancel,
  isLoading = false,
  userPrompt,
}: ClarificationDialogProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    // Pre-select recommended options
    const initial: Record<string, string> = {};
    questions.forEach((q) => {
      if (q.recommended) {
        initial[q.id] = q.recommended;
      }
    });
    return initial;
  });

  const handleOptionSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const allAnswered = questions.every((q) => answers[q.id]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Clarification Needed</CardTitle>
            <CardDescription>
              Please answer these questions to help enrich your prompt
            </CardDescription>
          </div>
          <Badge variant="secondary">{questions.length} questions</Badge>
        </div>
        {userPrompt && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <Label className="text-xs text-muted-foreground">Original Prompt</Label>
            <p className="text-sm font-medium mt-1">{userPrompt}</p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {question.header}
              </Badge>
              <span className="text-sm font-medium">{question.question}</span>
            </div>

            <div className="grid gap-2">
              {question.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(question.id, option.value)}
                  className={cn(
                    'flex flex-col items-start p-3 rounded-lg border text-left transition-all',
                    'hover:border-primary/50 hover:bg-accent/50',
                    answers[question.id] === option.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border'
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                        answers[question.id] === option.value
                          ? 'border-primary'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {answers[question.id] === option.value && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="font-medium text-sm">{option.label}</span>
                    {option.isRecommended && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>

            {question.reasoning && answers[question.id] === question.recommended && (
              <p className="text-xs text-muted-foreground ml-6 italic">
                {question.reasoning}
              </p>
            )}

            {index < questions.length - 1 && <hr className="mt-4" />}
          </div>
        ))}
      </CardContent>

      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!allAnswered || isLoading}
          className={cn(!onCancel && 'ml-auto')}
        >
          {isLoading ? 'Enriching...' : 'Enrich Prompt'}
        </Button>
      </CardFooter>
    </Card>
  );
}
