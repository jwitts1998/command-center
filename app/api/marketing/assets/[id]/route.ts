import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import type { MarketingAsset } from '@/lib/db/client';

// GET /api/marketing/assets/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asset = await queryOne<MarketingAsset>(
      'SELECT * FROM marketing_assets WHERE id = $1',
      [id]
    );
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}

// PUT /api/marketing/assets/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, status, platform, campaign_id, metadata } = body;

    const fields: string[] = [];
    const values: any[] = [];

    if (title !== undefined) { values.push(title); fields.push(`title = $${values.length}`); }
    if (content !== undefined) { values.push(JSON.stringify(content)); fields.push(`content = $${values.length}`); }
    if (status !== undefined) { values.push(status); fields.push(`status = $${values.length}`); }
    if (platform !== undefined) { values.push(platform); fields.push(`platform = $${values.length}`); }
    if (campaign_id !== undefined) { values.push(campaign_id); fields.push(`campaign_id = $${values.length}`); }
    if (metadata !== undefined) { values.push(JSON.stringify(metadata)); fields.push(`metadata = $${values.length}`); }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const asset = await queryOne<MarketingAsset>(
      `UPDATE marketing_assets SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}

// DELETE /api/marketing/assets/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await query('DELETE FROM marketing_assets WHERE id = $1 RETURNING id', [id]);
    if (result.length === 0) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
