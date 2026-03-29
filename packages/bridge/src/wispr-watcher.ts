/**
 * Wispr Flow File Watcher
 *
 * Watches a directory for text files output by Wispr Flow and automatically
 * ingests them into the Command Center inbox.
 *
 * Usage:
 *   WISPR_OUTPUT_DIR=/path/to/wispr/output npm run wispr
 *
 * Wispr Flow Configuration:
 *   Configure Wispr Flow to output transcripts to a text file in the watched directory.
 *   The watcher will pick up new files and process them.
 */

import chokidar from "chokidar";
import fs from "fs/promises";
import path from "path";
import { processTranscript } from "./inbox-watcher.js";

const WISPR_OUTPUT_DIR = process.env.WISPR_OUTPUT_DIR || path.join(process.cwd(), "wispr-inbox");
const WISPR_PROCESSED_DIR = path.join(WISPR_OUTPUT_DIR, ".processed");

// File patterns to watch
const WATCH_PATTERNS = ["*.txt", "*.md", "transcript_*.txt"];

// Minimum file size to process (avoid empty files)
const MIN_FILE_SIZE = 10;

// Debounce time in ms (wait for file to finish writing)
const DEBOUNCE_MS = 500;

// Track files being processed to avoid duplicates
const processingFiles = new Set<string>();

async function ensureDirectories(): Promise<void> {
  await fs.mkdir(WISPR_OUTPUT_DIR, { recursive: true });
  await fs.mkdir(WISPR_PROCESSED_DIR, { recursive: true });
}

async function processWisprFile(filePath: string): Promise<void> {
  const fileName = path.basename(filePath);

  // Skip if already processing
  if (processingFiles.has(filePath)) {
    return;
  }

  // Skip processed directory
  if (filePath.includes(".processed")) {
    return;
  }

  processingFiles.add(filePath);

  try {
    // Wait for file to finish writing
    await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS));

    // Check file still exists
    const stats = await fs.stat(filePath);
    if (stats.size < MIN_FILE_SIZE) {
      console.log(`[wispr] Skipping ${fileName}: file too small`);
      return;
    }

    // Read file content
    const content = await fs.readFile(filePath, "utf-8");
    const transcript = content.trim();

    if (!transcript) {
      console.log(`[wispr] Skipping ${fileName}: empty content`);
      return;
    }

    console.log(`[wispr] Processing: ${fileName}`);
    console.log(`[wispr] Content: ${transcript.slice(0, 100)}...`);

    // Process as inbox transcript
    await processTranscript(filePath, transcript);

    // Move to processed directory
    const processedPath = path.join(WISPR_PROCESSED_DIR, `${Date.now()}_${fileName}`);
    await fs.rename(filePath, processedPath);
    console.log(`[wispr] Moved to: ${processedPath}`);
  } catch (error) {
    console.error(`[wispr] Error processing ${fileName}:`, error);
  } finally {
    processingFiles.delete(filePath);
  }
}

export async function startWisprWatcher(): Promise<void> {
  await ensureDirectories();

  console.log(`[wispr] Watching directory: ${WISPR_OUTPUT_DIR}`);
  console.log(`[wispr] Patterns: ${WATCH_PATTERNS.join(", ")}`);

  const watcher = chokidar.watch(WATCH_PATTERNS, {
    cwd: WISPR_OUTPUT_DIR,
    ignored: [
      /(^|[\/\\])\../, // Ignore dotfiles
      "**/node_modules/**",
      "**/.processed/**",
    ],
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher
    .on("add", (relativePath) => {
      const fullPath = path.join(WISPR_OUTPUT_DIR, relativePath);
      console.log(`[wispr] New file detected: ${relativePath}`);
      processWisprFile(fullPath);
    })
    .on("change", (relativePath) => {
      const fullPath = path.join(WISPR_OUTPUT_DIR, relativePath);
      console.log(`[wispr] File changed: ${relativePath}`);
      processWisprFile(fullPath);
    })
    .on("error", (error) => {
      console.error("[wispr] Watcher error:", error);
    })
    .on("ready", () => {
      console.log("[wispr] Initial scan complete. Watching for changes...");
    });

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n[wispr] Shutting down...");
    await watcher.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n[wispr] Shutting down...");
    await watcher.close();
    process.exit(0);
  });
}

// Run if called directly
const isMainModule = process.argv[1]?.endsWith("wispr-watcher.js") ||
                     process.argv[1]?.endsWith("wispr-watcher.ts");

if (isMainModule) {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  Wispr Flow File Watcher                     ║
║                                                              ║
║  Watching for Wispr Flow text outputs...                     ║
║                                                              ║
║  To use:                                                     ║
║  1. Configure Wispr Flow to output to: ${WISPR_OUTPUT_DIR.slice(0, 30)}...
║  2. Speak into Wispr Flow                                    ║
║  3. Transcripts will be auto-ingested                        ║
║                                                              ║
║  Press Ctrl+C to stop                                        ║
╚══════════════════════════════════════════════════════════════╝
`);

  startWisprWatcher().catch((error) => {
    console.error("[wispr] Fatal error:", error);
    process.exit(1);
  });
}
