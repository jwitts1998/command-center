'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Project } from '@/types/project';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project & { stats?: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  async function fetchProject() {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();
      if (data.success) {
        setProject(data.data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Project not found</p>
        <Link href="/projects">
          <Button>Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
              {project.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {project.description || 'No description'}
          </p>
        </div>
        <Link href="/projects">
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.stats?.total_sessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {project.stats?.active_sessions || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(project.stats?.total_cost || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {project.monthly_budget
                ? `Budget: $${project.monthly_budget}/mo`
                : 'No budget set'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Repo Path</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono break-all">
              {project.repo_path || 'Not set'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tech Stack */}
      {project.tech_stack && Object.keys(project.tech_stack).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tech Stack</CardTitle>
            <CardDescription>Technologies used in this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(project.tech_stack).map(([category, items]) => (
                <div key={category}>
                  <h4 className="font-medium capitalize mb-2">{category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(items) ? items : [items]).map((item: any, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {String(item)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Latest prompt enrichment sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            No sessions yet. Install the plugin and start enriching prompts.
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>Install the Command Center plugin in your project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 font-mono text-sm">
            <div>1. Navigate to your project directory:</div>
            <div className="mt-2 text-muted-foreground">
              cd {project.repo_path || '/path/to/your/project'}
            </div>
            <div className="mt-4">2. Install the plugin (Coming Soon):</div>
            <div className="mt-2 text-muted-foreground">
              curl -sSL https://command-center.vercel.app/install.sh | bash
            </div>
            <div className="mt-4">3. Set your API key:</div>
            <div className="mt-2 text-muted-foreground">
              echo "COMMAND_CENTER_API_KEY=your-key" &gt;&gt; .env
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            The plugin will automatically intercept prompts and enrich them with project context.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
