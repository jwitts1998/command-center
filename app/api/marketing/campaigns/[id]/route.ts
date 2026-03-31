import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import type { MarketingCampaign } from '@/lib/db/client';

// GET /api/marketing/campaigns/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await queryOne<MarketingCampaign>(
      'SELECT * FROM marketing_campaigns WHERE id = $1',
      [id]
    );
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
}

// PUT /api/marketing/campaigns/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, campaign_type, status, start_date, end_date, goals, budget_usd } = body;

    const fields: string[] = [];
    const values: any[] = [];

    if (title !== undefined) { values.push(title); fields.push(`title = $${values.length}`); }
    if (description !== undefined) { values.push(description); fields.push(`description = $${values.length}`); }
    if (campaign_type !== undefined) { values.push(campaign_type); fields.push(`campaign_type = $${values.length}`); }
    if (status !== undefined) { values.push(status); fields.push(`status = $${values.length}`); }
    if (start_date !== undefined) { values.push(start_date); fields.push(`start_date = $${values.length}`); }
    if (end_date !== undefined) { values.push(end_date); fields.push(`end_date = $${values.length}`); }
    if (goals !== undefined) { values.push(JSON.stringify(goals)); fields.push(`goals = $${values.length}`); }
    if (budget_usd !== undefined) { values.push(budget_usd); fields.push(`budget_usd = $${values.length}`); }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const campaign = await queryOne<MarketingCampaign>(
      `UPDATE marketing_campaigns SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

// DELETE /api/marketing/campaigns/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await query('DELETE FROM marketing_campaigns WHERE id = $1 RETURNING id', [id]);
    if (result.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
