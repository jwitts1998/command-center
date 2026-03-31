import { NextRequest, NextResponse } from 'next/server';
import { videoRenderer } from '@/lib/services/VideoRenderer';

// GET /api/marketing/videos/[id]/status - Check render status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const video = await videoRenderer.getStatus(id);

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: video.id,
      template_id: video.template_id,
      render_status: video.render_status,
      output_url: video.output_url,
      duration_seconds: video.duration_seconds,
      render_config: video.render_config,
      render_log: video.render_log,
    });
  } catch (error) {
    console.error('Error fetching video status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
