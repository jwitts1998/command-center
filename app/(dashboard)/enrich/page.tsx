'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClarificationDialog } from '@/components/ClarificationDialog';
import { EnrichedPromptDisplay } from '@/components/EnrichedPromptDisplay';
import { PatternSuggestions } from '@/components/PatternSuggestions';
import type { Project } from '@/types/project';
import type { SuggestedPattern } from '@/types/clarification';

type EnrichmentState = 'input' | 'clarifying' | 'enriched' | 'loading';

interface ClarificationQuestion {
  id: string;
  question: string;
  header: string;
  options: {
    value: string;
    label: string;
    description: string;
    isRecommended?: boolean;
  }[];
  recommended?: string;
  reasoning?: string;
}

interface EnrichmentResult {
  enriched_prompt: string;
  context_applied: string[];
  patterns_applied: string[];
  estimated_cost?: { min_usd: number; max_usd: number };
  suggested_agents?: string[];
  suggested_patterns?: SuggestedPattern[];
}

export default function EnrichPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [userPrompt, setUserPrompt] = useState('');
  const [state, setState] = useState<EnrichmentState>('input');
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [enrichmentResult, setEnrichmentResult] = useState<EnrichmentResult | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
        if (data.data.length > 0) {
          setSelectedProjectId(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }

  async function handleEnrich() {
    if (!selectedProjectId || !userPrompt.trim()) {
      setError('Please select a project and enter a prompt');
      return;
    }

    setError('');
    setState('loading');

    try {
      const response = await fetch('/api/enrich-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProjectId,
          user_prompt: userPrompt,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to enrich prompt');
      }

      if (data.needs_clarification) {
        setQuestions(data.questions);
        setSessionId(data.session_id);
        setState('clarifying');
      } else {
        setEnrichmentResult({
          enriched_prompt: data.enriched_prompt,
          context_applied: data.context_applied || [],
          patterns_applied: data.patterns_applied || [],
          estimated_cost: data.estimated_cost,
          suggested_agents: data.suggested_agents || [],
          suggested_patterns: data.suggested_patterns || [],
        });
        setState('enriched');
      }
    } catch (error) {
      console.error('Error enriching prompt:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setState('input');
    }
  }

  async function handleSubmitAnswers(answers: Record<string, string>) {
    setState('loading');

    try {
      const response = await fetch('/api/clarifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          answers,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit answers');
      }

      setEnrichmentResult({
        enriched_prompt: data.data.enriched_prompt,
        context_applied: data.data.context_applied || [],
        patterns_applied: data.data.patterns_applied || [],
        estimated_cost: data.data.estimated_cost,
        suggested_agents: data.data.suggested_agents || [],
        suggested_patterns: data.data.suggested_patterns || [],
      });
      setState('enriched');
    } catch (error) {
      console.error('Error submitting answers:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setState('clarifying');
    }
  }

  function handleReset() {
    setUserPrompt('');
    setState('input');
    setQuestions([]);
    setSessionId('');
    setEnrichmentResult(null);
    setError('');
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prompt Enrichment</h1>
        <p className="text-muted-foreground">
          Transform bare prompts into detailed, context-rich instructions
        </p>
      </div>

      {/* Input State */}
      {state === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle>Enter Your Prompt</CardTitle>
            <CardDescription>
              Start with a simple prompt - we'll help you clarify and enrich it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Input
                id="prompt"
                placeholder="e.g., Add dark mode, Implement authentication, Fix the bug..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEnrich()}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button onClick={handleEnrich} className="w-full">
              Enrich Prompt
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {state === 'loading' && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
              <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
              <p className="text-muted-foreground mt-4">Analyzing your prompt...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clarification State */}
      {state === 'clarifying' && (
        <div className="space-y-4">
          <ClarificationDialog
            questions={questions}
            onSubmit={handleSubmitAnswers}
            onCancel={handleReset}
            userPrompt={userPrompt}
          />
        </div>
      )}

      {/* Enriched State */}
      {state === 'enriched' && enrichmentResult && (
        <div className="space-y-4">
          {/* Pattern Suggestions */}
          {enrichmentResult.suggested_patterns && enrichmentResult.suggested_patterns.length > 0 && (
            <PatternSuggestions
              patterns={enrichmentResult.suggested_patterns}
              onAccept={(patternId) => {
                console.log('Pattern accepted:', patternId);
              }}
              onReject={(patternId) => {
                console.log('Pattern rejected:', patternId);
              }}
            />
          )}

          <EnrichedPromptDisplay
            originalPrompt={userPrompt}
            enrichedPrompt={enrichmentResult.enriched_prompt}
            contextApplied={enrichmentResult.context_applied}
            patternsApplied={enrichmentResult.patterns_applied}
            estimatedCost={enrichmentResult.estimated_cost}
            suggestedAgents={enrichmentResult.suggested_agents}
          />
          <Button variant="outline" onClick={handleReset} className="w-full">
            Start Over
          </Button>
        </div>
      )}
    </div>
  );
}
