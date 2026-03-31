import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { query, queryOne } from '../db/client';
import type { Project, MarketingAsset } from '../db/client';

const model = anthropic('claude-sonnet-4-20250514');

const ProductMarketingContextSchema = z.object({
  product_overview: z.string().describe('What the product does in 1-2 sentences'),
  target_audience: z.string().describe('Who this product is for'),
  personas: z.array(z.object({
    name: z.string(),
    role: z.string(),
    pain_points: z.array(z.string()),
    goals: z.array(z.string()),
  })).describe('Key user personas'),
  pain_points: z.array(z.string()).describe('Top problems the product solves'),
  positioning: z.string().describe('How the product is positioned in the market'),
  differentiation: z.array(z.string()).describe('What makes this product different'),
  objections: z.array(z.object({
    objection: z.string(),
    response: z.string(),
  })).describe('Common objections and responses'),
  customer_language: z.array(z.string()).describe('Verbatim phrases customers use to describe the problem'),
  brand_voice: z.object({
    tone: z.string(),
    personality: z.string(),
    dos: z.array(z.string()),
    donts: z.array(z.string()),
  }).describe('Brand voice guidelines'),
  proof_points: z.array(z.string()).describe('Evidence of value (metrics, testimonials, case studies)'),
  business_goals: z.array(z.string()).describe('Current business goals'),
});

export type ProductMarketingContext = z.infer<typeof ProductMarketingContextSchema>;

export class MarketingContextBuilder {
  /**
   * Build or refresh the product marketing context for a project.
   * Pulls project data from the database and uses Claude to generate
   * a structured positioning document that all marketing skills reference.
   */
  async buildContext(projectId: string): Promise<ProductMarketingContext> {
    // Fetch project data
    const project = await queryOne<Project>(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Check for existing context
    const existing = await queryOne<MarketingAsset>(
      `SELECT * FROM marketing_assets
       WHERE project_id = $1 AND asset_type = 'product_context'
       ORDER BY updated_at DESC LIMIT 1`,
      [projectId]
    );

    // Build prompt with all available project info
    const prompt = this.buildPrompt(project, existing);

    const result = await generateObject({
      model,
      schema: ProductMarketingContextSchema,
      prompt,
    });

    const context = result.object;

    // Store as marketing asset
    await this.saveContext(projectId, context, existing?.id);

    return context;
  }

  /**
   * Get existing product marketing context for a project (without regenerating).
   */
  async getContext(projectId: string): Promise<ProductMarketingContext | null> {
    const asset = await queryOne<MarketingAsset>(
      `SELECT * FROM marketing_assets
       WHERE project_id = $1 AND asset_type = 'product_context'
       ORDER BY updated_at DESC LIMIT 1`,
      [projectId]
    );

    if (!asset) return null;
    return asset.content as unknown as ProductMarketingContext;
  }

  private buildPrompt(project: Project, existing: MarketingAsset | null): string {
    const parts: string[] = [
      `Generate a comprehensive product marketing context document for the following product.`,
      ``,
      `## Product Information`,
      `- **Name**: ${project.name}`,
      `- **Description**: ${project.description || 'No description provided'}`,
      `- **Tech Stack**: ${JSON.stringify(project.tech_stack)}`,
      `- **Status**: ${project.status}`,
    ];

    if (existing) {
      parts.push(
        ``,
        `## Previous Context (update if needed)`,
        `${JSON.stringify(existing.content, null, 2)}`,
      );
    }

    parts.push(
      ``,
      `## Instructions`,
      `Create a product marketing context that will anchor all marketing activities.`,
      `Use specific, concrete language — not generic marketing speak.`,
      `If information is limited, make reasonable inferences based on the product name, description, and tech stack.`,
      `Focus on what would help a marketing agent create compelling, accurate content.`,
    );

    return parts.join('\n');
  }

  private async saveContext(
    projectId: string,
    context: ProductMarketingContext,
    existingId?: string
  ): Promise<void> {
    if (existingId) {
      await query(
        `UPDATE marketing_assets SET content = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(context), existingId]
      );
    } else {
      await query(
        `INSERT INTO marketing_assets (project_id, asset_type, title, content, status)
         VALUES ($1, 'product_context', $2, $3, 'approved')`,
        [projectId, `Product Marketing Context — ${new Date().toISOString().slice(0, 10)}`, JSON.stringify(context)]
      );
    }
  }
}

export const marketingContextBuilder = new MarketingContextBuilder();
