'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EnrichedPromptDisplayProps {
  originalPrompt: string;
  enrichedPrompt: string;
  contextApplied?: string[];
  patternsApplied?: string[];
  estimatedCost?: { min_usd: number; max_usd: number };
  suggestedAgents?: string[];
  onExecute?: () => void;
  onEdit?: () => void;
  onCopy?: () => void;
  isExecuting?: boolean;
}

export function EnrichedPromptDisplay({
  originalPrompt,
  enrichedPrompt,
  contextApplied = [],
  patternsApplied = [],
  estimatedCost,
  suggestedAgents = [],
  onExecute,
  onEdit,
  onCopy,
  isExecuting = false,
}: EnrichedPromptDisplayProps) {
  const [showDiff, setShowDiff] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(enrichedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Enriched Prompt
              <Badge variant="default" className="bg-green-600">Ready</Badge>
            </CardTitle>
            <CardDescription>
              Your prompt has been enriched with project context
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDiff(!showDiff)}
          >
            {showDiff ? 'Hide Original' : 'Show Original'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Original vs Enriched */}
        {showDiff && (
          <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
            <p className="text-xs text-muted-foreground mb-1">Original Prompt</p>
            <p className="text-sm">{originalPrompt}</p>
          </div>
        )}

        {/* Enriched Prompt */}
        <div className="p-4 bg-accent/30 rounded-lg border">
          <p className="text-xs text-muted-foreground mb-2">Enriched Prompt</p>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm font-mono bg-background p-3 rounded border overflow-x-auto">
              {enrichedPrompt}
            </pre>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Context Applied */}
          {contextApplied.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Context Applied</p>
              <div className="flex flex-wrap gap-1">
                {contextApplied.map((ctx, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {ctx}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Patterns Applied */}
          {patternsApplied.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Patterns Applied</p>
              <div className="flex flex-wrap gap-1">
                {patternsApplied.map((pattern, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {pattern}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Agents */}
          {suggestedAgents.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Suggested Agents</p>
              <div className="flex flex-wrap gap-1">
                {suggestedAgents.map((agent, idx) => (
                  <Badge key={idx} variant="default" className="text-xs">
                    {agent}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Estimated Cost */}
          {estimatedCost && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Estimated Cost</p>
              <p className="text-sm font-medium">
                ${estimatedCost.min_usd.toFixed(2)} - ${estimatedCost.max_usd.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
        </div>
        {onExecute && (
          <Button onClick={onExecute} disabled={isExecuting}>
            {isExecuting ? 'Executing...' : 'Execute with Agent'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
