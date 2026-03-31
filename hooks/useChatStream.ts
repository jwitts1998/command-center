'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  ChatMessage,
  Conversation,
  ConversationContext,
  SurfaceAction,
  ChatStreamEvent,
} from '@/types/chat';
import type { Widget } from '@/types/widget';
import { extractWidgetsFromContent } from '@/lib/a2ui/StreamParser';

interface UseChatStreamOptions {
  initialConversation?: Conversation | null;
  initialMessages?: ChatMessage[];
  onConversationChange?: (conversation: Conversation) => void;
  onSurfaceAction?: (action: SurfaceAction) => void;
  apiEndpoint?: string;
}

interface UseChatStreamResult {
  messages: ChatMessage[];
  conversation: Conversation | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  startNewConversation: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
}

export function useChatStream({
  initialConversation = null,
  initialMessages = [],
  onConversationChange,
  onSurfaceAction,
  apiEndpoint = '/api/chat',
}: UseChatStreamOptions = {}): UseChatStreamResult {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [conversation, setConversation] = useState<Conversation | null>(initialConversation);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Update conversation when it changes
  useEffect(() => {
    if (conversation && onConversationChange) {
      onConversationChange(conversation);
    }
  }, [conversation, onConversationChange]);

  // Listen for suggestion clicks
  useEffect(() => {
    const handleSuggestion = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        sendMessage(customEvent.detail);
      }
    };

    window.addEventListener('chat-suggestion', handleSuggestion);
    return () => window.removeEventListener('chat-suggestion', handleSuggestion);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Send a message and stream the response
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);

      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        conversationId: conversation?.id || '',
        role: 'user',
        content,
        widgets: [],
        actions: [],
        metadata: {},
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Create assistant message placeholder
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        conversationId: conversation?.id || '',
        role: 'assistant',
        content: '',
        widgets: [],
        actions: [],
        metadata: {},
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsStreaming(true);

      try {
        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            conversationId: conversation?.id,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        // Get conversation ID from response headers
        const newConversationId = response.headers.get('X-Conversation-Id');
        if (newConversationId && !conversation?.id) {
          setConversation({
            id: newConversationId,
            userId: null,
            title: content.slice(0, 50),
            context: {},
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Process the stream as plain text
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';
        let accumulatedWidgets: Widget[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;

          // Extract any inline widgets from text
          const { text, widgets: inlineWidgets } = extractWidgetsFromContent(accumulatedContent);
          if (inlineWidgets.length > accumulatedWidgets.length) {
            accumulatedWidgets = inlineWidgets;
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: text, widgets: accumulatedWidgets }
                : m
            )
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was cancelled
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);

        // Remove the placeholder assistant message on error
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [conversation?.id, isLoading, onSurfaceAction, apiEndpoint]
  );

  // Start a new conversation
  const startNewConversation = useCallback(() => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setMessages([]);
    setConversation(null);
    setError(null);
    setIsLoading(false);
    setIsStreaming(false);
  }, []);

  // Load an existing conversation
  const loadConversation = useCallback(
    async (conversationId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/chat/conversations/${conversationId}`);
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        setConversation(data.conversation);
        setMessages(data.messages || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    messages,
    conversation,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    startNewConversation,
    loadConversation,
  };
}

export default useChatStream;
