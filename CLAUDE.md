# Command Center (Brain)

Level 1 orchestration hub for a multi-repo autonomous portfolio.

## Overview

The Command Center is the "Brain" of the portfolio system. It:

- **Triages incoming requests** via voice transcripts or HTTP
- **Dispatches work** to C-Suite agents (CEO, CTO, CMO)
- **Tracks portfolio status** across all execution repos
- **Provides a real-time UI** for monitoring runs and status

## Architecture

```
Voice/Chat Input
       │
       ▼
┌─────────────────┐
│  Inbox Watcher  │  <- central-inbox/inbox/
│  or HTTP API    │  <- /api/inbox/ingest
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Triage Agent   │  <- Classifies: strategic | technical | growth
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Dispatch       │  <- Routes to CEO | CTO | CMO
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Executive Run  │  <- Claude CLI with system prompt
│  (stream-json)  │  <- Logs to runtime/runs/<runId>/
└─────────────────┘
```

## Directory Structure

```
command-center/
├── app/                    # Next.js UI + API routes
│   └── (dashboard)/
│       ├── activity/       # Activity feed + run details
│       ├── projects/       # Project management
│       ├── sessions/       # Enrichment sessions
│       ├── patterns/       # Learned patterns
│       └── costs/          # Cost tracking
├── central-inbox/
│   ├── inbox/              # Drop .txt files here for processing
│   ├── processed/          # Successfully processed transcripts
│   └── failed/             # Failed processing
├── c-suite/
│   └── system-prompts/     # Agent system instructions
│       ├── CEO.system.md
│       ├── CTO.system.md
│       ├── CMO.system.md
│       └── TRIAGE.system.md
├── packages/
│   ├── bridge/             # Inbox watcher + triage + dispatch
│   └── cc-new/             # CLI for creating new repos
├── runtime/
│   ├── runs/<runId>/       # Run logs (meta.json, events.ndjson)
│   ├── registry.json       # Registered repos
│   ├── status.json         # Portfolio rollup
│   └── locks/              # Coordination locks
├── mcp/
│   └── portfolio-server/   # MCP server for portfolio management
├── components/             # React UI components
├── hooks/                  # React hooks (useRunStream, etc.)
└── lib/                    # Shared services
```

## Running the Bridge

Start the inbox watcher:

```bash
cd packages/bridge
npm run dev
```

Or submit directly via API:

```bash
curl -X POST http://localhost:3000/api/inbox/ingest \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Add a dark mode toggle to the settings page"}'
```

## C-Suite Agents

### CEO (Strategic)
- Business strategy, prioritization, product direction
- Delegates technical work to CTO, growth work to CMO
- Does NOT write code

### CTO (Technical)
- Code implementation, architecture, deployments
- Acquires locks before editing shared files
- Updates status after milestones

### CMO (Growth)
- Marketing, positioning, acquisition experiments
- Coordinates with CTO for technical changes
- Respects platform terms

### Triage
- Classifies incoming transcripts
- Outputs structured JSON with lane, agent, title, summary, acceptance_criteria
- Determines if computer_use is required

## API Endpoints

### Core APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/inbox/ingest` | POST | Submit transcript for triage + dispatch |
| `/api/runs` | GET | List all runs |
| `/api/runs/[runId]` | GET | Get run details |
| `/api/runs/[runId]/stream` | GET | SSE stream of run events |
| `/api/status` | GET | Get portfolio status rollup |
| `/api/status` | POST | Refresh portfolio status from all repos |
| `/api/projects` | GET/POST | Project CRUD |
| `/api/enrich-prompt` | POST | Enrich a prompt with context |

### Goals & Tasks (Intelligent Work System)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/goals` | GET/POST | List/create goals |
| `/api/goals/[id]` | GET/PUT/DELETE | Goal CRUD |
| `/api/goals/[id]/decompose` | POST | AI-decompose goal into tasks |
| `/api/tasks` | GET/POST | List/create tasks |
| `/api/tasks/[id]` | GET/PUT/DELETE | Task CRUD |
| `/api/tasks/[id]/checkout` | GET/POST | Acquire/check task checkout |
| `/api/tasks/[id]/release` | POST | Release task checkout |

### Agents (Dynamic Agent Registry)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET/POST | List/register agents |
| `/api/agents/[id]` | GET/PUT/DELETE | Agent CRUD |
| `/api/agents/[id]/pause` | POST | Pause an agent |
| `/api/agents/[id]/resume` | POST | Resume an agent |
| `/api/agents/[id]/heartbeat` | POST | Record agent heartbeat |
| `/api/agents/route` | POST | Route task to best agent |

### Approvals (Trust-Based Governance)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/approvals` | GET/POST | List pending/create approval requests |
| `/api/approvals/[id]` | GET | Get approval request details |
| `/api/approvals/[id]/approve` | POST | Approve a request |
| `/api/approvals/[id]/reject` | POST | Reject a request |
| `/api/approvals/check` | POST | Check if operation needs approval |
| `/api/approvals/policies` | GET/POST | List/create approval policies |

### Teams & Delegations (Organization)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/teams` | GET/POST | List/create teams |
| `/api/teams/[id]` | GET/PUT/DELETE | Team CRUD |
| `/api/teams/[id]/members` | POST/DELETE | Add/remove team members |
| `/api/delegations` | GET/POST | List/create delegations |
| `/api/delegations/[id]/revoke` | POST | Revoke a delegation |
| `/api/delegations/chain` | GET | Get delegation chain for task |
| `/api/org-chart` | GET | Get organization chart |

### Marketing Portal

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/marketing/campaigns` | GET/POST | List/create marketing campaigns |
| `/api/marketing/campaigns/[id]` | GET/PUT/DELETE | Campaign CRUD |
| `/api/marketing/assets` | GET/POST | List/create content assets |
| `/api/marketing/assets/[id]` | GET/PUT/DELETE | Asset CRUD |
| `/api/marketing/videos/templates` | GET | List Remotion video templates |
| `/api/marketing/videos/render` | POST | Start video render |
| `/api/marketing/videos/[id]/status` | GET | Check render status |
| `/api/marketing/analytics` | GET | Campaign analytics |
| `/api/marketing/context` | GET/POST | Product marketing context |
| `/api/marketing/skills` | GET | List available marketing skills |

## MCP Portfolio Server

The portfolio server (`mcp/portfolio-server/`) provides tools for cross-repo coordination:

**Repo Registry:**
- `register_repo` - Register a new repo in the portfolio
- `list_repos` - List all registered repos
- `unregister_repo` - Remove a repo from the registry

**Status Management:**
- `report_status` - Report status from an execution repo
- `audit_all` - Audit all repos by reading their status.json
- `rebuild_global_status` - Rebuild the global status rollup
- `get_global_status` - Get current portfolio status

**Locking:**
- `acquire_lock` - Acquire a lock on a resource
- `release_lock` - Release a lock
- `list_locks` - List all active locks
- `check_lock` - Check if a resource is locked

## cc-new CLI

Create new execution repos from the template:

```bash
# Install globally (from packages/cc-new)
npm link

# Create a new project
cc-new create my-new-app

# Or with options
cc-new create my-app -d ~/projects --no-install

# List portfolio
cc-new list
```

Options:
- `-d, --directory <path>` - Parent directory for the project
- `-t, --template <url>` - Custom template git URL
- `--no-git` - Skip git initialization
- `--no-install` - Skip npm install
- `--no-register` - Skip portfolio registration

## Environment Variables

```bash
BRAIN_ROOT=/path/to/command-center
PORTFOLIO_PROJECTS_DIR=/path/to/portfolio-projects
EXECUTION_TEMPLATE_GIT=git@github.com:org/execution-template.git
```

## Run States

- `queued` - Triaged, waiting for dispatch
- `running` - Agent executing
- `completed` - Finished successfully
- `failed` - Finished with error
- `pending_confirmation` - Requires human approval (computer_use)

## Phase Roadmap

### MVP v1 (Complete)
- **Phase 0** ✅: Bridge + Triage + Dispatch
- **Phase 1** ✅: MCP Portfolio Server + Cross-repo status
- **Phase 2** ✅: Activity Feed UI + Real-time streaming
- **Phase 3** ✅: `cc-new` CLI for creating new businesses
- **Phase 4** ✅: Voice input via Web Speech API + Wispr Flow file watcher
- **Phase 5** ✅: Cross-project learning and pattern application

### MVP v2: Intelligent Agent Orchestration (Complete)
- **Phase 1** ✅: Intelligent Work System (Goals, Tasks, AI decomposition)
- **Phase 2** ✅: Dynamic Agent Registry (Agent CRUD, routing, heartbeats)
- **Phase 3** ✅: Trust-Based Governance (Approval policies, risk-based gates)
- **Phase 4** ✅: Organization & Delegation (Teams, delegation tracking)

## Services Architecture

### Core Services (`lib/services/`)

| Service | Purpose |
|---------|---------|
| `PromptEnricher` | LLM-powered prompt enrichment with clarification |
| `AmbiguityDetector` | Detects missing context in prompts |
| `QuestionGenerator` | Generates clarification questions |
| `ContextBuilder` | Builds project context from history |
| `CostTracker` | Tracks costs and budgets |
| `PatternDetector` | Extracts patterns from sessions |
| `PatternApplicator` | Applies learned patterns to prompts |

### MVP v2 Services

| Service | Purpose |
|---------|---------|
| `TaskDecomposer` | AI-powered goal → task breakdown |
| `TaskCheckout` | Atomic task checkout preventing duplicate work |
| `AgentRouter` | Intelligent agent selection for tasks |
| `HeartbeatCoordinator` | Agent health monitoring and sessions |
| `ApprovalEngine` | Trust-based governance with learning |
| `DelegationTracker` | Task delegation and team management |

### Adapters (`lib/adapters/`)

| Adapter | Purpose |
|---------|---------|
| `ClaudeAdapter` | Executes tasks via Claude API with session continuity |

## Voice Input

The Command Center supports voice input through multiple methods:

### Web Speech API (Browser)
- Navigate to `/voice` in the dashboard
- Click the microphone button to start recording
- Speak your request, then submit
- Uses browser's built-in speech recognition

### Voice Commands
- Press `Ctrl+Shift+V` to toggle global voice commands
- Say navigation commands: "Go to dashboard", "Open activity", etc.
- Say action commands: "New project", "Refresh", "Go back"
- Click the floating microphone button in the bottom-right corner

### Wispr Flow Integration
When Wispr Flow can output to text files, configure the file watcher:

```bash
cd packages/bridge
WISPR_OUTPUT_DIR=/path/to/wispr/output npm run wispr
```

The watcher will automatically ingest any `.txt` or `.md` files that Wispr Flow creates.
