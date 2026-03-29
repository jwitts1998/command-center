'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface VoiceInputProps {
  onSubmit: (transcript: string) => void;
  isSubmitting?: boolean;
  placeholder?: string;
  title?: string;
  description?: string;
}

export function VoiceInput({
  onSubmit,
  isSubmitting = false,
  placeholder = 'Click the microphone to start speaking, or type your request...',
  title = 'Voice Input',
  description = 'Speak or type your request',
}: VoiceInputProps) {
  const [manualInput, setManualInput] = useState('');

  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({
    continuous: true,
    interimResults: true,
  });

  const handleSubmit = useCallback(() => {
    const text = transcript || manualInput;
    if (text.trim()) {
      onSubmit(text.trim());
      resetTranscript();
      setManualInput('');
    }
  }, [transcript, manualInput, onSubmit, resetTranscript]);

  const handleToggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  }, [isListening, startListening, stopListening, resetTranscript]);

  const displayText = transcript + interimTranscript || manualInput;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isListening && (
              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 animate-pulse">
                ● Recording
              </Badge>
            )}
            {!isSupported && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                Voice not supported
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Visualization */}
        <div className="flex items-center justify-center py-4">
          <button
            onClick={handleToggleListening}
            disabled={!isSupported || isSubmitting}
            className={`
              relative w-20 h-20 rounded-full transition-all duration-300
              flex items-center justify-center
              ${isListening
                ? 'bg-red-500 hover:bg-red-600 scale-110'
                : 'bg-primary hover:bg-primary/90'
              }
              ${!isSupported || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {/* Pulse animation when recording */}
            {isListening && (
              <>
                <span className="absolute w-full h-full rounded-full bg-red-500 animate-ping opacity-30" />
                <span className="absolute w-[130%] h-[130%] rounded-full bg-red-500/20 animate-pulse" />
              </>
            )}

            {/* Microphone icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8 text-white relative z-10"
            >
              {isListening ? (
                // Stop icon
                <path d="M6 6h12v12H6z" />
              ) : (
                // Microphone icon
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
              )}
            </svg>
          </button>
        </div>

        {/* Transcript/Input Area */}
        <div className="relative">
          <Textarea
            value={transcript ? displayText : manualInput}
            onChange={(e) => {
              if (!transcript) {
                setManualInput(e.target.value);
              }
            }}
            placeholder={placeholder}
            className={`min-h-[120px] resize-none ${transcript ? 'bg-muted/50' : ''}`}
            disabled={isListening || isSubmitting}
          />
          {interimTranscript && (
            <div className="absolute bottom-2 left-2 right-2">
              <span className="text-sm text-muted-foreground italic">
                {interimTranscript}
              </span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(transcript || manualInput) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetTranscript();
                  setManualInput('');
                }}
                disabled={isSubmitting}
              >
                Clear
              </Button>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={(!transcript && !manualInput.trim()) || isSubmitting || isListening}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground text-center">
          {isSupported
            ? 'Click the microphone to start recording. Click again to stop.'
            : 'Your browser does not support voice input. Please type your request.'}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Compact voice input button for use in other components
 */
interface VoiceButtonProps {
  onTranscript: (transcript: string) => void;
  className?: string;
}

export function VoiceButton({ onTranscript, className = '' }: VoiceButtonProps) {
  const {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({
    continuous: false,
    onResult: (text, isFinal) => {
      if (isFinal && text.trim()) {
        onTranscript(text.trim());
        resetTranscript();
      }
    },
  });

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={isListening ? 'destructive' : 'outline'}
      size="icon"
      onClick={isListening ? stopListening : startListening}
      className={`relative ${className}`}
      title={isListening ? 'Stop recording' : 'Start voice input'}
    >
      {isListening && (
        <span className="absolute inset-0 rounded-md bg-red-500 animate-ping opacity-30" />
      )}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4"
      >
        {isListening ? (
          <path d="M6 6h12v12H6z" />
        ) : (
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
        )}
      </svg>
    </Button>
  );
}
