'use client';

import { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { Send, Mic, Square, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({
  onSubmit,
  isLoading = false,
  placeholder = 'Message Command Center...',
  disabled = false,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isListening,
    isSupported: voiceSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({
    continuous: true,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (isFinal) {
        setInput((prev) => prev + text + ' ');
      }
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if (text && !isLoading && !disabled) {
      onSubmit(text);
      setInput('');
      resetTranscript();

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [input, isLoading, disabled, onSubmit, resetTranscript]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleToggleVoice = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  }, [isListening, startListening, stopListening, resetTranscript]);

  const displayValue = transcript ? `${input}${transcript}${interimTranscript}` : input;
  const canSubmit = input.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className="relative flex items-end gap-2 p-4 border-t bg-background">
      {/* Input Area */}
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={displayValue}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Listening...' : placeholder}
          disabled={disabled || isLoading}
          className={`resize-none min-h-[44px] max-h-[200px] pr-24 py-3 ${
            isListening ? 'bg-red-500/5 border-red-500/30' : ''
          }`}
          rows={1}
        />

        {/* Inline buttons */}
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          {/* Voice button */}
          {voiceSupported && (
            <Button
              type="button"
              variant={isListening ? 'destructive' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={handleToggleVoice}
              disabled={disabled || isLoading}
              title={isListening ? 'Stop recording' : 'Start voice input'}
            >
              {isListening ? (
                <>
                  <span className="absolute inset-0 rounded-md bg-red-500 animate-ping opacity-30" />
                  <Square className="h-4 w-4 relative z-10" />
                </>
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Submit button */}
          <Button
            type="button"
            variant="default"
            size="icon"
            className="h-8 w-8"
            onClick={handleSubmit}
            disabled={!canSubmit}
            title="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Recording indicator */}
      {isListening && (
        <div className="absolute -top-8 left-4 right-4 flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-600 rounded-full text-sm animate-pulse">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Recording...
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatInput;
