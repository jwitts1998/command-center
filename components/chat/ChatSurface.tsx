'use client';

import { useCallback } from 'react';
import { Widget, WidgetAction } from '@/types/widget';
import type { SurfaceOptions } from '@/types/chat';
import { ChatWidgetRenderer } from './ChatWidgetRenderer';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface ChatSurfaceProps {
  widget: Widget | null;
  options: SurfaceOptions | null;
  onClose: () => void;
  onAction?: (action: WidgetAction, widgetId: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function ChatSurface({
  widget,
  options,
  onClose,
  onAction,
  isExpanded = false,
  onToggleExpand,
}: ChatSurfaceProps) {
  if (!widget) {
    return null;
  }

  const widthClasses = {
    narrow: 'w-80',
    medium: 'w-96',
    wide: 'w-[480px]',
    full: 'w-full',
  };

  const width = options?.width || 'medium';

  return (
    <div
      className={`
        flex flex-col h-full border-l bg-background
        ${isExpanded ? 'w-full' : widthClasses[width]}
        transition-all duration-200
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">
            {options?.title || 'Workbench'}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {onToggleExpand && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onToggleExpand}
              title={isExpanded ? 'Minimize' : 'Maximize'}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          {(options?.closeable !== false) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <ChatWidgetRenderer widget={widget} onAction={onAction} />
      </div>
    </div>
  );
}

// Modal surface for overlay dialogs
interface ChatModalProps {
  widget: Widget | null;
  options: SurfaceOptions | null;
  onClose: () => void;
  onAction?: (action: WidgetAction, widgetId: string) => void;
}

export function ChatModal({
  widget,
  options,
  onClose,
  onAction,
}: ChatModalProps) {
  if (!widget) {
    return null;
  }

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && options?.closeable !== false) {
        onClose();
      }
    },
    [onClose, options?.closeable]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-background rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">
            {options?.title || 'Dialog'}
          </h3>
          {(options?.closeable !== false) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
          <ChatWidgetRenderer widget={widget} onAction={onAction} />
        </div>
      </div>
    </div>
  );
}

// Notification toast
interface ChatNotificationProps {
  widget: Widget;
  onAction?: (action: WidgetAction, widgetId: string) => void;
  onDismiss: () => void;
  duration?: number;
}

export function ChatNotification({
  widget,
  onAction,
  onDismiss,
  duration = 5000,
}: ChatNotificationProps) {
  // Auto-dismiss after duration
  if (duration > 0) {
    setTimeout(onDismiss, duration);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 animate-in slide-in-from-right">
      <div className="bg-background rounded-lg shadow-lg border p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <ChatWidgetRenderer widget={widget} onAction={onAction} compact />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={onDismiss}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChatSurface;
