import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import type { MarketingAsset } from '@/lib/db/client';

// GET /api/marketing/assets - List assets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const campaignId = searchParams.get('campaign_id');
    const assetType = searchParams.get('asset_type');
    const status = searchParams.get('status');

    let sql = 'SELECT * FROM marketing_assets WHERE 1=1';
    const params: any[] = [];

    if (projectId) { params.push(projectId); sql += ` AND project_id = $${params.length}`; }
    if (campaignId) { params.push(campaignId); sql += ` AND campaign_id = $${params.length}`; }
    if (assetType) { params.push(assetType); sql += ` AND asset_type = $${params.length}`; }
    if (status) { params.push(status); sql += ` AND status = $${params.length}`; }

    sql += ' ORDER BY created_at DESC';

    const assets = await query<MarketingAsset>(sql, params);
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error listing assets:', error);
    return NextResponse.json({ error: 'Failed to list assets' }, { status: 500 });
  }
}

// POST /api/marketing/assets - Create asset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, campaign_id, asset_type, title, content, status, platform, metadata } = body;

    if (!project_id || !asset_type || !title) {
      return NextResponse.json({ error: 'project_id, asset_type, and title are required' }, { status: 400 });
    }

    const asset = await queryOne<MarketingAsset>(
      `INSERT INTO marketing_assets (project_id, campaign_id, asset_type, title, content, status, platform, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [project_id, campaign_id || null, asset_type, title, JSON.stringify(content || {}), status || 'draft', platform || null, JSON.stringify(metadata || {})]
    );

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}
