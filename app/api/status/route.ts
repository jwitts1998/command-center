import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const BRAIN_ROOT = process.env.BRAIN_ROOT || process.cwd();
const STATUS_PATH = path.join(BRAIN_ROOT, "runtime", "status.json");
const REGISTRY_PATH = path.join(BRAIN_ROOT, "runtime", "registry.json");

interface RepoStatus {
  phase: string;
  currentTask?: string;
  blockers: string[];
  lastUpdated: string;
  health: "healthy" | "warning" | "error" | "unknown";
}

interface RepoEntry {
  id: string;
  name: string;
  path: string;
  gitUrl?: string;
  registeredAt: string;
  lastStatusUpdate?: string;
  status?: RepoStatus;
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

interface Registry {
  repos: RepoEntry[];
  updatedAt: string;
}

async function readJson<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * GET /api/status
 *
 * Returns the global portfolio status rollup.
 * If the global status.json doesn't exist, builds it from registry.
 */
export async function GET() {
  try {
    // Try to read existing global status
    let globalStatus = await readJson<GlobalStatus | null>(STATUS_PATH, null);

    if (!globalStatus) {
      // Build status from registry
      const registry = await readJson<Registry>(REGISTRY_PATH, {
        repos: [],
        updatedAt: new Date().toISOString(),
      });

      const summary = {
        total: registry.repos.length,
        healthy: 0,
        warning: 0,
        error: 0,
        unknown: 0,
      };

      const reposWithStatus = registry.repos.map((repo) => {
        const status: RepoStatus = repo.status || {
          phase: "unknown",
          blockers: [],
          health: "unknown",
          lastUpdated: new Date().toISOString(),
        };

        summary[status.health]++;

        return { ...repo, status };
      });

      globalStatus = {
        updatedAt: new Date().toISOString(),
        repos: reposWithStatus,
        summary,
      };
    }

    return NextResponse.json(globalStatus);
  } catch (error) {
    console.error("Failed to get status:", error);
    return NextResponse.json(
      { error: "Failed to get portfolio status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/status/refresh
 *
 * Trigger a rebuild of the global status by auditing all repos.
 */
export async function POST() {
  try {
    const registry = await readJson<Registry>(REGISTRY_PATH, {
      repos: [],
      updatedAt: new Date().toISOString(),
    });

    const summary = {
      total: registry.repos.length,
      healthy: 0,
      warning: 0,
      error: 0,
      unknown: 0,
    };

    const results: Array<{
      repoId: string;
      name: string;
      status: RepoStatus | null;
      error?: string;
    }> = [];

    // Audit each repo by reading their local status.json
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

          repo.status = status;
          repo.lastStatusUpdate = status.lastUpdated;
          summary[status.health]++;

          results.push({ repoId: repo.id, name: repo.name, status });
        } else {
          summary.unknown++;
          results.push({
            repoId: repo.id,
            name: repo.name,
            status: null,
            error: "No status.json found",
          });
        }
      } catch (err) {
        summary.unknown++;
        results.push({
          repoId: repo.id,
          name: repo.name,
          status: null,
          error: `Failed to read: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    // Save updated registry
    registry.updatedAt = new Date().toISOString();
    await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
    await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2));

    // Build and save global status
    const reposWithStatus = registry.repos.map((repo) => ({
      ...repo,
      status: repo.status || {
        phase: "unknown",
        blockers: [],
        health: "unknown" as const,
        lastUpdated: new Date().toISOString(),
      },
    }));

    const globalStatus: GlobalStatus = {
      updatedAt: new Date().toISOString(),
      repos: reposWithStatus,
      summary,
    };

    await fs.writeFile(STATUS_PATH, JSON.stringify(globalStatus, null, 2));

    return NextResponse.json({
      success: true,
      audited: results.length,
      summary,
      results,
    });
  } catch (error) {
    console.error("Failed to refresh status:", error);
    return NextResponse.json(
      { error: "Failed to refresh portfolio status" },
      { status: 500 }
    );
  }
}
