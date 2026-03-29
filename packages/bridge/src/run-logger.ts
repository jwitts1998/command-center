import fs from "fs/promises";
import path from "path";

export async function initRunDir(brainRoot: string, runId: string) {
  const runDir = path.join(brainRoot, "runtime", "runs", runId);
  await fs.mkdir(runDir, { recursive: true });
  return runDir;
}

export async function appendNdjson(runDir: string, line: string) {
  const fp = path.join(runDir, "events.ndjson");
  await fs.appendFile(fp, line.endsWith("\n") ? line : `${line}\n`, "utf8");
}

export async function writeMeta(runDir: string, meta: Record<string, unknown>) {
  const fp = path.join(runDir, "meta.json");
  await fs.writeFile(fp, JSON.stringify(meta, null, 2));
}

export async function writeTask(runDir: string, task: Record<string, unknown>) {
  const fp = path.join(runDir, "task.json");
  await fs.writeFile(fp, JSON.stringify(task, null, 2));
}

export async function readMeta(runDir: string): Promise<Record<string, unknown> | null> {
  try {
    const fp = path.join(runDir, "meta.json");
    const content = await fs.readFile(fp, "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}
