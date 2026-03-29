'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VoiceInput } from '@/components/VoiceInput';
import { VoiceCommandsHelp } from '@/components/VoiceCommands';

interface SubmissionResult {
  success: boolean;
  runId?: string;
  triage?: {
    lane: string;
    agent: string;
    title: string;
    summary: string;
  };
  error?: string;
}

export default function VoicePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionResult[]>([]);

  const handleSubmit = async (transcript: string) => {
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/api/inbox/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const submissionResult: SubmissionResult = {
          success: true,
          runId: data.runId,
          triage: data.triage,
        };
        setResult(submissionResult);
        setRecentSubmissions((prev) => [submissionResult, ...prev.slice(0, 4)]);
      } else {
        setResult({
          success: false,
          error: data.error || 'Failed to submit',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voice Input</h1>
          <p className="text-muted-foreground">
            Speak your requests to dispatch work to C-Suite agents
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Web Speech API
        </Badge>
      </div>

      {/* Voice Input Card */}
      <VoiceInput
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        title="New Request"
        description="Speak or type your request. It will be triaged and dispatched to the appropriate agent."
        placeholder="Example: 'Add a dark mode toggle to the settings page' or 'Review our Q1 marketing strategy'"
      />

      {/* Result Display */}
      {result && (
        <Card className={result.success ? 'border-green-500/50' : 'border-red-500/50'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <span className="text-green-600">✓</span>
                  Request Submitted
                </>
              ) : (
                <>
                  <span className="text-red-600">✗</span>
                  Submission Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success && result.triage ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="uppercase">
                    {result.triage.agent}
                  </Badge>
                  <Badge variant="secondary">{result.triage.lane}</Badge>
                </div>
                <div>
                  <p className="font-medium">{result.triage.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.triage.summary}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/activity/${result.runId}`)}
                  >
                    View Run
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push('/activity')}
                  >
                    Activity Feed
                  </Button>
                </div>
              </div>
            ) : result.error ? (
              <p className="text-red-600">{result.error}</p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Recent Submissions */}
      {recentSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>
              Your recent voice requests this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSubmissions.map((submission, index) => (
                <div
                  key={`${submission.runId}-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="uppercase text-xs">
                      {submission.triage?.agent || 'N/A'}
                    </Badge>
                    <span className="text-sm">
                      {submission.triage?.title || 'Unknown'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/activity/${submission.runId}`)}
                  >
                    View →
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice Commands */}
      <VoiceCommandsHelp />

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Voice Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Be specific:</strong> "Add a logout button to the user profile page" works better than "add logout"</p>
          <p>• <strong>Include context:</strong> Mention the project or feature area when relevant</p>
          <p>• <strong>State the goal:</strong> Describe what you want to achieve, not just the steps</p>
          <p>• <strong>Speak clearly:</strong> Pause briefly between sentences for better recognition</p>
        </CardContent>
      </Card>

      {/* Wispr Flow Integration Note */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Wispr Flow Integration
            <Badge variant="secondary">Coming Soon</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            When Wispr Flow releases their public API, voice input will work seamlessly
            with your existing Wispr Flow setup. In the meantime, you can use the
            browser's built-in voice recognition above.
          </p>
          <p className="mt-2">
            Alternatively, if Wispr Flow can output to a text file, you can configure
            the file watcher to automatically ingest transcripts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
