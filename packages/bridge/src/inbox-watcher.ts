import chokidar from "chokidar";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { triageTranscript } from "./triage.js";
import { dispatchRun } from "./dispatch.js";
import { appendNdjson, initRunDir, writeMeta } from "./run-logger.js";

const BRAIN_ROOT = process.env.BRAIN_ROOT ?? process.cwd();
const INBOX_DIR = path.join(BRAIN_ROOT, "central-inbox", "inbox");
const PROCESSED_DIR = path.join(BRAIN_ROOT, "central-inbox", "processed");
const FAILED_DIR = path.join(BRAIN_ROOT, "central-inbox", "failed");

async function ensureDirs() {
  for (const dir of [INBOX_DIR, PROCESSED_DIR, FAILED_DIR]) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Wait until file size is stable (not being written to)
 */
async function waitForStableFile(fp: string, stableMs = 400, maxWaitMs = 10_000) {
  const start = Date.now();
  let lastSize = -1;
  let stableSince = Date.now();

  while (Date.now() - start < maxWaitMs) {
    try {
      const stat = await fs.stat(fp);
      if (stat.size === lastSize) {
        if (Date.now() - stableSince >= stableMs) return;
      } else {
        lastSize = stat.size;
        stableSince = Date.now();
      }
    } catch {
      // File might not exist yet
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`File never stabilized: ${fp}`);
}

function newRunId(transcript: string) {
  const h = crypto.createHash("sha256").update(transcript).digest("hex").slice(0, 12);
  const ts = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
  return `run_${ts}_${h}`;
}

async function processInboxFile(fp: string) {
  console.log(`[inbox] Processing: ${path.basename(fp)}`);

  await waitForStableFile(fp);

  const transcript = (await fs.readFile(fp, "utf8")).trim();
  if (!transcript) {
    throw new Error("Empty transcript");
  }

  const runId = newRunId(transcript);
  const runDir = await initRunDir(BRAIN_ROOT, runId);

  console.log(`[inbox] Created run: ${runId}`);

  // Log initial event
  await appendNdjson(runDir, JSON.stringify({
    type: "ingested",
    timestamp: new Date().toISOString(),
    sourceFile: path.basename(fp),
    transcriptLength: transcript.length,
  }));

  try {
    // Triage the transcript
    console.log(`[inbox] Triaging...`);
    const triage = await triageTranscript({
      runId,
      sourceFile: path.basename(fp),
      transcript,
    });

    console.log(`[inbox] Triage result: ${triage.lane} -> ${triage.agent} | "${triage.title}"`);

    await appendNdjson(runDir, JSON.stringify({
      type: "triaged",
      timestamp: new Date().toISOString(),
      triage,
    }));

    // Dispatch to appropriate agent
    await dispatchRun({
      runId,
      triage,
      transcript,
    });

    // Move to processed
    const dest = path.join(PROCESSED_DIR, `${runId}_${path.basename(fp)}`);
    await fs.rename(fp, dest).catch(async () => {
      await fs.copyFile(fp, dest);
      await fs.unlink(fp);
    });

    console.log(`[inbox] Archived to processed: ${path.basename(dest)}`);

  } catch (error) {
    // Log failure
    await appendNdjson(runDir, JSON.stringify({
      type: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    }));

    await writeMeta(runDir, {
      runId,
      state: "failed",
      error: error instanceof Error ? error.message : String(error),
      finishedAt: new Date().toISOString(),
    });

    throw error;
  }
}

export async function startInboxWatcher() {
  await ensureDirs();

  console.log(`[inbox] Watching: ${INBOX_DIR}`);
  console.log(`[inbox] Processed: ${PROCESSED_DIR}`);
  console.log(`[inbox] Failed: ${FAILED_DIR}`);

  const watcher = chokidar.watch(INBOX_DIR, {
    persistent: true,
    ignoreInitial: false, // Process existing files on startup
    awaitWriteFinish: false, // We do our own stabilization
    depth: 0,
  });

  watcher.on("add", async (fp) => {
    // Only process .txt and .md files
    if (!fp.endsWith(".txt") && !fp.endsWith(".md")) {
      return;
    }

    try {
      await processInboxFile(fp);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[inbox] Failed processing ${path.basename(fp)}:`, errorMsg);

      // Move to failed directory
      const failedPath = path.join(FAILED_DIR, path.basename(fp));
      await fs.rename(fp, failedPath).catch(() => {});
    }
  });

  watcher.on("error", (error) => {
    console.error("[inbox] Watcher error:", error);
  });

  return watcher;
}

/**
 * Process a transcript directly (for HTTP ingest)
 */
export async function processTranscript(transcript: string, sourceFile = "http-ingest.txt") {
  const runId = newRunId(transcript);
  const runDir = await initRunDir(BRAIN_ROOT, runId);

  console.log(`[ingest] Created run: ${runId}`);

  await appendNdjson(runDir, JSON.stringify({
    type: "ingested",
    timestamp: new Date().toISOString(),
    sourceFile,
    transcriptLength: transcript.length,
  }));

  const triage = await triageTranscript({
    runId,
    sourceFile,
    transcript,
  });

  console.log(`[ingest] Triage result: ${triage.lane} -> ${triage.agent} | "${triage.title}"`);

  await appendNdjson(runDir, JSON.stringify({
    type: "triaged",
    timestamp: new Date().toISOString(),
    triage,
  }));

  await dispatchRun({
    runId,
    triage,
    transcript,
  });

  return { runId, triage };
}
