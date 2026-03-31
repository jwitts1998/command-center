'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink } from 'lucide-react';
import {
  designResources,
  quickReferenceTable,
  categoryLabels,
  type DesignResource,
} from '@/lib/design-resources';

function ResourceCard({ resource }: { resource: DesignResource }) {
  return (
    <Card className="h-full flex flex-col hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{resource.icon}</span>
            <CardTitle className="text-lg">{resource.name}</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {categoryLabels[resource.category]}
          </Badge>
        </div>
        <CardDescription className="text-sm">
          {resource.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">Best for:</p>
          <p className="text-sm mb-3">{resource.bestFor}</p>
          {resource.keyPatterns && resource.keyPatterns.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {resource.keyPatterns.slice(0, 3).map((pattern, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {pattern}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          asChild
        >
          <a href={resource.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit Site
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DesignPage() {
  const [activeTab, setActiveTab] = useState<string>('all');

  const filteredResources = activeTab === 'all'
    ? designResources
    : designResources.filter(r => r.category === activeTab);

  const categories = [
    { value: 'all', label: 'All Resources' },
    { value: 'web', label: 'Web Galleries' },
    { value: 'mobile', label: 'Mobile Galleries' },
    { value: 'component', label: 'Components' },
    { value: 'motion', label: 'Motion' },
    { value: 'tool', label: 'Tools' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Design Inspiration</h1>
        <p className="text-muted-foreground">
          Curated design galleries and tools for UI quality benchmarks. Reference these before implementing any UI work.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Web Galleries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designResources.filter(r => r.category === 'web').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mobile Galleries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designResources.filter(r => r.category === 'mobile').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Component Libraries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designResources.filter(r => r.category === 'component').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tools & Motion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designResources.filter(r => r.category === 'motion' || r.category === 'tool').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs and Resource Cards */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          {categories.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.name} resource={resource} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Reference Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reference</CardTitle>
          <CardDescription>
            Which site to use for which task
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Task</TableHead>
                <TableHead>Go to</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quickReferenceTable.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.task}</TableCell>
                  <TableCell className="text-muted-foreground">{item.resource}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
