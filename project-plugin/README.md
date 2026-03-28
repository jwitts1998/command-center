# Command Center Plugin

Integrate your projects with the Command Center for intelligent prompt enrichment.

## Features

- **Prompt Enrichment**: Automatically enrich bare prompts with project context
- **Clarification Questions**: Get multiple-choice questions when prompts are ambiguous
- **Session Tracking**: Record token usage and costs back to Command Center
- **Offline Fallback**: Gracefully degrade when Command Center is unavailable

## Installation

### Quick Install

From your project root:

```bash
# Option 1: Direct script
curl -sSL https://your-command-center.vercel.app/install.sh | bash

# Option 2: Copy from command-center repo
cp -r /path/to/command-center/project-plugin .claude/command-center
```

### Manual Install

1. Create the plugin directory:
   ```bash
   mkdir -p .claude/command-center
   ```

2. Copy plugin files:
   ```bash
   cp plugin.ts config.example.json .claude/command-center/
   ```

3. Create your config:
   ```bash
   cp .claude/command-center/config.example.json .claude/command-center/config.json
   ```

4. Edit `config.json` with your Command Center credentials:
   ```json
   {
     "projectId": "your-project-id",
     "apiKey": "your-api-key",
     "commandCenterUrl": "http://localhost:3000",
     "projectName": "My Project",
     "autoEnrich": true,
     "techStack": ["react", "typescript"]
   }
   ```

5. Add to `.gitignore`:
   ```
   .claude/command-center/config.json
   ```

## Usage

### TypeScript/JavaScript

```typescript
import { CommandCenterPlugin } from '.claude/command-center/plugin';

const plugin = new CommandCenterPlugin();

// Enrich a prompt
async function enrichAndExecute(userPrompt: string) {
  const result = await plugin.enrichPrompt(userPrompt);

  if (!result.success) {
    console.error('Enrichment failed:', result.error);
    return;
  }

  if (result.needsClarification) {
    // Present questions to user
    console.log('Please answer these questions:');
    for (const q of result.questions) {
      console.log(`\n${q.question}`);
      q.options.forEach((opt, i) => {
        const rec = opt.recommended ? ' (recommended)' : '';
        console.log(`  ${i + 1}. ${opt.label}${rec}`);
      });
    }

    // Collect answers and submit
    const answers = await collectUserAnswers(result.questions);
    const enriched = await plugin.submitClarifications(result.sessionId, answers);

    console.log('\nEnriched prompt:', enriched.enrichedPrompt);
  } else {
    console.log('Enriched prompt:', result.enrichedPrompt);
  }
}
```

### CLI

```bash
# Setup interactively
ts-node .claude/command-center/plugin.ts setup

# Enrich a prompt
ts-node .claude/command-center/plugin.ts enrich "Add dark mode"

# Show local context
ts-node .claude/command-center/plugin.ts context
```

### Environment Variables

Instead of `config.json`, you can use environment variables:

```bash
export COMMAND_CENTER_URL=http://localhost:3000
export COMMAND_CENTER_PROJECT_ID=your-project-id
export COMMAND_CENTER_API_KEY=your-api-key
```

## Claude Code Integration

To automatically enrich prompts in Claude Code, create a hook:

### hooks/enrich-prompt.ts

```typescript
#!/usr/bin/env ts-node
import { CommandCenterPlugin } from '../command-center/plugin';

const plugin = new CommandCenterPlugin();

async function main() {
  const userPrompt = process.env.USER_PROMPT;
  if (!userPrompt) {
    process.exit(0);
  }

  const result = await plugin.enrichPrompt(userPrompt);

  if (result.success && !result.needsClarification) {
    // Output enriched prompt for the agent to use
    console.log(result.enrichedPrompt);
  } else if (result.needsClarification) {
    // Store session ID and questions for UI to handle
    console.log(JSON.stringify({
      needsClarification: true,
      sessionId: result.sessionId,
      questions: result.questions,
    }));
  }
}

main().catch(console.error);
```

## API Reference

### `CommandCenterPlugin`

#### Constructor

```typescript
new CommandCenterPlugin(projectRoot?: string)
```

- `projectRoot`: Optional path to project root. Defaults to `process.cwd()`.

#### Methods

##### `isConfigured(): boolean`

Returns `true` if the plugin has valid configuration.

##### `getProjectContext(): Record<string, any>`

Returns local project context including:
- Tech stack from package.json
- Local rules from `.claude/rules/`
- Project name and configuration

##### `enrichPrompt(userPrompt: string): Promise<EnrichmentResult>`

Sends a prompt to Command Center for enrichment.

Returns:
```typescript
{
  success: boolean;
  needsClarification?: boolean;
  questions?: ClarificationQuestion[];
  sessionId?: string;
  enrichedPrompt?: string;
  metadata?: {
    ambiguitiesFound?: number;
    contextApplied?: string[];
    estimatedTokens?: number;
  };
  error?: string;
}
```

##### `submitClarifications(sessionId: string, answers: Record<string, string>): Promise<EnrichmentResult>`

Submits answers to clarification questions.

- `sessionId`: Session ID from initial enrichment
- `answers`: Map of question IDs to selected option IDs

##### `recordSession(sessionData: SessionData): Promise<{ success: boolean; error?: string }>`

Records session metrics back to Command Center.

```typescript
{
  sessionId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  tokensInput?: number;
  tokensOutput?: number;
  model?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}
```

##### `setup(): Promise<void>`

Interactive setup wizard for configuring the plugin.

## Troubleshooting

### Plugin not configured

Make sure you have either:
- A valid `config.json` file in `.claude/command-center/`
- Environment variables set (`COMMAND_CENTER_URL`, `COMMAND_CENTER_PROJECT_ID`, `COMMAND_CENTER_API_KEY`)

### Command Center unreachable

The plugin will gracefully degrade and return the original prompt if Command Center is unavailable. Check:
- Command Center URL is correct
- Command Center service is running
- Network connectivity

### API errors

Check:
- Project ID exists in Command Center
- API key is valid
- API key has correct permissions

## Security

- **Never commit `config.json`** - it contains your API key
- Add `.claude/command-center/config.json` to `.gitignore`
- Use environment variables in CI/CD environments
- Rotate API keys regularly

## License

MIT
