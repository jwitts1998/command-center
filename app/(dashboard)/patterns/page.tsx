'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Project } from '@/types/project';

interface Pattern {
  id: string;
  pattern_type: string;
  name: string;
  description: string;
  pattern_data: any;
  source_projects: string[];
  applicable_to: any;
  confidence: number;
  auto_apply: boolean;
  times_applied: number;
  times_rejected: number;
  created_at: string;
  updated_at: string;
}

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchPatterns();
  }, [selectedType]);

  async function fetchProjects() {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }

  async function fetchPatterns() {
    setLoading(true);
    try {
      let url = '/api/patterns';
      if (selectedType !== 'all') {
        url += `?type=${selectedType}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setPatterns(data.data);
      }
    } catch (error) {
      console.error('Error fetching patterns:', error);
    } finally {
      setLoading(false);
    }
  }

  async function detectPatterns() {
    if (!selectedProject) return;

    setDetecting(true);
    try {
      const response = await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'detect',
          projectId: selectedProject,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Detected ${data.data.detected} patterns, stored ${data.data.stored}`);
        fetchPatterns();
      }
    } catch (error) {
      console.error('Error detecting patterns:', error);
    } finally {
      setDetecting(false);
    }
  }

  async function detectCrossProjectPatterns() {
    setDetecting(true);
    try {
      const response = await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'detect-cross-project',
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Detected ${data.data.detected} cross-project patterns`);
        fetchPatterns();
      }
    } catch (error) {
      console.error('Error detecting patterns:', error);
    } finally {
      setDetecting(false);
    }
  }

  async function toggleAutoApply(patternId: string, currentValue: boolean) {
    try {
      const response = await fetch('/api/patterns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patternId,
          autoApply: !currentValue,
        }),
      });

      if (response.ok) {
        setPatterns((prev) =>
          prev.map((p) =>
            p.id === patternId ? { ...p, auto_apply: !currentValue } : p
          )
        );
      }
    } catch (error) {
      console.error('Error updating pattern:', error);
    }
  }

  async function deletePattern(patternId: string) {
    if (!confirm('Are you sure you want to delete this pattern?')) return;

    try {
      const response = await fetch(`/api/patterns?id=${patternId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPatterns((prev) => prev.filter((p) => p.id !== patternId));
      }
    } catch (error) {
      console.error('Error deleting pattern:', error);
    }
  }

  function getTypeColor(type: string): string {
    switch (type) {
      case 'clarification_preference':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'tech_stack':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'architecture':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'code_style':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'workflow':
        return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  }

  function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  }

  const patternTypes = [
    'all',
    'clarification_preference',
    'tech_stack',
    'architecture',
    'code_style',
    'workflow',
  ];

  const stats = {
    total: patterns.length,
    autoApply: patterns.filter((p) => p.auto_apply).length,
    highConfidence: patterns.filter((p) => Number(p.confidence) >= 0.8).length,
    totalApplied: patterns.reduce((sum, p) => sum + Number(p.times_applied), 0),
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patterns</h1>
          <p className="text-muted-foreground">
            Cross-project intelligence and learned behaviors
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Auto-Apply</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.autoApply}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highConfidence}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Times Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplied}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Pattern Detection</CardTitle>
          <CardDescription>
            Analyze sessions to discover new patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <label className="text-sm text-muted-foreground mb-1 block">
                Project
              </label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={detectPatterns}
              disabled={!selectedProject || detecting}
            >
              {detecting ? 'Detecting...' : 'Detect Patterns'}
            </Button>

            <Button
              variant="outline"
              onClick={detectCrossProjectPatterns}
              disabled={detecting}
            >
              {detecting ? 'Detecting...' : 'Detect Cross-Project'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-48">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {patternTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === 'all' ? 'All Types' : type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={fetchPatterns}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patterns List */}
      <Card>
        <CardHeader>
          <CardTitle>Learned Patterns</CardTitle>
          <CardDescription>
            Patterns detected from project sessions and user behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Loading patterns...
            </p>
          ) : patterns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No patterns detected yet. Run pattern detection on a project with session history.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {patterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="p-4 rounded-lg border space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{pattern.name}</h3>
                        <Badge className={getTypeColor(pattern.pattern_type)}>
                          {pattern.pattern_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pattern.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <span className={getConfidenceColor(Number(pattern.confidence))}>
                          {(Number(pattern.confidence) * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Applied: {pattern.times_applied}</span>
                      <span>Rejected: {pattern.times_rejected}</span>
                      {pattern.source_projects?.length > 0 && (
                        <span>
                          Sources: {pattern.source_projects.length} project(s)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Auto-apply
                        </span>
                        <Switch
                          checked={pattern.auto_apply}
                          onCheckedChange={() =>
                            toggleAutoApply(pattern.id, pattern.auto_apply)
                          }
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deletePattern(pattern.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Pattern Details */}
                  {pattern.pattern_data?.evidence && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Evidence:</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        {pattern.pattern_data.evidence.slice(0, 3).map((e: string, i: number) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
