'use client';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Workflow, Circle, Diamond, Square } from 'lucide-react';
import { FlowDiagram } from './FlowDiagram';
import { guides, type ProcessFlow } from '@/lib/guides';

interface ProcessFlowModalProps {
  flow: ProcessFlow | null;
  onClose: () => void;
  onOpenGuide?: (guideId: string) => void;
}

export function ProcessFlowModal({ flow, onClose, onOpenGuide }: ProcessFlowModalProps) {
  if (!flow) return null;

  return (
    <Dialog open={!!flow} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Workflow className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{flow.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {flow.description}
              </DialogDescription>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Circle className="h-4 w-4 text-green-500 fill-green-500" />
              <span className="text-muted-foreground">Start</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Square className="h-4 w-4 text-blue-500 fill-blue-500/20" />
              <span className="text-muted-foreground">Process</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Diamond className="h-4 w-4 text-yellow-500 fill-yellow-500/20" />
              <span className="text-muted-foreground">Decision</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Circle className="h-4 w-4 text-red-500 fill-red-500" />
              <span className="text-muted-foreground">End</span>
            </div>
          </div>
        </DialogHeader>

        {/* Flow Diagram */}
        <div className="flex-1 min-h-[400px] bg-muted/30">
          <FlowDiagram flow={flow} />
        </div>

        {/* Related Guides Footer */}
        {flow.relatedGuides && flow.relatedGuides.length > 0 && (
          <div className="flex-shrink-0 border-t px-6 py-4 bg-background">
            <h4 className="text-sm font-medium mb-2">Related Guides</h4>
            <div className="flex flex-wrap gap-2">
              {flow.relatedGuides.map((guideId) => {
                const guide = guides.find((g) => g.id === guideId);
                return guide ? (
                  <Badge
                    key={guideId}
                    variant="secondary"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => {
                      onClose();
                      if (onOpenGuide) {
                        // Small delay to allow modal close animation
                        setTimeout(() => onOpenGuide(guideId), 150);
                      }
                    }}
                  >
                    {guide.title}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
