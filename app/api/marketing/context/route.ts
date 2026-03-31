import { NextRequest, NextResponse } from 'next/server';
import { marketingContextBuilder } from '@/lib/services/MarketingContextBuilder';

// GET /api/marketing/context?project_id=... - Get existing product marketing context
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    const context = await marketingContextBuilder.getContext(projectId);
    if (!context) {
      return NextResponse.json({ error: 'No marketing context found. POST to generate one.' }, { status: 404 });
    }

    return NextResponse.json(context);
  } catch (error) {
    console.error('Error fetching marketing context:', error);
    return NextResponse.json({ error: 'Failed to fetch marketing context' }, { status: 500 });
  }
}

// POST /api/marketing/context - Generate/refresh product marketing context
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    const context = await marketingContextBuilder.buildContext(project_id);
    return NextResponse.json(context, { status: 201 });
  } catch (error) {
    console.error('Error building marketing context:', error);
    return NextResponse.json({ error: 'Failed to build marketing context' }, { status: 500 });
  }
}
