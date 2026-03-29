interface RepoStatus {
    phase: string;
    currentTask?: string;
    blockers: string[];
    lastUpdated: string;
    health: "healthy" | "warning" | "error" | "unknown";
}
interface Repo {
    id: string;
    name: string;
    path: string;
    gitUrl?: string;
    registeredAt: string;
    lastStatusUpdate?: string;
    status: RepoStatus;
}
interface PortfolioStatus {
    updatedAt: string;
    repos: Repo[];
    summary: {
        total: number;
        healthy: number;
        warning: number;
        error: number;
        unknown: number;
    };
}
interface RegisterOptions {
    name: string;
    path: string;
    repoId: string;
    gitUrl?: string;
}
/**
 * Register a new repo with the portfolio server via MCP
 */
export declare function registerWithPortfolio(options: RegisterOptions): Promise<void>;
/**
 * Get portfolio status
 * First tries HTTP API, falls back to MCP, then to reading files directly
 */
export declare function getPortfolioStatus(): Promise<PortfolioStatus | null>;
/**
 * Report status for a repo
 */
export declare function reportStatus(repoId: string, status: {
    phase: string;
    currentTask?: string;
    blockers?: string[];
    health?: "healthy" | "warning" | "error";
}): Promise<void>;
export {};
