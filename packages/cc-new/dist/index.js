#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { createProject } from "./commands/create.js";
import { listProjects } from "./commands/list.js";
const program = new Command();
program
    .name("cc-new")
    .description("CLI for creating new execution repos in the Command Center portfolio")
    .version("1.0.0");
program
    .command("create")
    .alias("new")
    .description("Create a new execution repo from the template")
    .argument("[name]", "Project name (will prompt if not provided)")
    .option("-d, --directory <path>", "Parent directory for the new project")
    .option("-t, --template <url>", "Custom template git URL")
    .option("--no-git", "Skip git initialization")
    .option("--no-install", "Skip npm install")
    .option("--no-register", "Skip portfolio registration")
    .action(async (name, options) => {
    try {
        await createProject(name, options);
    }
    catch (error) {
        console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program
    .command("list")
    .alias("ls")
    .description("List all registered projects in the portfolio")
    .action(async () => {
    try {
        await listProjects();
    }
    catch (error) {
        console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=index.js.map