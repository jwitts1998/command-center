import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';
import type { MarketingAnalytic } from '@/lib/db/client';

// GET /api/marketing/analytics - Get campaign analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');
    const projectId = searchParams.get('project_id');

    if (!campaignId && !projectId) {
      return NextResponse.json({ error: 'campaign_id or project_id is required' }, { status: 400 });
    }

    let sql: string;
    let params: any[];

    if (campaignId) {
      sql = 'SELECT * FROM marketing_analytics WHERE campaign_id = $1 ORDER BY recorded_at DESC';
      params = [campaignId];
    } else {
      sql = `SELECT ma.* FROM marketing_analytics ma
             JOIN marketing_campaigns mc ON ma.campaign_id = mc.id
             WHERE mc.project_id = $1
             ORDER BY ma.recorded_at DESC`;
      params = [projectId!];
    }

    const analytics = await query<MarketingAnalytic>(sql, params);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
