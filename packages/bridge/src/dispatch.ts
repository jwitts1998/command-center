import { spawn } from "child_process";
import path from "path";
import { initRunDir, appendNdjson, writeMeta, writeTask } from "./run-logger.js";
import type { TriageResult } from "./triage.js";

type DispatchInput = {
  runId: string;
  triage: TriageResult;
  transcript: string;
};

function agentPromptFile(brainRoot: string, agent: "ceo" | "cto" | "cmo") {
  const map = {
    ceo: "CEO.system.md",
    cto: "CTO.system.md",
    cmo: "CMO.system.md",
  } as const;
  return path.join(brainRoot, "c-suite", "system-prompts", map[agent]);
}

export async function dispatchRun(input: DispatchInput): Promise<void> {
  const brainRoot = process.env.BRAIN_ROOT ?? process.cwd();
  const runDir = await initRunDir(brainRoot, input.runId);

  // Write initial metadata
  await writeMeta(runDir, {
    runId: input.runId,
    createdAt: new Date().toISOString(),
    triage: input.triage,
    state: "running",
  });

  // Write task details
  await writeTask(runDir, {
    runId: input.runId,
    triage: input.triage,
    transcript: input.transcript,
  });

  // Log dispatch event
  await appendNdjson(runDir, JSON.stringify({
    type: "dispatch",
    timestamp: new Date().toISOString(),
    agent: input.triage.agent,
    lane: input.triage.lane,
    title: input.triage.title,
  }));

  // Check for computer use requirement
  if (input.triage.requires_computer_use) {
    await writeMeta(runDir, {
      runId: input.runId,
      createdAt: new Date().toISOString(),
      triage: input.triage,
      state: "pending_confirmation",
      reason: "Task requires computer use - awaiting human confirmation",
    });

    await appendNdjson(runDir, JSON.stringify({
      type: "blocked",
      timestamp: new Date().toISOString(),
      reason: "requires_computer_use",
      message: "This task requires GUI automation. Please confirm before proceeding.",
    }));

    console.log(`[dispatch] Run ${input.runId} requires computer use - marked for confirmation`);
    return;
  }

  // Determine working directory
  const repoCwd =
    input.triage.requested_repo && process.env.PORTFOLIO_PROJECTS_DIR
      ? path.join(process.env.PORTFOLIO_PROJECTS_DIR, input.triage.requested_repo)
      : brainRoot;

  const sysPromptFile = agentPromptFile(brainRoot, input.triage.agent);

  const baseArgs = [
    "-p",
    "--append-system-prompt-file",
    sysPromptFile,
    "--output-format",
    "stream-json",
  ];

  const prompt = [
    `TITLE: ${input.triage.title}`,
    `SUMMARY: ${input.triage.summary}`,
    `ACCEPTANCE_CRITERIA:\n- ${input.triage.acceptance_criteria.join("\n- ")}`,
    "",
    "RAW_TRANSCRIPT:",
    input.transcript,
  ].join("\n");

  console.log(`[dispatch] Starting ${input.triage.agent} agent for run ${input.runId}`);

  const child = spawn("claude", [...baseArgs, prompt], {
    cwd: repoCwd,
    env: {
      ...process.env,
    },
  });

  child.stdout.on("data", async (chunk) => {
    const text = chunk.toString("utf8");
    // Each line from stream-json should be logged
    for (const line of text.split("\n")) {
      if (line.trim()) {
        await appendNdjson(runDir, line);
      }
    }
  });

  child.stderr.on("data", async (chunk) => {
    const text = chunk.toString("utf8");
    await appendNdjson(runDir, JSON.stringify({
      type: "stderr",
      timestamp: new Date().toISOString(),
      text,
    }));
  });

  child.on("close", async (code) => {
    const state = code === 0 ? "completed" : "failed";
    await writeMeta(runDir, {
      runId: input.runId,
      finishedAt: new Date().toISOString(),
      exitCode: code,
      state,
      triage: input.triage,
    });

    await appendNdjson(runDir, JSON.stringify({
      type: "finished",
      timestamp: new Date().toISOString(),
      exitCode: code,
      state,
    }));

    console.log(`[dispatch] Run ${input.runId} ${state} with exit code ${code}`);
  });
}
