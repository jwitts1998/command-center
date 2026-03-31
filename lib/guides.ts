export interface Guide {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'workflows' | 'features' | 'troubleshooting' | 'process-flows' | 'developer-config';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: string;
  estimatedTime: string;
  content: string;
  relatedPages?: string[];
  prerequisites?: string[];
}

export interface ProcessFlow {
  id: string;
  title: string;
  description: string;
  steps: ProcessStep[];
  relatedGuides?: string[];
}

export interface ProcessStep {
  id: string;
  label: string;
  description: string;
  type: 'start' | 'process' | 'decision' | 'end' | 'parallel';
  links?: string[];
  next?: string | { yes?: string; no?: string };
}

export const processFlows: ProcessFlow[] = [
  {
    id: 'request-to-execution',
    title: 'Request to Execution',
    description: 'How a voice or chat request becomes executed work',
    steps: [
      { id: 'input', label: 'Voice/Chat Input', description: 'User submits request via /chat or /voice', type: 'start', next: 'triage' },
      { id: 'triage', label: 'Triage Agent', description: 'Classifies request: strategic, technical, or growth', type: 'process', next: 'route' },
      { id: 'route', label: 'Route Decision', description: 'Which C-Suite agent handles this?', type: 'decision', next: { yes: 'ceo', no: 'dispatch' } },
      { id: 'dispatch', label: 'Dispatch to Agent', description: 'CEO, CTO, or CMO receives the task', type: 'process', next: 'execute' },
      { id: 'execute', label: 'Agent Execution', description: 'Agent works on task, streams events', type: 'process', next: 'approval-check' },
      { id: 'approval-check', label: 'Needs Approval?', description: 'Check against approval policies', type: 'decision', next: { yes: 'await-approval', no: 'complete' } },
      { id: 'await-approval', label: 'Await Approval', description: 'Human reviews and approves/rejects', type: 'process', next: 'complete' },
      { id: 'complete', label: 'Complete', description: 'Task marked complete, status updated', type: 'end' },
    ],
    relatedGuides: ['your-first-request', 'understanding-agents', 'approval-policies'],
  },
  {
    id: 'goal-decomposition',
    title: 'Goal Decomposition Flow',
    description: 'Breaking down goals into executable tasks',
    steps: [
      { id: 'create-goal', label: 'Create Goal', description: 'User creates a new goal with description', type: 'start', next: 'decompose' },
      { id: 'decompose', label: 'AI Decomposition', description: 'AI analyzes goal and generates tasks', type: 'process', next: 'review' },
      { id: 'review', label: 'Review Tasks', description: 'User reviews and adjusts generated tasks', type: 'process', next: 'assign' },
      { id: 'assign', label: 'Assign Tasks', description: 'Tasks assigned to agents or teams', type: 'process', next: 'checkout' },
      { id: 'checkout', label: 'Task Checkout', description: 'Agent checks out task (locks it)', type: 'process', next: 'work' },
      { id: 'work', label: 'Execute Task', description: 'Agent completes the work', type: 'process', next: 'release' },
      { id: 'release', label: 'Release & Complete', description: 'Task released and marked complete', type: 'process', next: 'more-tasks' },
      { id: 'more-tasks', label: 'More Tasks?', description: 'Check if goal has remaining tasks', type: 'decision', next: { yes: 'checkout', no: 'goal-complete' } },
      { id: 'goal-complete', label: 'Goal Complete', description: 'All tasks done, goal achieved', type: 'end' },
    ],
    relatedGuides: ['goals-to-tasks'],
  },
  {
    id: 'portfolio-coordination',
    title: 'Portfolio Coordination',
    description: 'How Command Center coordinates across execution repos',
    steps: [
      { id: 'brain', label: 'Command Center (Brain)', description: 'Level 1 orchestration hub', type: 'start', next: 'dispatch-repo' },
      { id: 'dispatch-repo', label: 'Dispatch to Repo', description: 'Work sent to execution repo via MCP', type: 'process', next: 'exec-work' },
      { id: 'exec-work', label: 'Execution Repo Works', description: 'Level 2 repo implements the task', type: 'process', next: 'report-status' },
      { id: 'report-status', label: 'Report Status', description: 'Repo reports status via MCP', type: 'process', next: 'rollup' },
      { id: 'rollup', label: 'Status Rollup', description: 'Brain aggregates all repo statuses', type: 'process', next: 'dashboard' },
      { id: 'dashboard', label: 'Dashboard Update', description: 'Activity feed shows real-time progress', type: 'end' },
    ],
    relatedGuides: ['execution-template', 'understanding-agents'],
  },
  {
    id: 'pattern-learning-flow',
    title: 'Pattern Learning Flow',
    description: 'How patterns are detected and reused',
    steps: [
      { id: 'session', label: 'Session Completes', description: 'An enrichment session finishes', type: 'start', next: 'analyze' },
      { id: 'analyze', label: 'Analyze Session', description: 'Extract actions, outcomes, and context', type: 'process', next: 'detect' },
      { id: 'detect', label: 'Pattern Detection', description: 'Identify repeatable patterns', type: 'process', next: 'store' },
      { id: 'store', label: 'Store Pattern', description: 'Save pattern with triggers and actions', type: 'process', next: 'new-request' },
      { id: 'new-request', label: 'New Request', description: 'User submits a similar request', type: 'process', next: 'match' },
      { id: 'match', label: 'Pattern Match?', description: 'Check if patterns apply', type: 'decision', next: { yes: 'apply', no: 'normal' } },
      { id: 'apply', label: 'Apply Pattern', description: 'Enhance prompt with learned pattern', type: 'process', next: 'execute' },
      { id: 'normal', label: 'Normal Processing', description: 'Process without pattern enhancement', type: 'process', next: 'execute' },
      { id: 'execute', label: 'Execute Request', description: 'Complete the work', type: 'end' },
    ],
    relatedGuides: ['pattern-learning'],
  },
];

export const guides: Guide[] = [
  // Getting Started
  {
    id: 'your-first-request',
    title: 'Your First Request',
    description: 'Learn how to submit your first request via voice or chat and monitor its progress.',
    category: 'getting-started',
    difficulty: 'beginner',
    icon: 'Rocket',
    estimatedTime: '5 min',
    content: `# Your First Request

Welcome to Command Center! This guide walks you through submitting your first request.

## Submitting a Request

You can submit requests in two ways:

### Via Chat
1. Navigate to the **Chat** page
2. Type your request in natural language (e.g., "Add a dark mode toggle to the settings page")
3. Press Enter or click Send

### Via Voice
1. Navigate to the **Voice** page or press \`Ctrl+Shift+V\` anywhere
2. Click the microphone button to start recording
3. Speak your request clearly
4. Click Stop and then Submit

## What Happens Next

1. **Triage** - Your request is analyzed and classified
2. **Assignment** - The appropriate C-Suite agent is selected (CEO, CTO, or CMO)
3. **Execution** - The agent begins working on your request
4. **Monitoring** - Watch progress in real-time on the Activity page

## Monitoring Your Request

Navigate to **Activity** to see:
- Current status (queued, running, completed)
- Real-time event stream
- Agent responses and actions
- Completion status

## Tips for Better Results

- Be specific about what you want
- Include relevant context (file names, feature names)
- Mention any constraints or preferences`,
    relatedPages: ['/chat', '/voice', '/activity'],
  },
  {
    id: 'understanding-agents',
    title: 'Understanding C-Suite Agents',
    description: 'Learn about CEO, CTO, and CMO agents and when each is selected.',
    category: 'getting-started',
    difficulty: 'beginner',
    icon: 'Users',
    estimatedTime: '5 min',
    content: `# Understanding C-Suite Agents

Command Center uses specialized AI agents modeled after executive roles. Each agent has distinct capabilities and handles different types of requests.

## The C-Suite

### CEO (Strategic)
- **Focus**: Business strategy, prioritization, product direction
- **Best for**: High-level planning, feature prioritization, business decisions
- **Does NOT**: Write code directly
- **Delegates to**: CTO for technical work, CMO for growth work

### CTO (Technical)
- **Focus**: Code implementation, architecture, deployments
- **Best for**: Feature implementation, bug fixes, technical architecture
- **Capabilities**:
  - Writes and modifies code
  - Acquires locks before editing shared files
  - Updates status after milestones

### CMO (Growth)
- **Focus**: Marketing, positioning, acquisition
- **Best for**: Marketing copy, growth experiments, user acquisition
- **Coordinates with**: CTO for technical changes
- **Respects**: Platform terms and guidelines

## How Agents Are Selected

When you submit a request, the **Triage Agent** analyzes it:

1. **Strategic requests** → CEO
   - "What should we prioritize next quarter?"
   - "How should we position this feature?"

2. **Technical requests** → CTO
   - "Add dark mode to settings"
   - "Fix the login bug"

3. **Growth requests** → CMO
   - "Write copy for the landing page"
   - "Create a user acquisition plan"

## Viewing Agent Status

Navigate to **Agents** to see:
- All registered agents
- Current status and health
- Recent activity
- Capabilities and specializations`,
    relatedPages: ['/agents', '/activity'],
  },

  // Workflows
  {
    id: 'goals-to-tasks',
    title: 'Goals to Tasks: Breaking Down Projects',
    description: 'Learn how to create goals and decompose them into actionable tasks.',
    category: 'workflows',
    difficulty: 'intermediate',
    icon: 'Target',
    estimatedTime: '10 min',
    content: `# Goals to Tasks: Breaking Down Projects

Large projects are easier to manage when broken into smaller, actionable tasks. Command Center's intelligent work system helps you do this automatically.

## Creating a Goal

1. Navigate to **Goals**
2. Click **Create Goal**
3. Fill in:
   - **Title**: Clear, outcome-focused name
   - **Description**: Detailed context and requirements
   - **Priority**: High, Medium, or Low

## AI Decomposition

Once you have a goal, Command Center can automatically break it into tasks:

1. Open your goal
2. Click **Decompose with AI**
3. Review the generated tasks
4. Adjust as needed and confirm

### What AI Considers

- Goal description and requirements
- Project context and history
- Similar past goals and how they were completed
- Logical task ordering and dependencies

## Task Management

Each task includes:
- **Status**: pending, in_progress, completed
- **Assignee**: Can be assigned to an agent or team
- **Checkout**: Prevents duplicate work

### Task Checkout

Before working on a task:
1. An agent checks out the task
2. The task is locked to prevent conflicts
3. Other agents see the task is in progress
4. After completion, the task is released

## Tracking Progress

- View overall goal progress on the Goals page
- See individual task status on the Tasks page
- Monitor real-time execution in Activity`,
    relatedPages: ['/goals', '/tasks', '/activity'],
    prerequisites: ['your-first-request'],
  },
  {
    id: 'voice-commands',
    title: 'Voice Input & Commands',
    description: 'Master voice input and navigation commands for hands-free operation.',
    category: 'workflows',
    difficulty: 'beginner',
    icon: 'Mic',
    estimatedTime: '5 min',
    content: `# Voice Input & Commands

Command Center supports comprehensive voice input for submitting requests and navigating the interface.

## Voice Input Methods

### Dedicated Voice Page
Navigate to **/voice** for the full voice input experience:
- Large recording interface
- Visual feedback during recording
- Preview before submission

### Global Voice Commands
Press \`Ctrl+Shift+V\` anywhere to toggle voice commands:
- A floating microphone button appears
- Speak navigation or action commands
- Works on any page

## Navigation Commands

Say these to navigate:
- "Go to dashboard"
- "Open activity"
- "Show goals"
- "Navigate to tasks"
- "Open agents"
- "Go to costs"

## Action Commands

Say these to trigger actions:
- "New project" - Creates a new project
- "Refresh" - Refreshes current page
- "Go back" - Returns to previous page

## Wispr Flow Integration

If you use Wispr Flow for dictation:

1. Configure the file watcher:
   \`\`\`bash
   cd packages/bridge
   WISPR_OUTPUT_DIR=/path/to/wispr/output npm run wispr
   \`\`\`

2. Wispr Flow outputs are automatically ingested
3. Works with \`.txt\` and \`.md\` files

## Tips for Voice Input

- Speak clearly and at a natural pace
- Wait for the visual indicator before speaking
- Use specific, detailed descriptions
- Review the transcription before submitting`,
    relatedPages: ['/voice', '/chat'],
  },

  // Features
  {
    id: 'pattern-learning',
    title: 'Pattern Learning & Reuse',
    description: 'Discover how Command Center learns patterns and applies them to new requests.',
    category: 'features',
    difficulty: 'intermediate',
    icon: 'Lightbulb',
    estimatedTime: '8 min',
    content: `# Pattern Learning & Reuse

Command Center learns from successful executions and can apply those patterns to similar future requests.

## How Patterns Are Detected

After each completed session, Command Center analyzes:
- The original request
- Steps taken to complete it
- Code changes made
- Outcomes and results

Common patterns are extracted and stored for reuse.

## Viewing Patterns

Navigate to **Patterns** to see:
- All detected patterns
- Pattern descriptions and triggers
- Usage statistics
- Related sessions

## Pattern Types

### Workflow Patterns
- Common sequences of actions
- Multi-step processes
- Recurring workflows

### Code Patterns
- Common code structures
- Frequently used solutions
- Architecture patterns

### Communication Patterns
- Successful prompt structures
- Effective context provision
- Clear requirement formatting

## Applying Patterns

Patterns are applied automatically when:
1. A new request matches a known pattern
2. Similar context is detected
3. The pattern has a high success rate

You can also manually apply patterns:
1. Open the **Patterns** page
2. Find a relevant pattern
3. Click **Apply to Prompt**
4. Edit and submit

## Cross-Project Reuse

Patterns learned in one project can be applied to others:
- Patterns are tagged by project
- Similar projects suggest relevant patterns
- You can browse patterns from other projects`,
    relatedPages: ['/patterns', '/sessions'],
    prerequisites: ['your-first-request'],
  },
  {
    id: 'approval-policies',
    title: 'Approval Policies & Governance',
    description: 'Configure trust-based governance with approval policies and delegation.',
    category: 'features',
    difficulty: 'intermediate',
    icon: 'Shield',
    estimatedTime: '10 min',
    content: `# Approval Policies & Governance

Command Center includes trust-based governance to ensure appropriate human oversight of agent actions.

## When Approvals Trigger

Approvals are required for:
- High-risk operations (deployments, database changes)
- Actions exceeding cost thresholds
- Operations on protected resources
- Computer use interactions

## Setting Up Policies

1. Navigate to **Approvals**
2. Click **Policies** tab
3. Click **Create Policy**

### Policy Configuration

- **Name**: Descriptive policy name
- **Trigger**: What activates this policy
- **Scope**: Which agents/projects it applies to
- **Approvers**: Who can approve
- **Timeout**: Auto-action if no response

## Policy Types

### Risk-Based
Trigger based on operation risk level:
- Low risk: Auto-approve
- Medium risk: Single approver
- High risk: Multi-approver

### Cost-Based
Trigger based on estimated cost:
- Under $10: Auto-approve
- $10-$100: Manager approval
- Over $100: Executive approval

### Resource-Based
Trigger based on affected resources:
- Production: Always require approval
- Staging: Manager approval
- Development: Auto-approve

## Delegation Chains

Set up delegation for when primary approvers are unavailable:

1. Go to **Teams**
2. Configure delegation rules
3. Set backup approvers
4. Define escalation timeouts

## Learning from Decisions

The approval engine learns from your decisions:
- Frequently approved actions may auto-approve
- Rejected patterns trigger warnings
- Trust levels adjust over time`,
    relatedPages: ['/approvals', '/teams', '/agents'],
    prerequisites: ['understanding-agents'],
  },
  {
    id: 'cost-tracking',
    title: 'Cost Tracking & Budgets',
    description: 'Monitor API costs, set budgets, and receive alerts before exceeding limits.',
    category: 'features',
    difficulty: 'beginner',
    icon: 'DollarSign',
    estimatedTime: '5 min',
    content: `# Cost Tracking & Budgets

Command Center tracks all API costs and helps you manage budgets across projects.

## Understanding the Costs Page

Navigate to **Costs** to see:
- **This Month Total**: Current month spending
- **Total Tokens**: Input + output token usage
- **Active Alerts**: Budget warnings

## Budget Setup

To set a monthly budget for a project:

1. Go to **Projects**
2. Select a project
3. Click **Edit**
4. Set **Monthly Budget**
5. Save changes

## Budget Alerts

Alerts trigger at these thresholds:
- **Warning**: 80% of budget used
- **Critical**: 90% of budget used
- **Exceeded**: Over 100% of budget

Alerts appear on the Costs page and in the dashboard.

## Per-Project Breakdown

Click on any project in the Costs page to see:
- Cost by model (Claude, etc.)
- Cost by agent type (CEO, CTO, CMO)
- Daily cost trends
- Budget progress bar

## Cost Optimization Tips

1. **Be specific**: Clear requests need fewer iterations
2. **Use patterns**: Learned patterns are more efficient
3. **Set budgets**: Prevent runaway costs
4. **Monitor trends**: Identify expensive patterns`,
    relatedPages: ['/costs', '/projects'],
  },

  // Troubleshooting
  {
    id: 'common-issues',
    title: 'Common Issues & Solutions',
    description: 'Troubleshoot common problems with runs, agents, voice input, and patterns.',
    category: 'troubleshooting',
    difficulty: 'beginner',
    icon: 'HelpCircle',
    estimatedTime: '5 min',
    content: `# Common Issues & Solutions

Quick fixes for the most common issues you might encounter.

## Run Stuck in "Queued"

**Symptoms**: Your request shows "queued" status and doesn't start.

**Solutions**:
1. Check the **Agents** page - ensure agents are active
2. Verify the bridge service is running
3. Check for any blocking approvals in **Approvals**
4. Refresh the Activity page

## Agent Not Responding

**Symptoms**: An agent is assigned but not making progress.

**Solutions**:
1. Check agent status on **Agents** page
2. Look for heartbeat failures
3. Try pausing and resuming the agent
4. Check logs for errors

## Voice Input Not Working

**Symptoms**: Microphone doesn't activate or doesn't hear you.

**Solutions**:
1. Check browser microphone permissions
2. Ensure you're using a supported browser (Chrome recommended)
3. Try the dedicated **/voice** page
4. Check that your microphone is selected in browser settings

## Pattern Not Applying

**Symptoms**: A relevant pattern exists but isn't being applied.

**Solutions**:
1. Verify the pattern is active (not disabled)
2. Check pattern triggers match your request
3. Try manually applying the pattern
4. Update pattern triggers if needed

## High Costs on a Project

**Symptoms**: Unexpected high API costs.

**Solutions**:
1. Check the **Costs** page for breakdown by model
2. Look for repeated failed attempts
3. Review if requests are too vague (causing retries)
4. Set a budget limit to prevent overruns

## Task Checkout Conflicts

**Symptoms**: Can't check out a task, says it's locked.

**Solutions**:
1. Check who has the task checked out in **Tasks**
2. Wait for the current checkout to complete
3. Contact the assigned agent's owner
4. If stuck, an admin can force release`,
    relatedPages: ['/activity', '/agents', '/voice', '/patterns', '/approvals', '/tasks'],
  },

  // Process Flows (new category)
  {
    id: 'execution-template',
    title: 'Execution Template Guide',
    description: 'How to use and configure execution repos that integrate with Command Center.',
    category: 'process-flows',
    difficulty: 'intermediate',
    icon: 'GitBranch',
    estimatedTime: '10 min',
    content: `# Execution Template Guide

Level 2 execution repos follow a standardized template for integration with Command Center.

## Architecture Overview

\`\`\`
Command Center (Brain) - Level 1
       │
       ├── Execution Repo A - Level 2
       ├── Execution Repo B - Level 2
       └── Execution Repo C - Level 2
\`\`\`

The Brain orchestrates work across multiple execution repos, each handling a specific business or project.

## Template Structure

\`\`\`
your-repo/
├── src/                    # Your business code
├── status/
│   ├── status.json         # Machine-readable status
│   └── progress.md         # Human-readable log
├── mcp/
│   └── status-reporter/    # Reports to Brain
├── scripts/
│   └── report-status.sh    # Status reporting script
├── .claude/                # Claude Code config
└── .cursor/                # Cursor config
\`\`\`

## Setting Up a New Repo

### 1. Clone the Template
\`\`\`bash
cc-new create my-new-business
cd my-new-business
\`\`\`

### 2. Configure Environment
\`\`\`bash
export BRAIN_ROOT=/path/to/command-center
export REPO_ID=my-new-business
export REPO_NAME="My New Business"
\`\`\`

### 3. Initialize Status Reporting
\`\`\`bash
cd mcp/status-reporter
npm install && npm run build
cd ../..
./scripts/report-status.sh
\`\`\`

## Status Contract

The \`status/status.json\` file must follow this schema:

\`\`\`json
{
  "repoId": "my-repo",
  "name": "My Repo",
  "ok": true,
  "lastUpdatedAt": "2024-01-01T00:00:00.000Z",
  "git": {
    "head": "abc123",
    "branch": "main"
  },
  "signals": {
    "hasStatusFile": true
  }
}
\`\`\`

## Reporting Status

After meaningful progress, report status to the Brain:

\`\`\`bash
./scripts/report-status.sh
\`\`\`

This updates the global portfolio status in Command Center.

## Development Standards

1. **Tests must pass** - Never leave repo in broken state
2. **Small PRs** - One feature slice per branch
3. **No secrets** - Never hardcode credentials
4. **Update status** - Report after each milestone

## Coordination with Brain

- Repos are registered in the portfolio MCP server
- Status rolls up to \`runtime/status.json\`
- Respect locks when editing shared contracts
- C-Suite agents can dispatch work to any registered repo`,
    relatedPages: ['/projects', '/activity'],
    prerequisites: ['understanding-agents'],
  },
  {
    id: 'end-to-end-workflow',
    title: 'End-to-End Workflow',
    description: 'Complete walkthrough from idea to deployed feature.',
    category: 'process-flows',
    difficulty: 'advanced',
    icon: 'Workflow',
    estimatedTime: '15 min',
    content: `# End-to-End Workflow

This guide walks through a complete workflow from initial idea to deployed feature.

## Phase 1: Capture the Idea

### Voice Input
1. Press \`Ctrl+Shift+V\` or navigate to /voice
2. Describe your feature: "Add user profile avatars with upload capability"
3. Review transcription and submit

### Or Chat Input
1. Navigate to /chat
2. Type detailed requirements
3. Submit for triage

## Phase 2: Triage & Assignment

The system automatically:
1. **Analyzes** your request for complexity and type
2. **Classifies** as strategic, technical, or growth
3. **Assigns** to appropriate C-Suite agent (likely CTO for this)

Monitor in **Activity** to see triage results.

## Phase 3: Goal Creation

For larger features:
1. Navigate to **Goals**
2. Create a goal with the feature description
3. Click **Decompose with AI**

Generated tasks might include:
- Design avatar component UI
- Create image upload API
- Add avatar storage integration
- Update user profile page
- Write tests

## Phase 4: Task Execution

For each task:
1. Agent checks out the task (locks it)
2. Agent executes the work
3. Progress streams to Activity feed
4. On completion, task is released

### Approval Gates

If the task triggers approval policies:
1. Notification appears in **Approvals**
2. Review the proposed changes
3. Approve or reject with comments
4. Agent continues or adjusts

## Phase 5: Cross-Repo Coordination

If work spans multiple repos:
1. Brain dispatches to appropriate execution repo
2. Execution repo reports status via MCP
3. Status rolls up to portfolio dashboard
4. All progress visible in Activity

## Phase 6: Completion & Learning

After completion:
1. All tasks marked complete
2. Goal marked achieved
3. Patterns extracted from session
4. Costs recorded and tracked

## Monitoring Throughout

- **Activity**: Real-time event stream
- **Goals**: High-level progress
- **Tasks**: Individual task status
- **Agents**: Agent health and activity
- **Costs**: Running cost totals

## Tips for Success

1. Start with clear, specific requirements
2. Break large features into goals
3. Let AI decompose into manageable tasks
4. Monitor Activity for real-time progress
5. Review patterns learned for future reuse`,
    relatedPages: ['/chat', '/voice', '/goals', '/tasks', '/activity', '/approvals'],
    prerequisites: ['your-first-request', 'goals-to-tasks', 'understanding-agents'],
  },

  // Developer Configuration
  {
    id: 'mcp-configuration',
    title: 'MCP Servers',
    description: 'Configure portfolio MCP tools, understand MCP architecture, and create custom MCP servers.',
    category: 'developer-config',
    difficulty: 'intermediate',
    icon: 'Settings',
    estimatedTime: '12 min',
    content: `# MCP Servers

Model Context Protocol (MCP) servers extend Claude's capabilities by providing tools and resources that Claude can use during execution.

## What is MCP?

MCP (Model Context Protocol) is a protocol that allows Claude to:
- Access external tools and APIs
- Query databases and file systems
- Interact with external services
- Maintain context across sessions

## Portfolio MCP Server

The Command Center includes a built-in portfolio MCP server that provides tools for cross-repo coordination.

### Available Tools

**Repo Registry:**
- \`register_repo\` - Register a new repo in the portfolio
- \`list_repos\` - List all registered repos
- \`unregister_repo\` - Remove a repo from the registry

**Status Management:**
- \`report_status\` - Report status from an execution repo
- \`audit_all\` - Audit all repos by reading their status.json
- \`rebuild_global_status\` - Rebuild the global status rollup
- \`get_global_status\` - Get current portfolio status

**Locking:**
- \`acquire_lock\` - Acquire a lock on a resource
- \`release_lock\` - Release a lock
- \`list_locks\` - List all active locks
- \`check_lock\` - Check if a resource is locked

## Configuring MCP Servers

### In Claude Code

Add to your \`.claude/settings.json\`:

\`\`\`json
{
  "mcpServers": {
    "portfolio": {
      "command": "node",
      "args": ["mcp/portfolio-server/dist/index.js"],
      "env": {
        "BRAIN_ROOT": "/path/to/command-center"
      }
    }
  }
}
\`\`\`

### In Cursor

Add to \`.cursor/mcp.json\`:

\`\`\`json
{
  "mcpServers": {
    "portfolio": {
      "command": "node",
      "args": ["mcp/portfolio-server/dist/index.js"]
    }
  }
}
\`\`\`

## Creating Custom MCP Servers

### Basic Structure

\`\`\`typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "my-server",
  version: "1.0.0",
});

// Define a tool
server.tool("my_tool", "Description of tool", {
  param1: { type: "string", description: "A parameter" }
}, async ({ param1 }) => {
  return { content: [{ type: "text", text: "Result" }] };
});

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
\`\`\`

### Best Practices

1. **Naming**: Use snake_case for tool names
2. **Descriptions**: Provide clear, concise descriptions
3. **Error Handling**: Return helpful error messages
4. **Idempotency**: Make tools safe to retry
5. **Logging**: Log tool invocations for debugging

## Debugging MCP Servers

### Enable Verbose Logging

Set \`MCP_DEBUG=1\` in your environment:

\`\`\`bash
MCP_DEBUG=1 node mcp/portfolio-server/dist/index.js
\`\`\`

### Common Issues

- **Server not starting**: Check the command path is correct
- **Tool not found**: Ensure the tool is registered before connect()
- **Timeout errors**: Increase timeout in settings`,
    relatedPages: ['/projects', '/activity'],
    prerequisites: ['execution-template'],
  },
  {
    id: 'skills-configuration',
    title: 'Skills & Workflows',
    description: 'Configure skills for agents, understand skill structure, and create marketing automation skills.',
    category: 'developer-config',
    difficulty: 'intermediate',
    icon: 'Sparkles',
    estimatedTime: '10 min',
    content: `# Skills & Workflows

Skills are reusable workflows that agents can execute. They define step-by-step procedures for common tasks.

## What Are Skills?

Skills are:
- **Predefined workflows** that agents can invoke
- **Parameterized** - accept inputs and produce outputs
- **Composable** - can call other skills
- **Versioned** - can be updated without breaking existing uses

## Skill Structure

### Basic Skill Definition

\`\`\`yaml
name: deploy-to-staging
description: Deploy the current branch to staging environment
parameters:
  - name: branch
    type: string
    default: main
    description: Branch to deploy
steps:
  - name: Build
    action: run_command
    command: npm run build
  - name: Deploy
    action: run_command
    command: ./scripts/deploy.sh staging {{ branch }}
  - name: Verify
    action: http_request
    url: https://staging.example.com/health
    expected_status: 200
\`\`\`

## Skill Locations

Skills can be defined in multiple locations:

### Project-Level Skills

Located in \`.claude/skills/\` or \`.cursor/skills/\`:

\`\`\`
your-project/
├── .claude/
│   └── skills/
│       ├── deploy.yaml
│       ├── test.yaml
│       └── release.yaml
\`\`\`

### Global Skills

Located in \`~/.claude/skills/\`:

\`\`\`
~/.claude/
└── skills/
    ├── git-workflow.yaml
    └── pr-review.yaml
\`\`\`

## Marketing Skills

The Command Center includes built-in marketing skills:

### Available Marketing Skills

| Skill | Description |
|-------|-------------|
| \`generate-copy\` | Generate marketing copy with brand voice |
| \`create-campaign\` | Create a multi-channel campaign |
| \`render-video\` | Render a Remotion video template |
| \`analyze-metrics\` | Analyze campaign performance |

### Using Marketing Skills

\`\`\`typescript
// Via API
const response = await fetch('/api/marketing/skills/generate-copy', {
  method: 'POST',
  body: JSON.stringify({
    type: 'landing-page',
    product: 'Command Center',
    tone: 'professional',
  }),
});
\`\`\`

## Creating Custom Skills

### Step Types

- \`run_command\` - Execute a shell command
- \`http_request\` - Make an HTTP request
- \`invoke_skill\` - Call another skill
- \`prompt_llm\` - Generate text with LLM
- \`conditional\` - Branch based on condition
- \`loop\` - Repeat steps

### Example: PR Review Skill

\`\`\`yaml
name: pr-review
description: Review a pull request and provide feedback
parameters:
  - name: pr_number
    type: integer
    required: true
steps:
  - name: Fetch PR
    action: run_command
    command: gh pr view {{ pr_number }} --json body,files
    output: pr_data
  - name: Analyze Changes
    action: prompt_llm
    prompt: |
      Review these changes and provide feedback:
      {{ pr_data }}
    output: review
  - name: Post Comment
    action: run_command
    command: gh pr comment {{ pr_number }} --body "{{ review }}"
\`\`\`

## Best Practices

1. **Keep skills focused** - One skill, one purpose
2. **Use parameters** - Make skills reusable
3. **Handle errors** - Include error recovery steps
4. **Document well** - Clear descriptions and examples
5. **Version control** - Track skill changes in git`,
    relatedPages: ['/agents', '/activity'],
    prerequisites: ['understanding-agents'],
  },
  {
    id: 'rules-configuration',
    title: 'Rule Files & CLAUDE.md',
    description: 'Configure CLAUDE.md files, set up rule inheritance, and establish project conventions.',
    category: 'developer-config',
    difficulty: 'beginner',
    icon: 'FileCode',
    estimatedTime: '8 min',
    content: `# Rule Files & CLAUDE.md

Rule files provide persistent context and guidelines that Claude follows when working in your codebase.

## CLAUDE.md

The \`CLAUDE.md\` file is the primary way to provide project context to Claude. It lives at the root of your project.

### What to Include

- **Project overview** - What the project does
- **Architecture** - High-level structure
- **Conventions** - Coding standards, naming conventions
- **Commands** - How to build, test, run
- **Important files** - Key files to understand

### Example CLAUDE.md

\`\`\`markdown
# My Project

A web application for task management.

## Architecture

- Next.js frontend in /app
- API routes in /app/api
- Database: PostgreSQL via Prisma

## Commands

- \`npm run dev\` - Start development server
- \`npm run test\` - Run tests
- \`npm run build\` - Build for production

## Conventions

- Use TypeScript for all new code
- Components in /components use PascalCase
- API routes return JSON with { data, error } shape
- Use Tailwind for styling, no inline styles

## Key Files

- \`lib/db.ts\` - Database connection
- \`lib/auth.ts\` - Authentication helpers
- \`components/ui/\` - Shared UI components
\`\`\`

## Rule Files (.claude/rules/)

For more granular control, create rule files in \`.claude/rules/\`:

\`\`\`
your-project/
├── .claude/
│   └── rules/
│       ├── 00-general.md
│       ├── 01-typescript.md
│       └── 02-testing.md
\`\`\`

### Rule File Structure

\`\`\`markdown
# TypeScript Rules

## Strict Mode
- Always use strict TypeScript configuration
- No \`any\` types unless absolutely necessary
- Prefer interfaces over types for object shapes

## Naming
- Use camelCase for variables and functions
- Use PascalCase for types, interfaces, and classes
- Use SCREAMING_SNAKE_CASE for constants

## Imports
- Use absolute imports with @ alias
- Group imports: external, internal, relative
- No circular imports
\`\`\`

## Rule Inheritance

Rules are inherited from parent directories:

\`\`\`
~/
├── .claude/rules/          # Global rules (apply everywhere)
│   └── global.md
└── projects/
    └── my-app/
        ├── CLAUDE.md       # Project rules
        ├── .claude/rules/  # Additional project rules
        │   └── api.md
        └── packages/
            └── ui/
                └── CLAUDE.md  # Package-specific rules
\`\`\`

### Inheritance Order

1. Global rules (\`~/.claude/rules/\`)
2. Project CLAUDE.md
3. Project rules (\`.claude/rules/\`)
4. Subdirectory CLAUDE.md files
5. Subdirectory rules

## Best Practices

1. **Keep CLAUDE.md updated** - Update when architecture changes
2. **Be specific** - Clear, actionable guidelines
3. **Use examples** - Show, don't just tell
4. **Prioritize** - Put most important rules first
5. **Review regularly** - Remove outdated rules

## Common Patterns

### Preventing Common Mistakes

\`\`\`markdown
## DO NOT

- Never commit .env files
- Never use console.log in production code
- Never disable TypeScript errors with @ts-ignore
\`\`\`

### Encouraging Best Practices

\`\`\`markdown
## ALWAYS

- Write tests for new features
- Use error boundaries in React components
- Document public API functions
\`\`\``,
    relatedPages: ['/projects'],
  },
  {
    id: 'memory-context',
    title: 'Memory & Context Building',
    description: 'Understand how context is built, configure memory sources, and leverage pattern detection.',
    category: 'developer-config',
    difficulty: 'advanced',
    icon: 'Brain',
    estimatedTime: '15 min',
    content: `# Memory & Context Building

Command Center builds rich context for every request to help agents understand your project and apply learned patterns.

## Context Sources

### 1. Project History

Every session and run is stored and can inform future requests:

- **Past sessions** - What was requested and done
- **Code changes** - What was modified
- **Patterns** - Successful approaches

### 2. CLAUDE.md and Rules

Static configuration that provides:

- Project structure and architecture
- Coding conventions and standards
- Important files and their purposes

### 3. Git History

Recent commits provide:

- What changed recently
- Who made changes
- Commit messages for context

### 4. Learned Patterns

Patterns extracted from successful sessions:

- Workflow patterns (how tasks are done)
- Code patterns (common solutions)
- Communication patterns (effective prompts)

## ContextBuilder Service

The \`ContextBuilder\` service aggregates context from all sources:

\`\`\`typescript
// lib/services/ContextBuilder.ts
export class ContextBuilder {
  async build(projectId: string): Promise<Context> {
    const [
      projectInfo,
      recentSessions,
      patterns,
      gitHistory,
    ] = await Promise.all([
      this.getProjectInfo(projectId),
      this.getRecentSessions(projectId),
      this.getApplicablePatterns(projectId),
      this.getGitHistory(projectId),
    ]);

    return {
      project: projectInfo,
      history: recentSessions,
      patterns,
      git: gitHistory,
    };
  }
}
\`\`\`

## Pattern Detection

The \`PatternDetector\` service analyzes completed sessions to extract reusable patterns:

### Pattern Types

**Workflow Patterns**
- Sequences of actions that work well together
- Common task decomposition approaches
- Effective review and validation steps

**Code Patterns**
- Frequently used code structures
- Common refactoring approaches
- Architecture patterns

**Communication Patterns**
- Effective prompt structures
- Context that helps understanding
- Clear requirement formatting

### Detection Process

1. **Session Completes** - A session finishes successfully
2. **Analysis** - Extract actions, outcomes, context
3. **Pattern Extraction** - Identify repeatable elements
4. **Storage** - Save pattern with triggers and metadata
5. **Application** - Match and apply to future requests

## Pattern Application

The \`PatternApplicator\` enhances prompts with relevant patterns:

\`\`\`typescript
// Automatic application
const enrichedPrompt = await patternApplicator.apply(
  originalPrompt,
  {
    projectId,
    context,
    threshold: 0.7, // Similarity threshold
  }
);
\`\`\`

### Application Flow

1. **Match Request** - Find patterns similar to current request
2. **Score Relevance** - Rank patterns by similarity and success rate
3. **Select Best** - Choose top patterns above threshold
4. **Enhance Prompt** - Add pattern context to prompt
5. **Execute** - Run with enhanced context

## Configuring Memory

### Session Retention

Configure how long sessions are retained:

\`\`\`typescript
// lib/config.ts
export const memoryConfig = {
  sessionRetentionDays: 90,
  maxSessionsPerProject: 1000,
  patternMinOccurrences: 3,
  patternMinSuccessRate: 0.8,
};
\`\`\`

### Pattern Thresholds

Configure pattern detection sensitivity:

\`\`\`typescript
export const patternConfig = {
  minSimilarity: 0.7,      // Minimum similarity to apply
  maxPatternsPerPrompt: 3, // Max patterns to apply
  decayRate: 0.1,          // How fast old patterns lose weight
};
\`\`\`

## Cross-Project Learning

Patterns can be shared across projects:

### Enabling Cross-Project Patterns

\`\`\`typescript
// When creating a project
const project = {
  name: "My App",
  settings: {
    allowCrossProjectPatterns: true,
    patternSources: ["similar-app", "template-project"],
  },
};
\`\`\`

### Pattern Scopes

- **Project** - Only this project
- **Organization** - All projects in org
- **Global** - All projects (opt-in)

## Debugging Context

### View Built Context

\`\`\`bash
# Via API
curl http://localhost:3000/api/context?projectId=my-project

# Returns
{
  "project": { ... },
  "history": [ ... ],
  "patterns": [ ... ],
  "git": { ... }
}
\`\`\`

### Pattern Debugging

\`\`\`bash
# List patterns for a project
curl http://localhost:3000/api/patterns?projectId=my-project

# Check pattern match for a prompt
curl -X POST http://localhost:3000/api/patterns/match \\
  -d '{"prompt": "Add dark mode", "projectId": "my-project"}'
\`\`\``,
    relatedPages: ['/patterns', '/sessions', '/projects'],
    prerequisites: ['pattern-learning', 'rules-configuration'],
  },
];

export const categoryLabels: Record<Guide['category'], string> = {
  'getting-started': 'Getting Started',
  'workflows': 'Workflows',
  'features': 'Features',
  'troubleshooting': 'Troubleshooting',
  'process-flows': 'Process Flows',
  'developer-config': 'Developer Config',
};

export const difficultyColors: Record<Guide['difficulty'], { bg: string; text: string }> = {
  beginner: { bg: 'bg-green-500/10', text: 'text-green-600' },
  intermediate: { bg: 'bg-yellow-500/10', text: 'text-yellow-600' },
  advanced: { bg: 'bg-red-500/10', text: 'text-red-600' },
};
