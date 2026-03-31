'use client';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Rocket,
  Users,
  Target,
  Mic,
  Lightbulb,
  Shield,
  DollarSign,
  HelpCircle,
  Clock,
  BookOpen,
  GitBranch,
  Workflow,
  Settings,
  Sparkles,
  FileCode,
  Brain,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import {
  guides,
  categoryLabels,
  difficultyColors,
  type Guide,
} from '@/lib/guides';

const iconMap: Record<string, LucideIcon> = {
  Rocket,
  Users,
  Target,
  Mic,
  Lightbulb,
  Shield,
  DollarSign,
  HelpCircle,
  GitBranch,
  Workflow,
  Settings,
  Sparkles,
  FileCode,
  Brain,
};

interface GuideModalProps {
  guide: Guide | null;
  onClose: () => void;
}

export function GuideModal({ guide, onClose }: GuideModalProps) {
  if (!guide) return null;

  const Icon = iconMap[guide.icon] || BookOpen;
  const difficultyStyle = difficultyColors[guide.difficulty];

  return (
    <Dialog open={!!guide} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{guide.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {guide.description}
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Badge
              variant="outline"
              className={`${difficultyStyle.bg} ${difficultyStyle.text} border-0`}
            >
              {guide.difficulty}
            </Badge>
            <Badge variant="secondary">
              {categoryLabels[guide.category]}
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {guide.estimatedTime}
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <GuideContent content={guide.content} />
          </div>

          {guide.relatedPages && guide.relatedPages.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h4 className="text-sm font-medium mb-3">Related Pages</h4>
              <div className="flex flex-wrap gap-2">
                {guide.relatedPages.map((page) => (
                  <Link key={page} href={page} onClick={onClose}>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                    >
                      {page}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {guide.prerequisites && guide.prerequisites.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium mb-3">Prerequisites</h4>
              <div className="flex flex-wrap gap-2">
                {guide.prerequisites.map((prereq) => {
                  const prereqGuide = guides.find(g => g.id === prereq);
                  return (
                    <Badge key={prereq} variant="secondary">
                      {prereqGuide?.title || prereq}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GuideContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="bg-muted p-4 rounded-lg overflow-x-auto text-sm my-4">
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-2xl font-bold mt-6 mb-3 first:mt-0">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-xl font-semibold mt-6 mb-2">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-lg font-medium mt-4 mb-2">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      elements.push(
        <li key={i} className="ml-4 my-1 list-disc">
          {formatInlineCode(line.slice(2))}
        </li>
      );
    } else if (/^\d+\. /.test(line)) {
      const match = line.match(/^\d+\. (.*)$/);
      if (match) {
        elements.push(
          <li key={i} className="ml-4 my-1 list-decimal">
            {formatInlineCode(match[1])}
          </li>
        );
      }
    } else if (line.startsWith('| ')) {
      // Handle table rows
      const cells = line.split('|').filter(Boolean).map(c => c.trim());
      const isHeaderSeparator = cells.every(c => /^[-:]+$/.test(c));
      if (!isHeaderSeparator) {
        elements.push(
          <div key={i} className="flex gap-4 py-1 text-sm border-b last:border-b-0">
            {cells.map((cell, idx) => (
              <div key={idx} className={`flex-1 ${idx === 0 ? 'font-medium' : 'text-muted-foreground'}`}>
                {formatInlineCode(cell)}
              </div>
            ))}
          </div>
        );
      }
    } else if (line.trim() === '') {
      // Skip empty lines
    } else {
      elements.push(
        <p key={i} className="my-2 leading-relaxed">
          {formatInlineCode(line)}
        </p>
      );
    }
  }

  return <>{elements}</>;
}

function formatInlineCode(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.includes('**')) {
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bp, j) => {
        if (bp.startsWith('**') && bp.endsWith('**')) {
          return <strong key={`${i}-${j}`}>{bp.slice(2, -2)}</strong>;
        }
        return bp;
      });
    }
    return part;
  });
}
