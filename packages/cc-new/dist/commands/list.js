import chalk from "chalk";
import ora from "ora";
import { getPortfolioStatus } from "../utils/portfolio.js";
export async function listProjects() {
    console.log(chalk.bold("\n📋 Command Center - Portfolio\n"));
    const spinner = ora("Fetching portfolio status...").start();
    try {
        const status = await getPortfolioStatus();
        spinner.stop();
        if (!status || status.repos.length === 0) {
            console.log(chalk.yellow("No projects registered in the portfolio.\n"));
            console.log(chalk.dim("Create a new project with: cc-new create <name>\n"));
            return;
        }
        // Print summary
        const { summary } = status;
        console.log(chalk.dim(`Total: ${summary.total} projects\n`));
        // Print health bar
        const barWidth = 40;
        const healthBar = [
            chalk.green("█".repeat(Math.round((summary.healthy / summary.total) * barWidth))),
            chalk.yellow("█".repeat(Math.round((summary.warning / summary.total) * barWidth))),
            chalk.red("█".repeat(Math.round((summary.error / summary.total) * barWidth))),
            chalk.gray("█".repeat(Math.round((summary.unknown / summary.total) * barWidth))),
        ].join("");
        console.log(`  ${healthBar}`);
        console.log(chalk.dim(`  ${chalk.green(`${summary.healthy} healthy`)} · ${chalk.yellow(`${summary.warning} warning`)} · ${chalk.red(`${summary.error} error`)} · ${chalk.gray(`${summary.unknown} unknown`)}\n`));
        // Print projects table
        console.log(chalk.dim("─".repeat(60)));
        console.log(`  ${chalk.bold("Name".padEnd(25))}${chalk.bold("Phase".padEnd(15))}${chalk.bold("Health".padEnd(10))}`);
        console.log(chalk.dim("─".repeat(60)));
        for (const repo of status.repos) {
            const healthColor = repo.status.health === "healthy"
                ? chalk.green
                : repo.status.health === "warning"
                    ? chalk.yellow
                    : repo.status.health === "error"
                        ? chalk.red
                        : chalk.gray;
            console.log(`  ${repo.name.padEnd(25)}${(repo.status.phase || "unknown").padEnd(15)}${healthColor(repo.status.health.padEnd(10))}`);
            if (repo.status.currentTask) {
                console.log(chalk.dim(`    → ${repo.status.currentTask}`));
            }
            if (repo.status.blockers && repo.status.blockers.length > 0) {
                console.log(chalk.red(`    ⚠ Blockers: ${repo.status.blockers.join(", ")}`));
            }
        }
        console.log(chalk.dim("─".repeat(60)));
        console.log(chalk.dim(`\nLast updated: ${new Date(status.updatedAt).toLocaleString()}\n`));
    }
    catch (error) {
        spinner.fail("Failed to fetch portfolio status");
        throw error;
    }
}
//# sourceMappingURL=list.js.map