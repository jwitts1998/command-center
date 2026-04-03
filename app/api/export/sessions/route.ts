import { NextResponse } from 'next/server';
import { exportService, type ExportOptions } from '@/lib/services/ExportService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const options: ExportOptions = {
      format: (searchParams.get('format') as 'csv' | 'json') || 'csv',
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      project_id: searchParams.get('project_id') || undefined,
      status: searchParams.get('status') || undefined,
    };

    const result = await exportService.exportSessions(options);

    return new NextResponse(result.data, {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export sessions' },
      { status: 500 }
    );
  }
}
