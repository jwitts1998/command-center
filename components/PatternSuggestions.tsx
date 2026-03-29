'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SuggestedPattern } from '@/types/clarification';

interface PatternSuggestionsProps {
  patterns: SuggestedPattern[];
  onAccept?: (patternId: string) => void;
  onReject?: (patternId: string) => void;
  onAcceptAll?: () => void;
  onDismiss?: () => void;
}

export function PatternSuggestions({
  patterns,
  onAccept,
  onReject,
  onAcceptAll,
  onDismiss,
}: PatternSuggestionsProps) {
  const [responding, setResponding] = useState<Record<string, boolean>>({});
  const [responded, setResponded] = useState<Record<string, 'accepted' | 'rejected'>>({});

  if (patterns.length === 0) {
    return null;
  }

  const activePatterns = patterns.filter(p => !responded[p.patternId]);

  if (activePatterns.length === 0) {
    return null;
  }

  async function handleRespond(patternId: string, accepted: boolean) {
    setResponding(prev => ({ ...prev, [patternId]: true }));

    try {
      const response = await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond',
          patternId,
          accepted,
        }),
      });

      if (response.ok) {
        setResponded(prev => ({ ...prev, [patternId]: accepted ? 'accepted' : 'rejected' }));
        if (accepted) {
          onAccept?.(patternId);
        } else {
          onReject?.(patternId);
        }
      }
    } catch (error) {
      console.error('Error responding to pattern:', error);
    } finally {
      setResponding(prev => ({ ...prev, [patternId]: false }));
    }
  }

  async function handleAcceptAll() {
    for (const pattern of activePatterns) {
      await handleRespond(pattern.patternId, true);
    }
    onAcceptAll?.();
  }

  function getTypeColor(type: string): string {
    switch (type) {
      case 'clarification_preference':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'tech_stack':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'architecture':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'code_style':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'workflow':
        return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'low':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  }

  return (
    <Card className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 text-blue-600"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                  clipRule="evenodd"
                />
              </svg>
              Pattern Suggestions
            </CardTitle>
            <CardDescription>
              {activePatterns.length} pattern{activePatterns.length !== 1 ? 's' : ''} may be relevant to this task
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {activePatterns.length > 1 && (
              <Button size="sm" variant="outline" onClick={handleAcceptAll}>
                Accept All
              </Button>
            )}
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {activePatterns.map((pattern) => (
          <div
            key={pattern.patternId}
            className="p-3 rounded-lg border bg-background"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{pattern.patternName}</span>
                  <Badge className={`text-xs ${getTypeColor(pattern.patternType)}`}>
                    {pattern.patternType.replace('_', ' ')}
                  </Badge>
                  <Badge className={`text-xs ${getPriorityColor(pattern.priority)}`}>
                    {pattern.priority} priority
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(pattern.relevance * 100)}% relevant
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {pattern.suggestion}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRespond(pattern.patternId, false)}
                  disabled={responding[pattern.patternId]}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Skip
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRespond(pattern.patternId, true)}
                  disabled={responding[pattern.patternId]}
                >
                  {responding[pattern.patternId] ? 'Applying...' : 'Apply'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Compact notification version for toast-style display
 */
export function PatternSuggestionNotification({
  count,
  onClick,
}: {
  count: number;
  onClick?: () => void;
}) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-5 h-5"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-sm font-medium">
        {count} pattern{count !== 1 ? 's' : ''} suggested
      </span>
    </button>
  );
}
