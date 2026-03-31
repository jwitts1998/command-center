'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import type { ChatMessage as ChatMessageType, Conversation, SurfaceOptions } from '@/types/chat';
import type { Widget, WidgetAction } from '@/types/widget';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatSurface, ChatModal } from './ChatSurface';
import { ConversationSidebar } from './ConversationSidebar';
import { useChatStream } from '@/hooks/useChatStream';
import { Button } from '@/components/ui/button';
import {
  PanelRightClose,
  PanelRightOpen,
  Plus,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Target,
  PlusCircle,
  Bot as BotIcon,
} from 'lucide-react';

interface ChatInterfaceProps {
  initialConversation?: Conversation | null;
  initialMessages?: ChatMessageType[];
  onConversationChange?: (conversation: Conversation) => void;
  showSidebar?: boolean;
}

export function ChatInterface({
  initialConversation = null,
  initialMessages = [],
  onConversationChange,
  showSidebar = true,
}: ChatInterfaceProps) {
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Workbench state
  const [workbenchWidget, setWorkbenchWidget] = useState<Widget | null>(null);
  const [workbenchOptions, setWorkbenchOptions] = useState<SurfaceOptions | null>(null);
  const [workbenchExpanded, setWorkbenchExpanded] = useState(false);

  // Modal state
  const [modalWidget, setModalWidget] = useState<Widget | null>(null);
  const [modalOptions, setModalOptions] = useState<SurfaceOptions | null>(null);

  // Scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Use chat stream hook
  const {
    messages,
    conversation,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    startNewConversation,
    loadConversation,
  } = useChatStream({
    initialConversation,
    initialMessages,
    onConversationChange,
    onSurfaceAction: (action) => {
      switch (action.surface) {
        case 'workbench':
          if (action.action === 'show' && action.widget) {
            setWorkbenchWidget(action.widget);
            setWorkbenchOptions(action.options || null);
          } else if (action.action === 'hide') {
            setWorkbenchWidget(null);
            setWorkbenchOptions(null);
          }
          break;

        case 'modal':
          if (action.action === 'show' && action.widget) {
            setModalWidget(action.widget);
            setModalOptions(action.options || null);
          } else if (action.action === 'hide') {
            setModalWidget(null);
            setModalOptions(null);
          }
          break;
      }
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle widget actions
  const handleWidgetAction = useCallback(
    async (action: WidgetAction, widgetId: string) => {
      // Handle navigation actions
      if (action.actionType === 'navigate' && action.payload?.target) {
        window.location.href = action.payload.target as string;
        return;
      }

      // Handle workbench actions
      if (action.actionType === 'show_workbench' && action.payload?.widget) {
        setWorkbenchWidget(action.payload.widget as Widget);
        setWorkbenchOptions(action.payload.options as SurfaceOptions || null);
        return;
      }

      if (action.actionType === 'close_workbench') {
        setWorkbenchWidget(null);
        setWorkbenchOptions(null);
        return;
      }

      // Handle modal actions
      if (action.actionType === 'show_modal' && action.payload?.widget) {
        setModalWidget(action.payload.widget as Widget);
        setModalOptions(action.payload.options as SurfaceOptions || null);
        return;
      }

      if (action.actionType === 'close_modal') {
        setModalWidget(null);
        setModalOptions(null);
        return;
      }

      // Send action to chat for processing
      const actionMessage = `[Action: ${action.actionType}] ${action.label}`;
      sendMessage(actionMessage);
    },
    [sendMessage]
  );

  // Handle new conversation
  const handleNewConversation = useCallback(() => {
    setWorkbenchWidget(null);
    setWorkbenchOptions(null);
    startNewConversation();
  }, [startNewConversation]);

  // Handle conversation selection from sidebar
  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      if (conversationId !== conversation?.id) {
        setWorkbenchWidget(null);
        setWorkbenchOptions(null);
        loadConversation(conversationId);
      }
    },
    [conversation?.id, loadConversation]
  );

  // Close workbench
  const handleCloseWorkbench = useCallback(() => {
    setWorkbenchWidget(null);
    setWorkbenchOptions(null);
    setWorkbenchExpanded(false);
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setModalWidget(null);
    setModalOptions(null);
  }, []);

  // Toggle workbench expand
  const handleToggleWorkbenchExpand = useCallback(() => {
    setWorkbenchExpanded((prev) => !prev);
  }, []);

  // Toggle sidebar collapse
  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const showWorkbench = workbenchWidget !== null;

  return (
    <div className="flex h-full bg-background">
      {/* Conversation Sidebar */}
      {showSidebar && (
        <ConversationSidebar
          currentConversationId={conversation?.id}
          onSelect={handleSelectConversation}
          onNewConversation={handleNewConversation}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      )}

      {/* Main Chat Area */}
      <div
        className={`flex flex-col flex-1 min-w-0 ${
          showWorkbench && !workbenchExpanded ? 'max-w-[calc(100%-384px)]' : ''
        }`}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            {showSidebar && sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleSidebar}
                title="Show conversations"
                className="mr-1"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </Button>
            )}
            <MessageSquare className="w-5 h-5 text-primary" />
            <div>
              <h1 className="font-semibold">
                {conversation?.title || 'New Conversation'}
              </h1>
              {conversation && (
                <p className="text-xs text-muted-foreground">
                  {messages.length} messages
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewConversation}
              title="New conversation"
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
            {showWorkbench ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseWorkbench}
                title="Close workbench"
              >
                <PanelRightClose className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                disabled
                title="No workbench content"
              >
                <PanelRightOpen className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-6"
        >
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                onAction={handleWidgetAction}
                isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
              />
            ))
          )}

          {/* Streaming placeholder */}
          {isLoading && !isStreaming && (
            <ChatMessage
              message={{
                id: 'streaming',
                conversationId: conversation?.id || '',
                role: 'assistant',
                content: null,
                widgets: [],
                actions: [],
                metadata: {},
                createdAt: new Date(),
              }}
              isStreaming
            />
          )}

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          onSubmit={sendMessage}
          isLoading={isLoading}
          disabled={isStreaming}
        />
      </div>

      {/* Workbench Surface */}
      {showWorkbench && !workbenchExpanded && (
        <ChatSurface
          widget={workbenchWidget}
          options={workbenchOptions}
          onClose={handleCloseWorkbench}
          onAction={handleWidgetAction}
          isExpanded={workbenchExpanded}
          onToggleExpand={handleToggleWorkbenchExpand}
        />
      )}

      {/* Expanded Workbench */}
      {showWorkbench && workbenchExpanded && (
        <div className="fixed inset-0 z-40 bg-background">
          <ChatSurface
            widget={workbenchWidget}
            options={workbenchOptions}
            onClose={handleCloseWorkbench}
            onAction={handleWidgetAction}
            isExpanded={workbenchExpanded}
            onToggleExpand={handleToggleWorkbenchExpand}
          />
        </div>
      )}

      {/* Modal */}
      {modalWidget && (
        <ChatModal
          widget={modalWidget}
          options={modalOptions}
          onClose={handleCloseModal}
          onAction={handleWidgetAction}
        />
      )}
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Welcome to Command Center</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        I can help you manage goals, tasks, agents, and approvals.
        Try one of these to get started:
      </p>
      <div className="grid gap-2 max-w-lg w-full sm:grid-cols-2">
        <SuggestionButton
          text="Show pending approvals"
          icon="shield"
          description="Review items awaiting your decision"
        />
        <SuggestionButton
          text="List active goals"
          icon="target"
          description="See your current objectives"
        />
        <SuggestionButton
          text="Create a new task"
          icon="plus"
          description="Add work to be completed"
        />
        <SuggestionButton
          text="Check agent status"
          icon="bot"
          description="See what agents are doing"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-6">
        Tip: Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd> to send,{' '}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}

const suggestionIcons = {
  shield: Shield,
  target: Target,
  plus: PlusCircle,
  bot: BotIcon,
};

function SuggestionButton({
  text,
  icon,
  description,
}: {
  text: string;
  icon?: keyof typeof suggestionIcons;
  description?: string;
}) {
  const Icon = icon ? suggestionIcons[icon] : null;

  return (
    <button
      className="text-left px-4 py-3 rounded-lg border hover:bg-accent/50 hover:border-primary/30 transition-all text-sm group"
      onClick={() => {
        const event = new CustomEvent('chat-suggestion', { detail: text });
        window.dispatchEvent(event);
      }}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="p-1.5 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
            <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium">{text}</div>
          {description && (
            <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
          )}
        </div>
      </div>
    </button>
  );
}

export default ChatInterface;
