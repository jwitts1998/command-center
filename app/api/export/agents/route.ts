import { NextResponse } from 'next/server';
import { exportService, type ExportOptions } from '@/lib/services/ExportService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const options: ExportOptions = {
      format: (searchParams.get('format') as 'csv' | 'json') || 'csv',
      status: searchParams.get('status') || undefined,
    };

    const result = await exportService.exportAgents(options);

    return new NextResponse(result.data, {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting agents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export agents' },
      { status: 500 }
    );
  }
}
