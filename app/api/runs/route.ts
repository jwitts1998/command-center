import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const BRAIN_ROOT = process.cwd();
const RUNS_DIR = path.join(BRAIN_ROOT, 'runtime', 'runs');

interface RunMeta {
  runId: string;
  createdAt?: string;
  finishedAt?: string;
  state?: string;
  triage?: {
    lane: string;
    agent: string;
    title: string;
    summary: string;
  };
  exitCode?: number;
  error?: string;
}

/**
 * GET /api/runs
 *
 * List all runs with their metadata
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const state = searchParams.get('state');

    // Ensure runs directory exists
    await fs.mkdir(RUNS_DIR, { recursive: true });

    // List all run directories
    const entries = await fs.readdir(RUNS_DIR, { withFileTypes: true });
    const runDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

    // Load metadata for each run
    const runs: RunMeta[] = [];

    for (const runId of runDirs) {
      try {
        const metaPath = path.join(RUNS_DIR, runId, 'meta.json');
        const content = await fs.readFile(metaPath, 'utf8');
        const meta = JSON.parse(content) as RunMeta;

        // Filter by state if specified
        if (state && meta.state !== state) {
          continue;
        }

        runs.push(meta);
      } catch {
        // Skip runs without valid metadata
      }
    }

    // Sort by createdAt descending (newest first)
    runs.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // Apply limit
    const limitedRuns = runs.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: limitedRuns,
      total: runs.length,
    });
  } catch (error) {
    console.error('[runs] Error listing runs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
