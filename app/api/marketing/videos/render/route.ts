import { NextRequest, NextResponse } from 'next/server';
import { videoRenderer } from '@/lib/services/VideoRenderer';

// POST /api/marketing/videos/render - Create and start rendering a video
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asset_id, template_id, input_props, duration_seconds, aspect_ratio } = body;

    if (!asset_id || !template_id || !input_props) {
      return NextResponse.json(
        { error: 'asset_id, template_id, and input_props are required' },
        { status: 400 }
      );
    }

    const template = videoRenderer.getTemplate(template_id);
    if (!template) {
      return NextResponse.json(
        { error: `Unknown template: ${template_id}` },
        { status: 400 }
      );
    }

    // Create video record
    const video = await videoRenderer.createVideo(
      asset_id,
      template_id,
      input_props,
      duration_seconds,
      aspect_ratio
    );

    // Start local render
    const rendering = await videoRenderer.renderLocal(video.id);

    return NextResponse.json(rendering, { status: 201 });
  } catch (error) {
    console.error('Error rendering video:', error);
    return NextResponse.json({ error: 'Failed to render video' }, { status: 500 });
  }
}
