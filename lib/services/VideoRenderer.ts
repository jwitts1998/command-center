import { query, queryOne } from '../db/client';
import type { MarketingVideo } from '../db/client';

// Template registry (mirrors packages/remotion/src/compositions/index.ts)
const templates = {
  SocialClip: {
    id: 'SocialClip',
    name: 'Social Clip',
    description: 'Short-form content for Instagram Reels, TikTok, LinkedIn, X (15-60s)',
    defaultAspectRatio: '9:16',
    supportedAspectRatios: ['9:16', '1:1', '16:9'],
    defaultDurationSeconds: 30,
    defaultConfig: { fps: 30, width: 1080, height: 1920, codec: 'h264' },
    category: 'social',
  },
  ProductDemo: {
    id: 'ProductDemo',
    name: 'Product Demo',
    description: 'Product walkthrough with feature highlights (60-180s)',
    defaultAspectRatio: '16:9',
    supportedAspectRatios: ['16:9'],
    defaultDurationSeconds: 90,
    defaultConfig: { fps: 30, width: 1920, height: 1080, codec: 'h264' },
    category: 'demo',
  },
  AdCreative: {
    id: 'AdCreative',
    name: 'Ad Creative',
    description: 'Paid ad formats for Meta, Google, YouTube, LinkedIn (15-30s)',
    defaultAspectRatio: '1:1',
    supportedAspectRatios: ['1:1', '4:5', '9:16', '16:9'],
    defaultDurationSeconds: 15,
    defaultConfig: { fps: 30, width: 1080, height: 1080, codec: 'h264' },
    category: 'ads',
  },
} as const;

type TemplateId = keyof typeof templates;

const ASPECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '16:9': { width: 1920, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
};

export class VideoRenderer {
  /**
   * List available Remotion templates with their prop schemas and default configs.
   */
  listTemplates() {
    return Object.values(templates);
  }

  /**
   * Get a specific template by ID.
   */
  getTemplate(templateId: string) {
    return templates[templateId as TemplateId] || null;
  }

  /**
   * Create a video record in the database (draft state).
   */
  async createVideo(
    assetId: string,
    templateId: string,
    inputProps: Record<string, unknown>,
    durationSeconds?: number,
    aspectRatio?: string
  ): Promise<MarketingVideo> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Unknown template: ${templateId}`);
    }

    const dimensions = aspectRatio
      ? ASPECT_DIMENSIONS[aspectRatio] || template.defaultConfig
      : { width: template.defaultConfig.width, height: template.defaultConfig.height };

    const renderConfig = {
      fps: template.defaultConfig.fps,
      width: dimensions.width,
      height: dimensions.height,
      codec: template.defaultConfig.codec,
      outputFormat: 'mp4',
    };

    const video = await queryOne<MarketingVideo>(
      `INSERT INTO marketing_videos (asset_id, template_id, input_props, render_config, duration_seconds)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        assetId,
        templateId,
        JSON.stringify(inputProps),
        JSON.stringify(renderConfig),
        durationSeconds || template.defaultDurationSeconds,
      ]
    );

    if (!video) throw new Error('Failed to create video record');
    return video;
  }

  /**
   * Start a local render via Remotion CLI.
   * In production, this would use Remotion Lambda.
   */
  async renderLocal(videoId: string): Promise<MarketingVideo> {
    const video = await queryOne<MarketingVideo>(
      'SELECT * FROM marketing_videos WHERE id = $1',
      [videoId]
    );
    if (!video) throw new Error(`Video ${videoId} not found`);

    // Update status to rendering
    await query(
      `UPDATE marketing_videos SET render_status = 'rendering' WHERE id = $1`,
      [videoId]
    );

    // In a real implementation, this would shell out to:
    // npx remotion render <compositionId> --props '<JSON>' --output <path>
    // For now, we record the intent and return
    const outputPath = `runtime/renders/${videoId}.mp4`;

    const updated = await queryOne<MarketingVideo>(
      `UPDATE marketing_videos
       SET render_status = 'rendering',
           output_url = $1,
           render_log = $2
       WHERE id = $3
       RETURNING *`,
      [
        outputPath,
        JSON.stringify({
          mode: 'local',
          startedAt: new Date().toISOString(),
          command: `npx remotion render ${video.template_id} --props '${JSON.stringify(video.input_props)}' --output ${outputPath}`,
        }),
        videoId,
      ]
    );

    return updated!;
  }

  /**
   * Get render status for a video.
   */
  async getStatus(videoId: string): Promise<MarketingVideo | null> {
    return queryOne<MarketingVideo>(
      'SELECT * FROM marketing_videos WHERE id = $1',
      [videoId]
    );
  }
}

export const videoRenderer = new VideoRenderer();
