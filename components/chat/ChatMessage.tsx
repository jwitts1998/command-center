'use client';

import { memo } from 'react';
import type { ChatMessage as ChatMessageType } from '@/types/chat';
import type { WidgetAction } from '@/types/widget';
import { ChatWidgetRenderer } from './ChatWidgetRenderer';
import { formatRelativeTime } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  onAction?: (action: WidgetAction, widgetId: string) => void;
  isStreaming?: boolean;
}

function ChatMessageComponent({
  message,
  onAction,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} ${isSystem ? 'opacity-70' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : isSystem
              ? 'bg-muted text-muted-foreground'
              : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`flex-1 min-w-0 space-y-2 ${
          isUser ? 'flex flex-col items-end' : ''
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center gap-2 text-xs text-muted-foreground ${
            isUser ? 'flex-row-reverse' : ''
          }`}
        >
          <span className="font-medium">
            {isUser ? 'You' : isSystem ? 'System' : 'Assistant'}
          </span>
          <span>{formatRelativeTime(message.createdAt)}</span>
          {isStreaming && (
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Thinking...
            </span>
          )}
        </div>

        {/* Text Content */}
        {message.content && (
          <div
            className={`rounded-2xl px-4 py-2 max-w-[85%] ${
              isUser
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : isSystem
                  ? 'bg-muted text-muted-foreground rounded-tl-sm text-sm'
                  : 'bg-muted rounded-tl-sm'
            }`}
          >
            <MessageContent content={message.content} />
          </div>
        )}

        {/* Widgets */}
        {message.widgets && message.widgets.length > 0 && (
          <div className={`space-y-3 ${isUser ? 'w-full' : 'max-w-[95%]'}`}>
            {message.widgets.map((widget) => (
              <ChatWidgetRenderer
                key={widget.id}
                widget={widget}
                onAction={onAction}
              />
            ))}
          </div>
        )}

        {/* Streaming indicator */}
        {isStreaming && !message.content && message.widgets.length === 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-2xl rounded-tl-sm">
            <span className="flex gap-1">
              <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Render message content with markdown-like formatting
function MessageContent({ content }: { content: string }) {
  // Split into paragraphs
  const paragraphs = content.split('\n\n');

  return (
    <div className="space-y-2">
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="whitespace-pre-wrap break-words">
          {formatText(paragraph)}
        </p>
      ))}
    </div>
  );
}

// Simple text formatting
function formatText(text: string): React.ReactNode {
  // Handle code blocks
  if (text.startsWith('```') && text.endsWith('```')) {
    const code = text.slice(3, -3);
    const [lang, ...lines] = code.split('\n');
    return (
      <pre className="bg-background/50 p-2 rounded text-sm overflow-x-auto">
        <code>{lines.join('\n') || lang}</code>
      </pre>
    );
  }

  // Handle inline code, bold, and italic
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Simple regex-based formatting
  const patterns = [
    { regex: /`([^`]+)`/g, render: (match: string) => <code key={key++} className="bg-background/50 px-1 rounded text-sm">{match}</code> },
    { regex: /\*\*([^*]+)\*\*/g, render: (match: string) => <strong key={key++}>{match}</strong> },
    { regex: /\*([^*]+)\*/g, render: (match: string) => <em key={key++}>{match}</em> },
  ];

  // Apply all patterns
  let lastIndex = 0;
  const allMatches: Array<{ index: number; length: number; node: React.ReactNode }> = [];

  for (const { regex, render } of patterns) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        node: render(match[1]),
      });
    }
  }

  // Sort by index and filter overlaps
  allMatches.sort((a, b) => a.index - b.index);
  const filteredMatches = allMatches.filter((match, i) => {
    if (i === 0) return true;
    const prev = allMatches[i - 1];
    return match.index >= prev.index + prev.length;
  });

  // Build result
  for (const match of filteredMatches) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(match.node);
    lastIndex = match.index + match.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// Memoize to prevent unnecessary re-renders
export const ChatMessage = memo(ChatMessageComponent);

export default ChatMessage;
