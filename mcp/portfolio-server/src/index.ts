#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";

// Configuration
const BRAIN_ROOT = process.env.BRAIN_ROOT || process.cwd();
const REGISTRY_PATH = path.join(BRAIN_ROOT, "runtime", "registry.json");
const STATUS_PATH = path.join(BRAIN_ROOT, "runtime", "status.json");
const LOCKS_DIR = path.join(BRAIN_ROOT, "runtime", "locks");

// Types
interface RepoEntry {
  id: string;
  name: string;
  path: string;
  gitUrl?: string;
  registeredAt: string;
  lastStatusUpdate?: string;
  status?: RepoStatus;
}

interface RepoStatus {
  phase: string;
  currentTask?: string;
  blockers: string[];
  lastUpdated: string;
  health: "healthy" | "warning" | "error" | "unknown";
}

interface Registry {
  repos: RepoEntry[];
  updatedAt: string;
}

interface GlobalStatus {
  updatedAt: string;
  repos: Array<RepoEntry & { status: RepoStatus }>;
  summary: {
    total: number;
    healthy: number;
    warning: number;
    error: number;
    unknown: number;
  };
}

interface Lock {
  holder: string;
  resource: string;
  acquiredAt: string;
  expiresAt?: string;
  reason?: string;
}

// Helper functions
async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJson<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function getRegistry(): Promise<Registry> {
  return readJson<Registry>(REGISTRY_PATH, { repos: [], updatedAt: new Date().toISOString() });
}

async function saveRegistry(registry: Registry): Promise<void> {
  registry.updatedAt = new Date().toISOString();
  await writeJson(REGISTRY_PATH, registry);
}

// Create MCP Server
const server = new McpServer({
  name: "portfolio-server",
  version: "1.0.0",
});

// ============================================================================
// REPO REGISTRY TOOLS
// ============================================================================

server.tool(
  "register_repo",
  "Register a new repository in the portfolio",
  {
    name: z.string().describe("Human-readable name for the repo"),
    path: z.string().describe("Absolute path to the repo on disk"),
    gitUrl: z.string().optional().describe("Git remote URL (optional)"),
  },
  async ({ name, path: repoPath, gitUrl }) => {
    const registry = await getRegistry();

    // Check if already registered
    const existing = registry.repos.find(r => r.path === repoPath);
    if (existing) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: `Repo already registered with id: ${existing.id}`,
              repo: existing,
            }),
          },
        ],
      };
    }

    // Generate ID
    const id = `repo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const newRepo: RepoEntry = {
      id,
      name,
      path: repoPath,
      gitUrl,
      registeredAt: new Date().toISOString(),
    };

    registry.repos.push(newRepo);
    await saveRegistry(registry);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            repo: newRepo,
          }),
        },
      ],
    };
  }
);

server.tool(
  "list_repos",
  "List all registered repositories in the portfolio",
  {},
  async () => {
    const registry = await getRegistry();

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            count: registry.repos.length,
            repos: registry.repos,
            updatedAt: registry.updatedAt,
          }),
        },
      ],
    };
  }
);

server.tool(
  "unregister_repo",
  "Remove a repository from the portfolio registry",
  {
    id: z.string().describe("The repo ID to unregister"),
  },
  async ({ id }) => {
    const registry = await getRegistry();
    const index = registry.repos.findIndex(r => r.id === id);

    if (index === -1) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: `Repo not found with id: ${id}`,
            }),
          },
        ],
      };
    }

    const removed = registry.repos.splice(index, 1)[0];
    await saveRegistry(registry);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            removed,
          }),
        },
      ],
    };
  }
);

// ============================================================================
// STATUS TOOLS
// ============================================================================

server.tool(
  "report_status",
  "Report status from an execution repo to the Brain",
  {
    repoId: z.string().describe("The repo ID reporting status"),
    phase: z.string().describe("Current phase (e.g., 'development', 'testing', 'deployed')"),
    currentTask: z.string().optional().describe("Current task being worked on"),
    blockers: z.array(z.string()).default([]).describe("List of blockers"),
    health: z.enum(["healthy", "warning", "error", "unknown"]).default("healthy"),
  },
  async ({ repoId, phase, currentTask, blockers, health }) => {
    const registry = await getRegistry();
    const repo = registry.repos.find(r => r.id === repoId);

    if (!repo) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: `Repo not found with id: ${repoId}`,
            }),
          },
        ],
      };
    }

    const status: RepoStatus = {
      phase,
      currentTask,
      blockers,
      health,
      lastUpdated: new Date().toISOString(),
    };

    repo.status = status;
    repo.lastStatusUpdate = status.lastUpdated;
    await saveRegistry(registry);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            repoId,
            status,
          }),
        },
      ],
    };
  }
);

server.tool(
  "audit_all",
  "Audit all registered repos by reading their local status.json files",
  {},
  async () => {
    const registry = await getRegistry();
    const results: Array<{ repoId: string; name: string; status: RepoStatus | null; error?: string }> = [];

    for (const repo of registry.repos) {
      const statusPath = path.join(repo.path, "status", "status.json");
      try {
        const localStatus = await readJson<{
          phase?: string;
          currentTask?: string;
          blockers?: string[];
          health?: string;
          updatedAt?: string;
        }>(statusPath, {});

        if (localStatus.phase) {
          const status: RepoStatus = {
            phase: localStatus.phase,
            currentTask: localStatus.currentTask,
            blockers: localStatus.blockers || [],
            health: (localStatus.health as RepoStatus["health"]) || "unknown",
            lastUpdated: localStatus.updatedAt || new Date().toISOString(),
          };

          // Update registry with audited status
          repo.status = status;
          repo.lastStatusUpdate = status.lastUpdated;

          results.push({ repoId: repo.id, name: repo.name, status });
        } else {
          results.push({ repoId: repo.id, name: repo.name, status: null, error: "No status.json found or empty" });
        }
      } catch (err) {
        results.push({
          repoId: repo.id,
          name: repo.name,
          status: null,
          error: `Failed to read status: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    await saveRegistry(registry);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            audited: results.length,
            results,
          }),
        },
      ],
    };
  }
);

server.tool(
  "rebuild_global_status",
  "Rebuild the global status.json rollup from all repo statuses",
  {},
  async () => {
    const registry = await getRegistry();

    const summary = {
      total: registry.repos.length,
      healthy: 0,
      warning: 0,
      error: 0,
      unknown: 0,
    };

    const reposWithStatus = registry.repos.map(repo => {
      const status = repo.status || {
        phase: "unknown",
        blockers: [],
        health: "unknown" as const,
        lastUpdated: new Date().toISOString(),
      };

      summary[status.health]++;

      return { ...repo, status };
    });

    const globalStatus: GlobalStatus = {
      updatedAt: new Date().toISOString(),
      repos: reposWithStatus,
      summary,
    };

    await writeJson(STATUS_PATH, globalStatus);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            statusPath: STATUS_PATH,
            summary,
          }),
        },
      ],
    };
  }
);

server.tool(
  "get_global_status",
  "Get the current global portfolio status",
  {},
  async () => {
    const globalStatus = await readJson<GlobalStatus>(STATUS_PATH, {
      updatedAt: new Date().toISOString(),
      repos: [],
      summary: { total: 0, healthy: 0, warning: 0, error: 0, unknown: 0 },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(globalStatus),
        },
      ],
    };
  }
);

// ============================================================================
// LOCKING TOOLS
// ============================================================================

server.tool(
  "acquire_lock",
  "Acquire a lock on a resource to prevent concurrent modifications",
  {
    resource: z.string().describe("Resource identifier (e.g., 'repo:myapp:package.json')"),
    holder: z.string().describe("Identity of the lock holder (e.g., 'cto:run_123')"),
    reason: z.string().optional().describe("Reason for acquiring the lock"),
    ttlSeconds: z.number().optional().default(300).describe("Lock TTL in seconds (default 5 minutes)"),
  },
  async ({ resource, holder, reason, ttlSeconds }) => {
    await ensureDir(LOCKS_DIR);

    // Sanitize resource name for filename
    const lockFile = path.join(LOCKS_DIR, `${resource.replace(/[^a-zA-Z0-9_-]/g, "_")}.lock`);

    // Check if lock exists and is still valid
    try {
      const existingLock = await readJson<Lock>(lockFile, null as unknown as Lock);
      if (existingLock) {
        const expiresAt = existingLock.expiresAt ? new Date(existingLock.expiresAt) : null;
        if (!expiresAt || expiresAt > new Date()) {
          // Lock is still valid
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error: "Resource is locked",
                  currentLock: existingLock,
                }),
              },
            ],
          };
        }
        // Lock has expired, we can take it
      }
    } catch {
      // No existing lock, proceed
    }

    const now = new Date();
    const lock: Lock = {
      holder,
      resource,
      acquiredAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlSeconds * 1000).toISOString(),
      reason,
    };

    await writeJson(lockFile, lock);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            lock,
          }),
        },
      ],
    };
  }
);

server.tool(
  "release_lock",
  "Release a previously acquired lock",
  {
    resource: z.string().describe("Resource identifier"),
    holder: z.string().describe("Identity of the lock holder (must match)"),
  },
  async ({ resource, holder }) => {
    const lockFile = path.join(LOCKS_DIR, `${resource.replace(/[^a-zA-Z0-9_-]/g, "_")}.lock`);

    try {
      const existingLock = await readJson<Lock>(lockFile, null as unknown as Lock);

      if (!existingLock) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: "Lock not found",
              }),
            },
          ],
        };
      }

      if (existingLock.holder !== holder) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: "Lock held by different holder",
                currentHolder: existingLock.holder,
              }),
            },
          ],
        };
      }

      await fs.unlink(lockFile);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              released: existingLock,
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: `Failed to release lock: ${err instanceof Error ? err.message : String(err)}`,
            }),
          },
        ],
      };
    }
  }
);

server.tool(
  "list_locks",
  "List all active locks",
  {},
  async () => {
    await ensureDir(LOCKS_DIR);

    const files = await fs.readdir(LOCKS_DIR);
    const locks: Lock[] = [];
    const expired: string[] = [];

    for (const file of files) {
      if (!file.endsWith(".lock")) continue;

      const lockPath = path.join(LOCKS_DIR, file);
      const lock = await readJson<Lock>(lockPath, null as unknown as Lock);

      if (lock) {
        const expiresAt = lock.expiresAt ? new Date(lock.expiresAt) : null;
        if (expiresAt && expiresAt <= new Date()) {
          expired.push(lock.resource);
          await fs.unlink(lockPath); // Clean up expired lock
        } else {
          locks.push(lock);
        }
      }
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            active: locks.length,
            locks,
            expiredAndCleaned: expired,
          }),
        },
      ],
    };
  }
);

server.tool(
  "check_lock",
  "Check if a resource is currently locked",
  {
    resource: z.string().describe("Resource identifier to check"),
  },
  async ({ resource }) => {
    const lockFile = path.join(LOCKS_DIR, `${resource.replace(/[^a-zA-Z0-9_-]/g, "_")}.lock`);

    try {
      const lock = await readJson<Lock>(lockFile, null as unknown as Lock);

      if (!lock) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                locked: false,
                resource,
              }),
            },
          ],
        };
      }

      const expiresAt = lock.expiresAt ? new Date(lock.expiresAt) : null;
      if (expiresAt && expiresAt <= new Date()) {
        // Lock has expired
        await fs.unlink(lockFile);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                locked: false,
                resource,
                note: "Previous lock expired and was cleaned up",
              }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              locked: true,
              resource,
              lock,
            }),
          },
        ],
      };
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              locked: false,
              resource,
            }),
          },
        ],
      };
    }
  }
);

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function main() {
  // Ensure runtime directories exist
  await ensureDir(path.join(BRAIN_ROOT, "runtime"));
  await ensureDir(LOCKS_DIR);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Portfolio MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
