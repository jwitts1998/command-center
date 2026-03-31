import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import type { MarketingCampaign } from '@/lib/db/client';

// GET /api/marketing/campaigns - List campaigns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');

    let sql = 'SELECT * FROM marketing_campaigns WHERE 1=1';
    const params: any[] = [];

    if (projectId) {
      params.push(projectId);
      sql += ` AND project_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';

    const campaigns = await query<MarketingCampaign>(sql, params);
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error listing campaigns:', error);
    return NextResponse.json({ error: 'Failed to list campaigns' }, { status: 500 });
  }
}

// POST /api/marketing/campaigns - Create campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, title, description, campaign_type, start_date, end_date, goals, budget_usd, created_by } = body;

    if (!project_id || !title) {
      return NextResponse.json({ error: 'project_id and title are required' }, { status: 400 });
    }

    const campaign = await queryOne<MarketingCampaign>(
      `INSERT INTO marketing_campaigns (project_id, title, description, campaign_type, start_date, end_date, goals, budget_usd, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [project_id, title, description || null, campaign_type || 'content', start_date || null, end_date || null, JSON.stringify(goals || {}), budget_usd || null, created_by || null]
    );

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
