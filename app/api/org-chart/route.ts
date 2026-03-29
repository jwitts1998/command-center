import { NextResponse } from 'next/server';
import { delegationTracker } from '@/lib/services/DelegationTracker';

// GET /api/org-chart - Get the organization chart
export async function GET() {
  try {
    const orgChart = await delegationTracker.getOrgChart();

    return NextResponse.json({
      success: true,
      data: orgChart,
    });
  } catch (error) {
    console.error('Error fetching org chart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch org chart' },
      { status: 500 }
    );
  }
}
