import { NextResponse } from 'next/server';
import { videoRenderer } from '@/lib/services/VideoRenderer';

// GET /api/marketing/videos/templates - List available Remotion templates
export async function GET() {
  const templates = videoRenderer.listTemplates();
  return NextResponse.json(templates);
}
