// StreamParser - Parses JSONL streaming responses from the chat API

import { Widget } from '@/types/widget';
import { ParsedStreamEvent } from './types';
import { validateWidget } from './WidgetRegistry';

// Parse a single line of JSONL
export function parseLine(line: string): ParsedStreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith(':')) {
    // Empty line or SSE comment
    return null;
  }

  // Handle SSE format (data: {...})
  let jsonStr = trimmed;
  if (trimmed.startsWith('data: ')) {
    jsonStr = trimmed.slice(6);
  }

  if (jsonStr === '[DONE]') {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return parseStreamEvent(parsed);
  } catch (error) {
    console.error('Failed to parse stream line:', line, error);
    return null;
  }
}

// Parse a stream event object
function parseStreamEvent(data: unknown): ParsedStreamEvent | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const obj = data as Record<string, unknown>;

  // Check for type field
  const type = obj.type as string;
  if (!type) {
    // Try to infer type from data structure
    if ('widget' in obj) {
      return {
        type: 'widget',
        data: obj.widget as Widget,
      };
    }
    if (typeof obj.content === 'string') {
      return {
        type: 'text',
        data: obj.content,
      };
    }
    return null;
  }

  switch (type) {
    case 'widget':
      const widget = obj.data || obj.widget;
      if (!validateWidget(widget)) {
        console.warn('Invalid widget in stream:', widget);
        return null;
      }
      return { type: 'widget', data: widget as Widget };

    case 'text':
    case 'content':
      const text = obj.data || obj.content || obj.text;
      if (typeof text !== 'string') {
        return null;
      }
      return { type: 'text', data: text };

    case 'action':
      return {
        type: 'action',
        data: obj.data as { widgetId: string; actionId: string; result: unknown },
      };

    case 'surface':
      return {
        type: 'surface',
        data: obj.data as {
          surface: 'workbench' | 'modal' | 'notification';
          action: 'show' | 'hide' | 'update';
          widget?: Widget;
          options?: Record<string, unknown>;
        },
      };

    case 'error':
      return {
        type: 'error',
        data: {
          message: (obj.data as any)?.message || obj.message || 'Unknown error',
          code: (obj.data as any)?.code || obj.code,
        },
      };

    case 'done':
      return {
        type: 'done',
        data: obj.data as { messageId: string; conversationId: string },
      };

    default:
      console.warn('Unknown stream event type:', type);
      return null;
  }
}

// Stream reader that processes chunks
export class StreamReader {
  private buffer = '';
  private onEvent: (event: ParsedStreamEvent) => void;

  constructor(onEvent: (event: ParsedStreamEvent) => void) {
    this.onEvent = onEvent;
  }

  // Process a chunk of data
  processChunk(chunk: string): void {
    this.buffer += chunk;

    // Split by newlines and process complete lines
    const lines = this.buffer.split('\n');

    // Keep the last incomplete line in the buffer
    this.buffer = lines.pop() || '';

    // Process complete lines
    for (const line of lines) {
      const event = parseLine(line);
      if (event) {
        this.onEvent(event);
      }
    }
  }

  // Flush any remaining data in the buffer
  flush(): void {
    if (this.buffer.trim()) {
      const event = parseLine(this.buffer);
      if (event) {
        this.onEvent(event);
      }
      this.buffer = '';
    }
  }
}

// Parse AI SDK streaming text delta format
export function parseAISDKDelta(delta: unknown): string | null {
  if (!delta || typeof delta !== 'object') {
    return null;
  }

  const obj = delta as Record<string, unknown>;

  // Handle different delta formats from AI SDK
  if (typeof obj.textDelta === 'string') {
    return obj.textDelta;
  }

  if (typeof obj.content === 'string') {
    return obj.content;
  }

  if (Array.isArray(obj.content)) {
    return obj.content
      .filter((c: unknown) => typeof c === 'object' && (c as any).type === 'text')
      .map((c: unknown) => (c as any).text || '')
      .join('');
  }

  return null;
}

// Extract widgets from AI response content
export function extractWidgetsFromContent(content: string): {
  text: string;
  widgets: Widget[];
} {
  const widgets: Widget[] = [];
  let processedText = content;

  // Look for widget JSON blocks in various formats
  const patterns = [
    // ```widget {...}```
    /```widget\s*([\s\S]*?)```/g,
    // ```json:widget {...}```
    /```json:widget\s*([\s\S]*?)```/g,
    // <widget>...</widget>
    /<widget>([\s\S]*?)<\/widget>/g,
    // [[widget:{...}]]
    /\[\[widget:([\s\S]*?)\]\]/g,
  ];

  for (const pattern of patterns) {
    processedText = processedText.replace(pattern, (match, jsonStr) => {
      try {
        const widget = JSON.parse(jsonStr.trim());
        if (validateWidget(widget)) {
          widgets.push(widget);
          return ''; // Remove widget from text
        }
      } catch {
        // Not valid JSON, keep in text
      }
      return match;
    });
  }

  return {
    text: processedText.trim(),
    widgets,
  };
}
