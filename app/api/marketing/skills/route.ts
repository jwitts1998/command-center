import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

const SKILLS_DIR = join(process.cwd(), 'c-suite/marketing-skills');

const CATEGORY_LABELS: Record<string, string> = {
  content: 'Content & Copywriting',
  cro: 'Conversion Optimization',
  seo: 'SEO & Discovery',
  strategy: 'Strategy & Research',
  growth: 'Retention & Growth',
  ops: 'Marketing Ops',
  foundation: 'Foundation',
};

// GET /api/marketing/skills - List available marketing skills
export async function GET() {
  try {
    const categories = await readdir(SKILLS_DIR);
    const skills: Array<{
      category: string;
      categoryLabel: string;
      skills: Array<{ name: string; file: string }>;
    }> = [];

    for (const category of categories) {
      const categoryPath = join(SKILLS_DIR, category);
      try {
        const files = await readdir(categoryPath);
        const skillList = files
          .filter(f => f.endsWith('.md'))
          .map(f => ({
            name: f.replace('.md', ''),
            file: `c-suite/marketing-skills/${category}/${f}`,
          }));

        if (skillList.length > 0) {
          skills.push({
            category,
            categoryLabel: CATEGORY_LABELS[category] || category,
            skills: skillList,
          });
        }
      } catch {
        // Skip if directory doesn't exist
      }
    }

    return NextResponse.json({
      total: skills.reduce((sum, cat) => sum + cat.skills.length, 0),
      categories: skills,
    });
  } catch (error) {
    console.error('Error listing skills:', error);
    return NextResponse.json({ error: 'Failed to list skills' }, { status: 500 });
  }
}
