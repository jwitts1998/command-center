'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useVoiceInput, useVoiceCommands, VoiceCommand } from '@/hooks/useVoiceInput';

interface VoiceCommandsProps {
  enabled?: boolean;
  showIndicator?: boolean;
  onCommand?: (command: string, args?: string) => void;
}

/**
 * Global voice commands component
 * Listens for voice commands and performs actions
 */
export function VoiceCommands({
  enabled = true,
  showIndicator = true,
  onCommand,
}: VoiceCommandsProps) {
  const router = useRouter();
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Define available voice commands
  const commands: VoiceCommand[] = [
    // Navigation commands
    {
      pattern: /^(go to |open |show )?dashboard$/i,
      handler: () => {
        setLastCommand('Opening dashboard');
        router.push('/');
        onCommand?.('navigate', 'dashboard');
      },
    },
    {
      pattern: /^(go to |open |show )?activity( feed)?$/i,
      handler: () => {
        setLastCommand('Opening activity feed');
        router.push('/activity');
        onCommand?.('navigate', 'activity');
      },
    },
    {
      pattern: /^(go to |open |show )?voice( input)?$/i,
      handler: () => {
        setLastCommand('Opening voice input');
        router.push('/voice');
        onCommand?.('navigate', 'voice');
      },
    },
    {
      pattern: /^(go to |open |show )?projects?$/i,
      handler: () => {
        setLastCommand('Opening projects');
        router.push('/projects');
        onCommand?.('navigate', 'projects');
      },
    },
    {
      pattern: /^(go to |open |show )?sessions?$/i,
      handler: () => {
        setLastCommand('Opening sessions');
        router.push('/sessions');
        onCommand?.('navigate', 'sessions');
      },
    },
    {
      pattern: /^(go to |open |show )?patterns?$/i,
      handler: () => {
        setLastCommand('Opening patterns');
        router.push('/patterns');
        onCommand?.('navigate', 'patterns');
      },
    },
    {
      pattern: /^(go to |open |show )?costs?( tracking)?$/i,
      handler: () => {
        setLastCommand('Opening costs');
        router.push('/costs');
        onCommand?.('navigate', 'costs');
      },
    },

    // Action commands
    {
      pattern: /^new (project|repo|repository)$/i,
      handler: () => {
        setLastCommand('Creating new project');
        router.push('/projects?action=create');
        onCommand?.('action', 'new-project');
      },
    },
    {
      pattern: /^refresh( page)?$/i,
      handler: () => {
        setLastCommand('Refreshing page');
        window.location.reload();
        onCommand?.('action', 'refresh');
      },
    },
    {
      pattern: /^go back$/i,
      handler: () => {
        setLastCommand('Going back');
        router.back();
        onCommand?.('action', 'back');
      },
    },

    // Help command
    {
      pattern: /^(show )?help( commands)?$/i,
      handler: () => {
        setLastCommand('Showing help');
        onCommand?.('help', undefined);
      },
    },
  ];

  const { processCommand } = useVoiceCommands(commands);

  const handleResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (isFinal) {
        const wasCommand = processCommand(transcript);
        if (!wasCommand) {
          setLastCommand(null);
        }
      }
    },
    [processCommand]
  );

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
  } = useVoiceInput({
    continuous: true,
    interimResults: false,
    onResult: handleResult,
  });

  // Toggle voice commands with keyboard shortcut (Ctrl+Shift+V)
  useEffect(() => {
    if (!enabled || !isSupported) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        if (isListening) {
          stopListening();
          setIsActive(false);
        } else {
          startListening();
          setIsActive(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, isSupported, isListening, startListening, stopListening]);

  // Clear last command after delay
  useEffect(() => {
    if (lastCommand) {
      const timer = setTimeout(() => setLastCommand(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastCommand]);

  if (!enabled || !isSupported || !showIndicator) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Active indicator */}
      {isActive && (
        <div className="flex items-center gap-2 bg-background border rounded-lg shadow-lg p-2 mb-2">
          <Badge
            variant="outline"
            className={`${isListening ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-gray-500/10 text-gray-600 border-gray-500/20'}`}
          >
            {isListening ? '● Listening' : '○ Paused'}
          </Badge>
          {lastCommand && (
            <span className="text-sm text-muted-foreground">{lastCommand}</span>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => {
          if (isActive) {
            stopListening();
            setIsActive(false);
          } else {
            startListening();
            setIsActive(true);
          }
        }}
        className={`
          w-12 h-12 rounded-full shadow-lg transition-all
          flex items-center justify-center
          ${isActive
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }
        `}
        title="Toggle voice commands (Ctrl+Shift+V)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6"
        >
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Voice commands help card
 */
export function VoiceCommandsHelp() {
  const commandGroups = [
    {
      title: 'Navigation',
      commands: [
        { phrase: '"Go to dashboard"', action: 'Opens the main dashboard' },
        { phrase: '"Open activity"', action: 'Opens the activity feed' },
        { phrase: '"Show voice"', action: 'Opens voice input page' },
        { phrase: '"Go to projects"', action: 'Opens projects list' },
        { phrase: '"Open sessions"', action: 'Opens enrichment sessions' },
        { phrase: '"Show patterns"', action: 'Opens learned patterns' },
        { phrase: '"Go to costs"', action: 'Opens cost tracking' },
      ],
    },
    {
      title: 'Actions',
      commands: [
        { phrase: '"New project"', action: 'Creates a new project' },
        { phrase: '"Refresh"', action: 'Refreshes the current page' },
        { phrase: '"Go back"', action: 'Goes to previous page' },
      ],
    },
    {
      title: 'Help',
      commands: [
        { phrase: '"Show help"', action: 'Shows this help' },
      ],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Commands</CardTitle>
        <CardDescription>
          Say these commands while voice listening is active (Ctrl+Shift+V to toggle)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {commandGroups.map((group) => (
          <div key={group.title}>
            <h4 className="font-medium mb-2">{group.title}</h4>
            <div className="space-y-1">
              {group.commands.map((cmd) => (
                <div key={cmd.phrase} className="flex items-center gap-4 text-sm">
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {cmd.phrase}
                  </code>
                  <span className="text-muted-foreground">{cmd.action}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
