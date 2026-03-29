import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const BRAIN_ROOT = process.cwd();

const TRIAGE_SCHEMA = JSON.stringify({
  type: "object",
  additionalProperties: false,
  required: ["lane", "agent", "title", "summary", "acceptance_criteria", "requires_computer_use"],
  properties: {
    lane: { type: "string", enum: ["strategic", "technical", "growth"] },
    agent: { type: "string", enum: ["ceo", "cto", "cmo"] },
    title: { type: "string", minLength: 3, maxLength: 120 },
    summary: { type: "string", minLength: 10, maxLength: 800 },
    acceptance_criteria: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string", minLength: 5, maxLength: 200 },
    },
    requested_repo: { type: "string" },
    requires_computer_use: { type: "boolean" },
  },
});

function newRunId(transcript: string) {
  const h = crypto.createHash("sha256").update(transcript).digest("hex").slice(0, 12);
  const ts = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
  return `run_${ts}_${h}`;
}

async function initRunDir(runId: string) {
  const runDir = path.join(BRAIN_ROOT, "runtime", "runs", runId);
  await fs.mkdir(runDir, { recursive: true });
  return runDir;
}

async function appendNdjson(runDir: string, line: string) {
  const fp = path.join(runDir, "events.ndjson");
  await fs.appendFile(fp, line.endsWith("\n") ? line : `${line}\n`, "utf8");
}

async function writeMeta(runDir: string, meta: Record<string, unknown>) {
  const fp = path.join(runDir, "meta.json");
  await fs.writeFile(fp, JSON.stringify(meta, null, 2));
}

async function writeTask(runDir: string, task: Record<string, unknown>) {
  const fp = path.join(runDir, "task.json");
  await fs.writeFile(fp, JSON.stringify(task, null, 2));
}

type TriageResult = {
  lane: "strategic" | "technical" | "growth";
  agent: "ceo" | "cto" | "cmo";
  title: string;
  summary: string;
  acceptance_criteria: string[];
  requested_repo?: string;
  requires_computer_use: boolean;
};

async function triageTranscript(runId: string, transcript: string): Promise<TriageResult> {
  const triagePromptFile = path.join(BRAIN_ROOT, "c-suite", "system-prompts", "TRIAGE.system.md");

  const prompt = [
    `RUN_ID: ${runId}`,
    `SOURCE: http-ingest`,
    "",
    "TRANSCRIPT:",
    transcript,
  ].join("\n");

  return new Promise((resolve, reject) => {
    const child = spawn(
      "claude",
      [
        "-p",
        "--append-system-prompt-file",
        triagePromptFile,
        "--output-format",
        "json",
        "--json-schema",
        TRIAGE_SCHEMA,
        prompt,
      ],
      { env: process.env, cwd: BRAIN_ROOT }
    );

    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d.toString("utf8")));
    child.stderr.on("data", (d) => (err += d.toString("utf8")));

    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`triage failed: ${code}\n${err}`));
      try {
        const parsed = JSON.parse(out);
        const result = parsed.result ?? parsed;
        resolve(result as TriageResult);
      } catch (e) {
        reject(new Error(`triage invalid JSON: ${String(e)}\n${out}`));
      }
    });
  });
}

/**
 * POST /api/inbox/ingest
 *
 * Accepts a transcript and processes it through the triage -> dispatch pipeline.
 * This is an alternative to dropping files in central-inbox/inbox/
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript } = body;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { success: false, error: 'transcript is required' },
        { status: 400 }
      );
    }

    const trimmedTranscript = transcript.trim();
    if (!trimmedTranscript) {
      return NextResponse.json(
        { success: false, error: 'transcript cannot be empty' },
        { status: 400 }
      );
    }

    // Create run
    const runId = newRunId(trimmedTranscript);
    const runDir = await initRunDir(runId);

    console.log(`[ingest] Created run: ${runId}`);

    // Log initial event
    await appendNdjson(runDir, JSON.stringify({
      type: "ingested",
      timestamp: new Date().toISOString(),
      source: "http-ingest",
      transcriptLength: trimmedTranscript.length,
    }));

    // Triage
    console.log(`[ingest] Triaging...`);
    let triage: TriageResult;
    try {
      triage = await triageTranscript(runId, trimmedTranscript);
    } catch (error) {
      await appendNdjson(runDir, JSON.stringify({
        type: "error",
        timestamp: new Date().toISOString(),
        phase: "triage",
        error: error instanceof Error ? error.message : String(error),
      }));

      await writeMeta(runDir, {
        runId,
        state: "failed",
        phase: "triage",
        error: error instanceof Error ? error.message : String(error),
        finishedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: false,
        runId,
        error: 'Triage failed',
        details: error instanceof Error ? error.message : String(error),
      }, { status: 500 });
    }

    console.log(`[ingest] Triage result: ${triage.lane} -> ${triage.agent} | "${triage.title}"`);

    await appendNdjson(runDir, JSON.stringify({
      type: "triaged",
      timestamp: new Date().toISOString(),
      triage,
    }));

    // Write metadata
    await writeMeta(runDir, {
      runId,
      createdAt: new Date().toISOString(),
      triage,
      state: triage.requires_computer_use ? "pending_confirmation" : "queued",
    });

    await writeTask(runDir, {
      runId,
      triage,
      transcript: trimmedTranscript,
    });

    // If requires computer use, don't auto-dispatch
    if (triage.requires_computer_use) {
      await appendNdjson(runDir, JSON.stringify({
        type: "blocked",
        timestamp: new Date().toISOString(),
        reason: "requires_computer_use",
        message: "This task requires GUI automation. Please confirm before proceeding.",
      }));

      return NextResponse.json({
        success: true,
        runId,
        triage,
        state: "pending_confirmation",
        message: "Task requires computer use - awaiting confirmation",
      });
    }

    // For now, we just queue the task - dispatch happens via bridge watcher
    // or can be triggered separately. This keeps the API fast.
    return NextResponse.json({
      success: true,
      runId,
      triage,
      state: "queued",
      message: `Task triaged and queued for ${triage.agent}`,
    });

  } catch (error) {
    console.error('[ingest] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/inbox/ingest
 *
 * Returns info about the ingest endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/inbox/ingest',
    method: 'POST',
    description: 'Submit a transcript for triage and dispatch to C-Suite agents',
    body: {
      transcript: 'string (required) - The voice transcript or task description',
    },
    response: {
      success: 'boolean',
      runId: 'string - Unique run identifier',
      triage: {
        lane: 'strategic | technical | growth',
        agent: 'ceo | cto | cmo',
        title: 'string',
        summary: 'string',
        acceptance_criteria: 'string[]',
        requires_computer_use: 'boolean',
      },
      state: 'queued | pending_confirmation',
    },
  });
}
