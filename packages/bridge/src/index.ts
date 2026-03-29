import { startInboxWatcher, processTranscript } from "./inbox-watcher.js";

export { startInboxWatcher, processTranscript };
export { triageTranscript, type TriageResult } from "./triage.js";
export { dispatchRun } from "./dispatch.js";
export * from "./run-logger.js";

// CLI entry point
async function main() {
  console.log("===========================================");
  console.log("  Command Center Bridge - Inbox Watcher");
  console.log("===========================================");
  console.log("");
  console.log("Environment:");
  console.log(`  BRAIN_ROOT: ${process.env.BRAIN_ROOT ?? process.cwd()}`);
  console.log(`  PORTFOLIO_PROJECTS_DIR: ${process.env.PORTFOLIO_PROJECTS_DIR ?? "(not set)"}`);
  console.log("");

  const watcher = await startInboxWatcher();

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n[bridge] Shutting down...");
    await watcher.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n[bridge] Shutting down...");
    await watcher.close();
    process.exit(0);
  });
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("[bridge] Fatal error:", err);
    process.exit(1);
  });
}
