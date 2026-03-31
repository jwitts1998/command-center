# Unified Template: Integration Specification

## Overview

This document provides detailed specifications for implementing the unified multi-agent template that merges:
- **claude-multi-agnet**: Rich agent system, Idea-to-PDB, 30 MCPs
- **execution-template**: Command Center integration, status reporting

---

## 1. File Structure Specification

### Root Directory

| File/Dir | Source | Action | Notes |
|----------|--------|--------|-------|
| `CLAUDE.md` | Both | Merge | Agent rules + CC integration |
| `AGENTS.md` | claude-multi-agnet | Copy | Full 4-role system |
| `README.md` | New | Create | Unified quick-start |
| `.cursorrules` | execution-template | Copy | Keep CC rules |
| `.gitignore` | Both | Merge | Combined ignores |
| `setup.sh` | claude-multi-agnet | Enhance | Add CC config step |
| `validate.sh` | claude-multi-agnet | Copy | Keep validation |

### .claude/ Directory

```
.claude/
├── settings.json          # FROM execution-template (permissions)
├── rules/                  # FROM claude-multi-agnet
│   ├── token-efficiency.md
│   ├── domain-routing.md
│   ├── domain-consultation.md
│   ├── domain-knowledge-freshness.md
│   ├── domain-agent-loading.md
│   ├── docs-editing.md
│   └── template-editing.md
├── skills/                 # FROM claude-multi-agnet
│   ├── apply-multi-agent-template/
│   ├── calibrate-domains/
│   ├── domain-routing/
│   ├── feature-audit/
│   ├── full-pipeline/
│   └── migrate-from-cursor/
├── agents/                 # FROM claude-multi-agnet (populated by setup.sh)
│   ├── generic/
│   ├── ideation/
│   ├── ingestion/
│   ├── specialists/
│   └── domains/
└── logs/                   # Runtime logs
```

### templates/ Directory

```
templates/
├── claude-config/          # CLAUDE.md variants
│   ├── base-template.md
│   ├── mobile-app.md
│   ├── web-app.md
│   ├── backend-service.md
│   ├── full-stack.md
│   └── rules/              # Rule file templates
├── agents/                 # AGENTS.md variants
│   ├── AGENTS-base.md
│   ├── AGENTS-mobile.md
│   ├── AGENTS-web.md
│   ├── AGENTS-backend.md
│   └── AGENTS-full-stack.md
├── subagents/              # All subagent configs
│   ├── generic/
│   ├── ideation/
│   ├── ingestion/
│   ├── specialists/
│   ├── domains/
│   └── system/
├── tasks/                  # Task schema templates
│   ├── tasks-schema.yml
│   └── feature-task-template.yml
└── workflow/               # Workflow documentation
    ├── MULTI_AGENT_WORKFLOW.md
    └── DEVELOPMENT_WORKFLOW.md
```

### mcp/ Directory

```
mcp/
├── status-reporter/        # FROM execution-template
│   ├── src/
│   │   ├── local-status.ts
│   │   └── report-status.ts
│   ├── dist/
│   ├── package.json
│   └── tsconfig.json
└── .mcp.json               # MERGED (31 MCPs total)
```

### status/ Directory

```
status/
├── status.json             # Machine-readable status contract
└── progress.md             # Human-readable progress log
```

### Additional Directories

```
tasks/                      # Task files (YAML)
├── tasks.yml               # Portfolio-level milestones
└── [feature-tasks].yml     # Per-feature tasks

docs/
├── product_design/         # PDB output location
├── architecture/           # TAD output location
├── IDEA_TO_PDB.md
├── MCP_SETUP_GUIDE.md
├── INTEGRATION_GUIDE.md
├── CUSTOMIZATION_GUIDE.md
└── TROUBLESHOOTING.md

src/                        # Business code (empty in template)

scripts/
├── setup.sh                # Interactive setup
├── validate.sh             # Template validation
└── report-status.sh        # Status reporting

examples/
├── mobile-app-example/
├── web-app-example/
├── backend-service-example/
└── full-stack-example/
```

---

## 2. CLAUDE.md Specification

### Structure

```markdown
# Multi-Agent Execution Repository

## Overview

This is a Level 2 execution repo in the Command Center portfolio with a
full multi-agent development system. It reports status to the Brain via MCP.

## How This System Works

### Agent Roles
[4 core roles from claude-multi-agnet]

### Task-Driven Development
[YAML task schema from claude-multi-agnet]

### Command Center Integration
[Status contract and coordination from execution-template]

## Key Directories
[Merged directory structure]

## Available Agents
[Full subagent list from claude-multi-agnet]

## Development Standards
[Merged standards from both]

## Status Reporting
[Protocol from execution-template]

## Session Checklist
[From claude-multi-agnet]
```

### Key Sections to Merge

| Section | Source | Notes |
|---------|--------|-------|
| Overview | Both | Combine descriptions |
| Agent Roles | claude-multi-agnet | Keep all 4 roles |
| Task Development | claude-multi-agnet | Keep YAML schema |
| CC Integration | execution-template | Add new section |
| Key Directories | Both | Merge paths |
| Available Agents | claude-multi-agnet | Full list |
| Standards | Both | Merge (no duplicates) |
| Status Reporting | execution-template | Add new section |
| Session Checklist | claude-multi-agnet | Keep as-is |

---

## 3. MCP Configuration Specification

### .mcp.json Structure

```json
{
  "mcpServers": {
    // TIER 0: COMMAND CENTER (Priority: Boot first)
    "portfolio-server": {
      "command": "node",
      "args": ["${BRAIN_ROOT}/mcp/portfolio-server/dist/index.js"],
      "env": {
        "BRAIN_ROOT": "${BRAIN_ROOT}"
      }
    },

    // TIER 1: ESSENTIAL (5 MCPs)
    "context7": { ... },
    "sequential-thinking": { ... },
    "idea-reality": { ... },
    "github": { ... },
    "filesystem": { ... },

    // TIER 2: UI/UX & DESIGN (3 MCPs)
    "figma": { ... },
    "shadcn": { ... },
    "magic-21st": { ... },

    // TIER 3: CODEBASE INTELLIGENCE (3 MCPs)
    "tng": { ... },
    "codebase-checkup": { ... },
    "code-indexer": { ... },

    // TIER 4: SECURITY & QUALITY (2 MCPs)
    "snyk": { ... },
    "sonarqube": { ... },

    // TIER 5: TASK ORCHESTRATION (5 MCPs)
    "workflows": { ... },
    "task-orchestrator": { ... },
    "tasks": { ... },
    "linear": { ... },
    "notion": { ... },

    // TIER 6: BACKEND & DEPLOYMENT (4 MCPs)
    "supabase": { ... },
    "sqlite": { ... },
    "e2b": { ... },
    "vercel": { ... },

    // TIER 7: OBSERVABILITY (2 MCPs)
    "sentry": { ... },
    "datadog": { ... },

    // TIER 8: DOCUMENTATION (2 MCPs)
    "mintlify": { ... },
    "aws-code-doc-gen": { ... },

    // TIER 9: CI/CD & OPS (2 MCPs)
    "github-actions": { ... },
    "gitlab": { ... }
  }
}
```

### Environment Variables Required

| Variable | Required | Description |
|----------|----------|-------------|
| `BRAIN_ROOT` | Yes | Path to Command Center |
| `REPO_ID` | No | Override auto-detected repo ID |
| `REPO_NAME` | No | Human-readable name |
| `FIGMA_ACCESS_TOKEN` | For Figma | Figma API token |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | For GitHub | GitHub API token |
| `SUPABASE_URL` | For Supabase | Project URL |
| `SUPABASE_KEY` | For Supabase | API key |
| `SENTRY_DSN` | For Sentry | Error tracking DSN |

---

## 4. Setup Script Enhancement

### Current Flow (claude-multi-agnet)

1. Project Information
2. Technology Stack
3. Architecture & Patterns
4. Team & Process
5. Template Configuration
6. Subagent Setup

### Enhanced Flow (Unified)

1. Project Information
2. Technology Stack
3. Architecture & Patterns
4. Team & Process
5. **Command Center Integration** (NEW)
   - BRAIN_ROOT path
   - Portfolio registration
   - Status contract initialization
6. Template Configuration
7. Subagent Setup
8. **Status Initialization** (NEW)
   - Create status/status.json
   - Initial report to Brain

### New Setup Questions

```bash
# Step 5: Command Center Integration
echo "=== Command Center Integration ==="
read -p "Path to Command Center (BRAIN_ROOT): " BRAIN_ROOT
read -p "Register with portfolio? [Y/n]: " REGISTER_PORTFOLIO

if [ "$REGISTER_PORTFOLIO" != "n" ]; then
  # Call portfolio-server register_repo
  # Initialize status/status.json
  # Run initial status report
fi
```

---

## 5. Status Integration Specification

### Agent Workflow Integration

**Before Starting Task:**
```bash
# Check current status
cat status/status.json

# Acquire lock if needed (via Brain MCP)
# brain.acquire_lock(resource="src/feature.ts", owner=REPO_ID)
```

**After Milestone:**
```bash
# Update progress log
echo "## $(date)\n- Completed X\n- Next: Y" >> status/progress.md

# Report status
./scripts/report-status.sh
```

**After Task Completion:**
```bash
# Final status update
./scripts/report-status.sh

# Release locks
# brain.release_lock(resource="src/feature.ts")
```

### Status Signals Extension

```typescript
interface UnifiedSignals {
  // FROM execution-template
  hasStatusFile: boolean;
  hasPackageJson: boolean;
  hasSrc: boolean;

  // NEW: Agent system signals
  hasAgentConfigs: boolean;      // .claude/agents/ exists
  hasTasks: boolean;             // tasks/*.yml exists
  hasPDB: boolean;               // docs/product_design/ has content

  // NEW: Quality signals
  testsPass: boolean;            // Last test run passed
  buildSucceeds: boolean;        // Last build succeeded
  lintClean: boolean;            // No lint errors
}
```

---

## 6. cc-new CLI Updates

### Current Command

```bash
cc-new create my-project
```

### Enhanced Command

```bash
cc-new create my-project \
  --type=web-app \
  --register \
  --brain-root=/path/to/command-center
```

### New Options

| Option | Description | Default |
|--------|-------------|---------|
| `--type` | Project type (mobile/web/backend/full-stack) | Prompt |
| `--register` | Register with portfolio | true |
| `--brain-root` | Path to Command Center | $BRAIN_ROOT |
| `--skip-mcp` | Skip MCP configuration | false |
| `--minimal` | Skip subagents, just CC integration | false |

---

## 7. Migration Path

### For Existing execution-template Repos

```bash
# 1. Add agent system
cp -r unified-template/templates/subagents .claude/agents/
cp -r unified-template/templates/tasks tasks/
cp unified-template/AGENTS.md .

# 2. Merge CLAUDE.md
# Manually add agent sections to existing CLAUDE.md

# 3. Update MCP config
# Add tiers 1-9 to existing .mcp.json

# 4. Validate
./validate.sh
```

### For Existing claude-multi-agnet Repos

```bash
# 1. Add CC integration
cp -r unified-template/mcp/status-reporter mcp/
cp -r unified-template/status .
cp -r unified-template/scripts/report-status.sh scripts/

# 2. Add BRAIN_ROOT to environment
echo "BRAIN_ROOT=/path/to/command-center" >> .env

# 3. Update CLAUDE.md
# Add CC integration sections

# 4. Initialize status
./scripts/report-status.sh
```

---

## 8. Validation Checklist

### Template Validation

- [ ] All `{{VARIABLE}}` placeholders replaced
- [ ] CLAUDE.md has both agent roles AND CC integration
- [ ] AGENTS.md has all 4 core roles
- [ ] .mcp.json has 31 MCPs (30 + portfolio-server)
- [ ] status/status.json exists and valid
- [ ] .claude/agents/ populated with subagents
- [ ] tasks/tasks.yml exists

### Integration Validation

- [ ] `./scripts/report-status.sh` succeeds
- [ ] Status appears in Brain's `runtime/status.json`
- [ ] Subagents invocable via `@agent-name`
- [ ] Idea-to-PDB workflow functions
- [ ] Domain routing works

### End-to-End Validation

- [ ] Create project with `cc-new create test-project`
- [ ] Run `@idea-to-pdb` with test idea
- [ ] Generate tasks with `@pdb-to-tasks`
- [ ] Execute one task with Implementation Agent
- [ ] Verify status reported to Brain

---

## 9. Implementation Order

1. **Create unified-template repo** (from execution-template base)
2. **Copy agent system** (from claude-multi-agnet)
3. **Merge CLAUDE.md** (both sources)
4. **Merge MCP configs** (add portfolio-server to 30 MCPs)
5. **Enhance setup.sh** (add CC integration step)
6. **Update validate.sh** (add CC checks)
7. **Test with sample project**
8. **Update cc-new CLI**
9. **Create migration docs**
10. **Update Command Center docs**

---

## 10. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| MCP config conflicts | Test each MCP individually |
| Setup script complexity | Add skip options, minimal mode |
| Breaking existing repos | Migration is additive, not replacing |
| Portfolio server connection | Graceful fallback to file sync |
| Token efficiency impact | Include rules from day 1 |

---

## Appendix: File Counts

| Directory | claude-multi-agnet | execution-template | Unified |
|-----------|-------------------|-------------------|---------|
| Root config | 12 files | 8 files | 14 files |
| .claude/ | 50+ files | 2 files | 50+ files |
| templates/ | 100+ files | 0 | 100+ files |
| mcp/ | 1 file | 5 files | 6 files |
| docs/ | 15 files | 0 | 15 files |
| examples/ | 20+ files | 0 | 20+ files |
| **Total** | ~200 files | ~15 files | ~210 files |
