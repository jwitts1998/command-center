import { spawn } from "child_process";
import path from "path";

export type TriageResult = {
  lane: "strategic" | "technical" | "growth";
  agent: "ceo" | "cto" | "cmo";
  title: string;
  summary: string;
  acceptance_criteria: string[];
  requested_repo?: string;
  requires_computer_use: boolean;
};

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

export async function triageTranscript(input: {
  runId: string;
  sourceFile: string;
  transcript: string;
}): Promise<TriageResult> {
  const brainRoot = process.env.BRAIN_ROOT ?? process.cwd();
  const triagePromptFile = path.join(brainRoot, "c-suite", "system-prompts", "TRIAGE.system.md");

  const prompt = [
    `RUN_ID: ${input.runId}`,
    `SOURCE_FILE: ${input.sourceFile}`,
    "",
    "TRANSCRIPT:",
    input.transcript,
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
      { env: process.env }
    );

    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d.toString("utf8")));
    child.stderr.on("data", (d) => (err += d.toString("utf8")));

    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`triage failed: ${code}\n${err}`));
      try {
        // Parse the JSON output - Claude CLI returns the result directly
        const parsed = JSON.parse(out);
        // The result might be wrapped in a result object or be direct
        const result = parsed.result ?? parsed;
        resolve(result as TriageResult);
      } catch (e) {
        reject(new Error(`triage invalid JSON: ${String(e)}\n${out}`));
      }
    });
  });
}
