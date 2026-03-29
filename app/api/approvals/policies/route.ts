import { NextRequest, NextResponse } from 'next/server';
import { approvalEngine } from '@/lib/services/ApprovalEngine';

// GET /api/approvals/policies - List approval policies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('only_active') !== 'false';

    const policies = await approvalEngine.getPolicies(onlyActive);

    return NextResponse.json({
      success: true,
      data: policies,
      total: policies.length,
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}

// POST /api/approvals/policies - Create a new policy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, description, trigger_type, trigger_config, auto_approve_confidence } = body;

    if (!name || !trigger_type || !trigger_config) {
      return NextResponse.json(
        { success: false, error: 'name, trigger_type, and trigger_config are required' },
        { status: 400 }
      );
    }

    const result = await approvalEngine.createPolicy({
      name,
      description,
      trigger_type,
      trigger_config,
      auto_approve_confidence,
    });

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating policy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create policy' },
      { status: 500 }
    );
  }
}
