# Command Center Plugin

Prompt enrichment plugin for project repositories. Connects your projects to the Command Center for intelligent prompt enrichment, pattern learning, and session tracking.

## Features

- **Prompt Enrichment**: Transform bare prompts into detailed, context-rich instructions
- **Clarification Flow**: Automatically detect ambiguities and ask clarifying questions
- **Pattern Application**: Apply learned patterns from across your portfolio
- **Session Tracking**: Record agent sessions for cost tracking and analysis
- **Offline Mode**: Graceful degradation when Command Center is unavailable

## Installation

### Quick Install

Run the setup script in your project root:

```bash
cd your-project
bash /path/to/command-center/project-plugin/setup.sh
```

### Manual Install

1. Create the plugin directory:
   ```bash
   mkdir -p .claude/command-center
   ```

2. Create the config file (`.claude/command-center/config.json`):
   ```json
   {
     "commandCenterUrl": "https://your-command-center.vercel.app",
     "apiKey": "your-api-key",
     "projectId": "your-project-id",
     "autoEnrich": true,
     "skipClarification": false,
     "timeout": 30000,
     "offlineMode": true
   }
   ```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `commandCenterUrl` | string | `http://localhost:3000` | Command Center API URL |
| `apiKey` | string | - | API key for authentication |
| `projectId` | string | - | Your project ID from Command Center |
| `autoEnrich` | boolean | `true` | Automatically enrich prompts |
| `skipClarification` | boolean | `false` | Skip clarification questions |
| `timeout` | number | `30000` | API timeout in milliseconds |
| `offlineMode` | boolean | `true` | Enable offline fallback |

### Environment Variables

You can also configure via environment variables:

```bash
export COMMAND_CENTER_URL="https://your-command-center.vercel.app"
export COMMAND_CENTER_API_KEY="your-api-key"
export COMMAND_CENTER_PROJECT_ID="your-project-id"
```

## Usage

### CLI

```bash
# Setup the plugin
npx cc-plugin setup

# Test connection
npx cc-plugin test

# Check status
npx cc-plugin status

# Enrich a prompt
npx cc-plugin enrich "Add dark mode"
```

### Programmatic

```typescript
import { createPlugin, enrichPrompt } from '@command-center/plugin';

// Quick enrichment
const result = await enrichPrompt("Add dark mode");

if (result.needsClarification) {
  console.log('Questions:', result.questions);
} else {
  console.log('Enriched:', result.enrichedPrompt);
}

// Full plugin usage
const plugin = createPlugin();

// Enrich with clarification handling
const enrichment = await plugin.enrichPrompt("Add user authentication");

if (enrichment.needsClarification) {
  const answers = { 'auth-method': 'oauth' };
  const final = await plugin.submitClarificationAnswers({
    sessionId: enrichment.sessionId!,
    answers,
  });
  console.log('Final:', final.enrichedPrompt);
}
```

## Hooks Integration

The plugin integrates with Claude Code's hooks system:

```typescript
import { installHooks } from '@command-center/plugin';
installHooks(); // Installs hooks to current project
```

Creates:
- `.claude/hooks/command-center-enrich.sh` - Enriches prompts before execution
- `.claude/hooks/command-center-session.sh` - Records sessions to Command Center

## Offline Mode

When `offlineMode: true` (default), the plugin will:
1. Attempt to connect to Command Center
2. Fall back to local context enrichment if unavailable
3. Store sessions locally for later sync

## Getting Your Credentials

1. Go to your Command Center dashboard
2. Navigate to **Projects** and select your project
3. Copy the **Project ID**
4. Go to **Settings** > **API Keys** to generate an API key

## License

MIT
