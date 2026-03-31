'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowRight,
  GitBranch,
  Workflow,
  ChevronRight,
  Circle,
  Diamond,
  Square,
  Settings,
  Sparkles,
  FileCode,
  Brain,
  type LucideIcon,
} from 'lucide-react';
import {
  guides,
  processFlows,
  categoryLabels,
  difficultyColors,
  type Guide,
  type ProcessFlow,
  type ProcessStep,
} from '@/lib/guides';
import { GuideModal } from '@/components/GuideModal';
import { ProcessFlowModal } from '@/components/ProcessFlowModal';

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

function GuideCard({ guide, onOpen }: { guide: Guide; onOpen: () => void }) {
  const Icon = iconMap[guide.icon] || BookOpen;
  const difficultyStyle = difficultyColors[guide.difficulty];

  return (
    <Card className="h-full flex flex-col hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">{guide.title}</CardTitle>
          </div>
        </div>
        <CardDescription className="text-sm mt-2">
          {guide.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <Badge
              variant="outline"
              className={`${difficultyStyle.bg} ${difficultyStyle.text} border-0`}
            >
              {guide.difficulty}
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {guide.estimatedTime}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={onOpen}
        >
          Read Guide
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

function ProcessFlowCard({ flow, onOpen }: { flow: ProcessFlow; onOpen: () => void }) {
  return (
    <Card className="h-full flex flex-col hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Workflow className="h-5 w-5 text-blue-500" />
          </div>
          <CardTitle className="text-lg">{flow.title}</CardTitle>
        </div>
        <CardDescription className="text-sm mt-2">
          {flow.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <span>{flow.steps.length} steps</span>
            <span className="mx-1">•</span>
            <span>Interactive flow</span>
          </div>
          {/* Mini preview of flow */}
          <div className="flex items-center gap-1 overflow-hidden">
            {flow.steps.slice(0, 4).map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <StepIcon type={step.type} size="sm" />
                {idx < 3 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />}
              </div>
            ))}
            {flow.steps.length > 4 && (
              <span className="text-xs text-muted-foreground ml-1">+{flow.steps.length - 4} more</span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={onOpen}
        >
          View Flow
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

function StepIcon({ type, size = 'md' }: { type: ProcessStep['type']; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';

  switch (type) {
    case 'start':
      return <Circle className={`${sizeClass} text-green-500 fill-green-500`} />;
    case 'end':
      return <Circle className={`${sizeClass} text-red-500 fill-red-500`} />;
    case 'decision':
      return <Diamond className={`${sizeClass} text-yellow-500 fill-yellow-500/20`} />;
    case 'process':
    default:
      return <Square className={`${sizeClass} text-blue-500 fill-blue-500/20`} />;
  }
}

export default function GuidesPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<ProcessFlow | null>(null);

  const filteredGuides =
    activeTab === 'all'
      ? guides
      : activeTab === 'process-flows'
      ? guides.filter((g) => g.category === 'process-flows')
      : guides.filter((g) => g.category === activeTab);

  const categories = [
    { value: 'all', label: 'All Guides' },
    { value: 'getting-started', label: 'Getting Started' },
    { value: 'workflows', label: 'Workflows' },
    { value: 'features', label: 'Features' },
    { value: 'developer-config', label: 'Developer Config' },
    { value: 'process-flows', label: 'Process Flows' },
    { value: 'troubleshooting', label: 'Troubleshooting' },
  ];

  const handleOpenGuide = useCallback((guideId: string) => {
    const guide = guides.find((g) => g.id === guideId);
    if (guide) {
      setSelectedGuide(guide);
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Guides</h1>
        <p className="text-muted-foreground">
          Learn how to use Command Center effectively
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Guides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guides.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Process Flows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{processFlows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Beginner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {guides.filter((g) => g.difficulty === 'beginner').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Intermediate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {guides.filter((g) => g.difficulty === 'intermediate').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Advanced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {guides.filter((g) => g.difficulty === 'advanced').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Process Flows Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-blue-500" />
            Interactive Process Flows
          </CardTitle>
          <CardDescription>
            Visual step-by-step workflows for key Command Center processes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {processFlows.map((flow) => (
              <ProcessFlowCard
                key={flow.id}
                flow={flow}
                onOpen={() => setSelectedFlow(flow)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs and Guide Cards */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          {categories.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGuides.map((guide) => (
              <GuideCard
                key={guide.id}
                guide={guide}
                onOpen={() => setSelectedGuide(guide)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Guide Modal */}
      <GuideModal
        guide={selectedGuide}
        onClose={() => setSelectedGuide(null)}
      />

      {/* Process Flow Modal */}
      <ProcessFlowModal
        flow={selectedFlow}
        onClose={() => setSelectedFlow(null)}
        onOpenGuide={handleOpenGuide}
      />
    </div>
  );
}
