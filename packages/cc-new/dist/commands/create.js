import path from "path";
import fs from "fs/promises";
import { execSync } from "child_process";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { registerWithPortfolio } from "../utils/portfolio.js";
const DEFAULT_TEMPLATE = "https://github.com/jwitts1998/execution-template.git";
export async function createProject(nameArg, options) {
    console.log(chalk.bold("\n🚀 Command Center - New Project\n"));
    // Gather project configuration
    const config = await gatherConfig(nameArg, options);
    // Confirm with user
    console.log(chalk.dim("\nProject Configuration:"));
    console.log(chalk.dim(`  Name: ${config.displayName}`));
    console.log(chalk.dim(`  ID: ${config.repoId}`));
    console.log(chalk.dim(`  Path: ${config.directory}`));
    console.log(chalk.dim(`  Description: ${config.description}\n`));
    const { confirmed } = await inquirer.prompt([
        {
            type: "confirm",
            name: "confirmed",
            message: "Create project with these settings?",
            default: true,
        },
    ]);
    if (!confirmed) {
        console.log(chalk.yellow("Aborted."));
        return;
    }
    // Clone template
    const spinner = ora("Cloning template...").start();
    try {
        await cloneTemplate(options.template || DEFAULT_TEMPLATE, config.directory);
        spinner.succeed("Template cloned");
    }
    catch (error) {
        spinner.fail("Failed to clone template");
        throw error;
    }
    // Customize template
    spinner.start("Customizing template...");
    try {
        await customizeTemplate(config);
        spinner.succeed("Template customized");
    }
    catch (error) {
        spinner.fail("Failed to customize template");
        throw error;
    }
    // Initialize git
    if (options.git !== false) {
        spinner.start("Initializing git...");
        try {
            await initGit(config.directory);
            spinner.succeed("Git initialized");
        }
        catch (error) {
            spinner.fail("Failed to initialize git");
            throw error;
        }
    }
    // Install dependencies
    if (options.install !== false) {
        spinner.start("Installing dependencies...");
        try {
            await installDependencies(config.directory);
            spinner.succeed("Dependencies installed");
        }
        catch (error) {
            spinner.fail("Failed to install dependencies");
            throw error;
        }
    }
    // Register with portfolio
    if (options.register !== false) {
        spinner.start("Registering with portfolio...");
        try {
            await registerWithPortfolio({
                name: config.displayName,
                path: config.directory,
                repoId: config.repoId,
            });
            spinner.succeed("Registered with portfolio");
        }
        catch (error) {
            spinner.warn("Failed to register with portfolio (server may not be running)");
            console.log(chalk.dim(`  You can register manually later with: cc-new register ${config.directory}`));
        }
    }
    // Done!
    console.log(chalk.green("\n✨ Project created successfully!\n"));
    console.log(chalk.dim("Next steps:"));
    console.log(chalk.dim(`  cd ${config.directory}`));
    console.log(chalk.dim(`  # Start developing!\n`));
}
async function gatherConfig(nameArg, options) {
    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "name",
            message: "Project name:",
            default: nameArg,
            validate: (input) => {
                if (!input)
                    return "Project name is required";
                if (!/^[a-z0-9-]+$/.test(input)) {
                    return "Project name must be lowercase alphanumeric with hyphens";
                }
                return true;
            },
            when: !nameArg,
        },
        {
            type: "input",
            name: "displayName",
            message: "Display name:",
            default: (answers) => {
                const name = answers.name || nameArg || "";
                return name
                    .split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ");
            },
        },
        {
            type: "input",
            name: "description",
            message: "Description:",
            default: "A new Command Center execution repo",
        },
    ]);
    const name = answers.name || nameArg || "";
    const parentDir = options.directory || process.env.PORTFOLIO_PROJECTS_DIR || process.cwd();
    const directory = path.resolve(parentDir, name);
    // Check if directory exists
    try {
        await fs.access(directory);
        throw new Error(`Directory already exists: ${directory}`);
    }
    catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
    return {
        name,
        displayName: answers.displayName,
        description: answers.description,
        repoId: name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        directory,
    };
}
async function cloneTemplate(templateUrl, targetDir) {
    // Use git clone with --depth 1 for faster cloning
    execSync(`git clone --depth 1 ${templateUrl} "${targetDir}"`, {
        stdio: "pipe",
    });
    // Remove the .git directory so we can reinitialize
    const gitDir = path.join(targetDir, ".git");
    await fs.rm(gitDir, { recursive: true, force: true });
}
async function customizeTemplate(config) {
    // Update CLAUDE.md
    const claudeMdPath = path.join(config.directory, "CLAUDE.md");
    let claudeMd = await fs.readFile(claudeMdPath, "utf-8");
    claudeMd = claudeMd
        .replace(/# Execution Repository/g, `# ${config.displayName}`)
        .replace(/This is a Level 2 execution repo/, `${config.description}\n\nThis is a Level 2 execution repo`);
    await fs.writeFile(claudeMdPath, claudeMd);
    // Update README.md
    const readmePath = path.join(config.directory, "README.md");
    let readme = await fs.readFile(readmePath, "utf-8");
    readme = readme
        .replace(/# Execution Template/g, `# ${config.displayName}`)
        .replace(/Standardized repo template/, config.description);
    await fs.writeFile(readmePath, readme);
    // Update status/status.json
    const statusPath = path.join(config.directory, "status", "status.json");
    const status = {
        repoId: config.repoId,
        name: config.displayName,
        ok: true,
        lastUpdatedAt: new Date().toISOString(),
        phase: "setup",
        health: "healthy",
        git: {
            head: "initial",
            branch: "main",
        },
        signals: {
            hasStatusFile: true,
            hasPackageJson: false,
            hasSrc: false,
        },
    };
    await fs.writeFile(statusPath, JSON.stringify(status, null, 2));
    // Create a .env.example file
    const envPath = path.join(config.directory, ".env.example");
    const envContent = `# Brain connection
BRAIN_ROOT=/path/to/command-center
REPO_ID=${config.repoId}
REPO_NAME="${config.displayName}"

# Development
NODE_ENV=development
`;
    await fs.writeFile(envPath, envContent);
    // Update .gitignore
    const gitignorePath = path.join(config.directory, ".gitignore");
    let gitignore = "";
    try {
        gitignore = await fs.readFile(gitignorePath, "utf-8");
    }
    catch {
        // File doesn't exist
    }
    if (!gitignore.includes(".env")) {
        gitignore += "\n# Environment\n.env\n.env.local\n";
        await fs.writeFile(gitignorePath, gitignore);
    }
}
async function initGit(directory) {
    execSync("git init", { cwd: directory, stdio: "pipe" });
    execSync("git add .", { cwd: directory, stdio: "pipe" });
    execSync('git commit -m "Initial commit from execution-template"', {
        cwd: directory,
        stdio: "pipe",
    });
}
async function installDependencies(directory) {
    // Check if package.json exists in the mcp/status-reporter directory
    const statusReporterDir = path.join(directory, "mcp", "status-reporter");
    const packageJsonPath = path.join(statusReporterDir, "package.json");
    try {
        await fs.access(packageJsonPath);
        execSync("npm install", { cwd: statusReporterDir, stdio: "pipe" });
    }
    catch {
        // No package.json in status-reporter, skip
    }
    // Check for root package.json
    const rootPackageJson = path.join(directory, "package.json");
    try {
        await fs.access(rootPackageJson);
        execSync("npm install", { cwd: directory, stdio: "pipe" });
    }
    catch {
        // No root package.json, skip
    }
}
//# sourceMappingURL=create.js.map