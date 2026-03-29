import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const BRAIN_ROOT = process.cwd();
const RUNS_DIR = path.join(BRAIN_ROOT, 'runtime', 'runs');

/**
 * GET /api/runs/[runId]
 *
 * Get details for a specific run including metadata, task, and events
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const runDir = path.join(RUNS_DIR, runId);

    // Check if run exists
    try {
      await fs.access(runDir);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Run not found' },
        { status: 404 }
      );
    }

    // Load metadata
    let meta = null;
    try {
      const metaPath = path.join(runDir, 'meta.json');
      const content = await fs.readFile(metaPath, 'utf8');
      meta = JSON.parse(content);
    } catch {
      // No metadata
    }

    // Load task
    let task = null;
    try {
      const taskPath = path.join(runDir, 'task.json');
      const content = await fs.readFile(taskPath, 'utf8');
      task = JSON.parse(content);
    } catch {
      // No task
    }

    // Load events (last 100 lines)
    let events: unknown[] = [];
    try {
      const eventsPath = path.join(runDir, 'events.ndjson');
      const content = await fs.readFile(eventsPath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      events = lines.slice(-100).map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return { raw: line };
        }
      });
    } catch {
      // No events
    }

    return NextResponse.json({
      success: true,
      data: {
        runId,
        meta,
        task,
        events,
        eventCount: events.length,
      },
    });
  } catch (error) {
    console.error('[runs] Error getting run:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
