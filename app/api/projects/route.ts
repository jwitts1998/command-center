import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import type { Project } from '@/lib/db/client';
import type { CreateProjectInput, UpdateProjectInput } from '@/types/project';

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let queryText = 'SELECT * FROM projects';
    const params: any[] = [];

    if (status) {
      queryText += ' WHERE status = $1';
      params.push(status);
    }

    queryText += ' ORDER BY created_at DESC';

    const projects = await query<Project>(queryText, params.length > 0 ? params : undefined);

    return NextResponse.json({
      success: true,
      data: projects,
      total: projects.length,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch projects',
      },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectInput = await request.json();

    const { name, description, tech_stack, repo_path, monthly_budget } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project name is required',
        },
        { status: 400 }
      );
    }

    const result = await queryOne<Project>(
      `INSERT INTO projects (name, description, tech_stack, repo_path, monthly_budget)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        name,
        description || null,
        JSON.stringify(tech_stack || {}),
        repo_path || null,
        monthly_budget || null,
      ]
    );

    if (!result) {
      throw new Error('Failed to create project');
    }

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create project',
      },
      { status: 500 }
    );
  }
}
