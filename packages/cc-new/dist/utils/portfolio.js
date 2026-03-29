import path from "path";
import fs from "fs/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const BRAIN_ROOT = process.env.BRAIN_ROOT || path.join(process.env.HOME || "", "dev", "projects", "command-center");
/**
 * Register a new repo with the portfolio server via MCP
 */
export async function registerWithPortfolio(options) {
    const portfolioServerPath = path.join(BRAIN_ROOT, "mcp", "portfolio-server", "dist", "index.js");
    // Check if server exists
    try {
        await fs.access(portfolioServerPath);
    }
    catch {
        throw new Error(`Portfolio server not found at ${portfolioServerPath}. Build it first with: cd mcp/portfolio-server && npm run build`);
    }
    // Create MCP client
    const client = new Client({
        name: "cc-new",
        version: "1.0.0",
    });
    const transport = new StdioClientTransport({
        command: "node",
        args: [portfolioServerPath],
        env: {
            ...process.env,
            BRAIN_ROOT,
        },
    });
    try {
        await client.connect(transport);
        // Call register_repo tool
        const result = await client.callTool({
            name: "register_repo",
            arguments: {
                name: options.name,
                path: options.path,
                gitUrl: options.gitUrl,
            },
        });
        // Parse result
        const content = result.content[0];
        if (content.type === "text" && content.text) {
            const response = JSON.parse(content.text);
            if (!response.success) {
                throw new Error(response.error || "Failed to register repo");
            }
        }
    }
    finally {
        await client.close();
    }
}
/**
 * Get portfolio status
 * First tries HTTP API, falls back to MCP, then to reading files directly
 */
export async function getPortfolioStatus() {
    // Try HTTP API first (if Next.js server is running)
    try {
        const response = await fetch("http://localhost:3000/api/status");
        if (response.ok) {
            return (await response.json());
        }
    }
    catch {
        // HTTP not available, try other methods
    }
    // Try reading status file directly
    try {
        const statusPath = path.join(BRAIN_ROOT, "runtime", "status.json");
        const content = await fs.readFile(statusPath, "utf-8");
        return JSON.parse(content);
    }
    catch {
        // Status file doesn't exist
    }
    // Try reading registry file and building status
    try {
        const registryPath = path.join(BRAIN_ROOT, "runtime", "registry.json");
        const content = await fs.readFile(registryPath, "utf-8");
        const registry = JSON.parse(content);
        const summary = {
            total: registry.repos.length,
            healthy: 0,
            warning: 0,
            error: 0,
            unknown: 0,
        };
        const repos = registry.repos.map((repo) => {
            const status = repo.status || {
                phase: "unknown",
                blockers: [],
                health: "unknown",
                lastUpdated: new Date().toISOString(),
            };
            summary[status.health]++;
            return { ...repo, status };
        });
        return {
            updatedAt: registry.updatedAt,
            repos,
            summary,
        };
    }
    catch {
        // No registry either
    }
    // Try MCP as last resort
    try {
        const portfolioServerPath = path.join(BRAIN_ROOT, "mcp", "portfolio-server", "dist", "index.js");
        await fs.access(portfolioServerPath);
        const client = new Client({
            name: "cc-new",
            version: "1.0.0",
        });
        const transport = new StdioClientTransport({
            command: "node",
            args: [portfolioServerPath],
            env: {
                ...process.env,
                BRAIN_ROOT,
            },
        });
        await client.connect(transport);
        try {
            const result = await client.callTool({
                name: "get_global_status",
                arguments: {},
            });
            const content = result.content[0];
            if (content.type === "text" && content.text) {
                return JSON.parse(content.text);
            }
        }
        finally {
            await client.close();
        }
    }
    catch {
        // MCP also failed
    }
    return null;
}
/**
 * Report status for a repo
 */
export async function reportStatus(repoId, status) {
    const portfolioServerPath = path.join(BRAIN_ROOT, "mcp", "portfolio-server", "dist", "index.js");
    try {
        await fs.access(portfolioServerPath);
    }
    catch {
        throw new Error("Portfolio server not found");
    }
    const client = new Client({
        name: "cc-new",
        version: "1.0.0",
    });
    const transport = new StdioClientTransport({
        command: "node",
        args: [portfolioServerPath],
        env: {
            ...process.env,
            BRAIN_ROOT,
        },
    });
    try {
        await client.connect(transport);
        await client.callTool({
            name: "report_status",
            arguments: {
                repoId,
                phase: status.phase,
                currentTask: status.currentTask,
                blockers: status.blockers || [],
                health: status.health || "healthy",
            },
        });
    }
    finally {
        await client.close();
    }
}
//# sourceMappingURL=portfolio.js.map