import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BRAIN_ROOT = process.cwd();
const RUNS_DIR = path.join(BRAIN_ROOT, "runtime", "runs");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * GET /api/runs/[runId]/stream
 *
 * Server-Sent Events stream of run events
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const runDir = path.join(RUNS_DIR, runId);
  const eventsFile = path.join(runDir, "events.ndjson");
  const metaFile = path.join(runDir, "meta.json");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial ready event
      controller.enqueue(
        encoder.encode(`event: ready\ndata: ${JSON.stringify({ runId })}\n\n`)
      );

      let position = 0;
      let isFinished = false;

      while (!isFinished) {
        try {
          // Check if run is finished
          if (fs.existsSync(metaFile)) {
            const metaContent = fs.readFileSync(metaFile, "utf8");
            const meta = JSON.parse(metaContent);
            if (meta.state === "completed" || meta.state === "failed") {
              isFinished = true;
            }
          }

          // Read new events
          if (fs.existsSync(eventsFile)) {
            const stat = fs.statSync(eventsFile);
            if (stat.size > position) {
              const fd = fs.openSync(eventsFile, "r");
              const buf = Buffer.alloc(stat.size - position);
              fs.readSync(fd, buf, 0, buf.length, position);
              fs.closeSync(fd);
              position = stat.size;

              const chunk = buf.toString("utf8");
              for (const line of chunk.split("\n")) {
                if (!line.trim()) continue;
                controller.enqueue(
                  encoder.encode(`event: log\ndata: ${JSON.stringify(line)}\n\n`)
                );
              }
            }
          }

          // If finished, send final event and close
          if (isFinished) {
            controller.enqueue(
              encoder.encode(`event: finished\ndata: ${JSON.stringify({ runId })}\n\n`)
            );
            controller.close();
            return;
          }

          await sleep(250);
        } catch (error) {
          // Log error but continue
          console.error("[stream] Error:", error);
          await sleep(1000);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
