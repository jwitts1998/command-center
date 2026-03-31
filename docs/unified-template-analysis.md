# Unified Multi-Agent Template: Architecture Analysis

## Executive Summary

This document analyzes the two source systems for creating a unified multi-agent template:

1. **claude-multi-agnet** - Comprehensive agent system with 30+ subagents, Idea-to-PDB workflow, and extensive MCP integrations
2. **execution-template** - Command Center Level 2 repo with status reporting, Brain coordination, and portfolio integration

**Goal**: Merge into a single canonical template that provides both rich agent capabilities AND Command Center integration.

---

## Comparison Matrix

| Feature | claude-multi-agnet | execution-template | Unified Template |
|---------|-------------------|-------------------|------------------|
| **Agent System** | ✅ 4 core roles + 30+ subagents | ⚠️ 2 agents (CTO, CMO) | ✅ Full agent system |
| **Idea-to-PDB** | ✅ Complete workflow | ❌ Not present | ✅ Include |
| **Status Reporting** | ❌ Not present | ✅ MCP to Brain | ✅ Include |
| **Command Center** | ❌ Standalone | ✅ Level 2 integration | ✅ Include |
| **MCP Servers** | ✅ 30 MCPs (9 tiers) | ✅ 1 MCP (status-reporter) | ✅ Merge all |
| **Token Efficiency** | ✅ Detailed rules | ❌ Not present | ✅ Include |
| **Domain Routing** | ✅ 14 vertical domains | ❌ Not present | ✅ Include |
| **Task Schema** | ✅ YAML-based | ❌ Not present | ✅ Include |
| **Project Types** | ✅ 4 types | ❌ Generic | ✅ Include |
| **Setup Script** | ✅ Interactive | ❌ Manual | ✅ Enhance |

---

## Source 1: claude-multi-agnet

### Strengths (KEEP)

1. **Rich Agent Ecosystem**
   - 4 core roles: Implementation, QA, Testing, Documentation
   - 30+ specialized subagents across 5 categories
   - Domain micro-agents for 14 verticals

2. **Idea-to-Implementation Pipeline**
   - `@idea-to-pdb` - Raw idea → Product Design Blueprint
   - `@pdb-to-tasks` - PDB → YAML task files
   - `@codebase-auditor` - Existing code analysis

3. **Comprehensive MCP Integration**
   - 30 MCPs organized in 9 tiers
   - Essential 5 for quick start
   - Full stack for production

4. **Token Efficiency Rules**
   - Exploration hierarchy (50 → 5000+ tokens)
   - Ask-before-dive pattern
   - Cost-saving shortcuts

5. **Project Type Templates**
   - Mobile (Flutter, React Native)
   - Web (React, Vue, Angular)
   - Backend (Node, Python, Go)
   - Full-Stack (Next.js, Nuxt)

### Gaps (NEEDS FROM execution-template)

1. No status reporting to Command Center
2. No portfolio coordination
3. No Brain integration
4. Standalone operation only

---

## Source 2: execution-template

### Strengths (KEEP)

1. **Command Center Integration**
   - Level 2 execution repo pattern
   - Portfolio registration
   - Status rollup to Brain

2. **Status Contract**
   ```json
   {
     "repoId": "string",
     "name": "string",
     "ok": boolean,
     "lastUpdatedAt": "ISO timestamp",
     "git": { "head": "sha", "branch": "name" },
     "signals": { "hasStatusFile": true, ... }
   }
   ```

3. **MCP Status Reporter**
   - TypeScript MCP client
   - Graceful degradation (MCP → file fallback)
   - Environment-based configuration

4. **Agent Dispatch Protocol**
   - Task packet structure
   - Acceptance criteria
   - Handoff mechanism

5. **Coordination Patterns**
   - Lock acquisition via Brain
   - Scoped autonomy (src/, status/, docs/)
   - Cross-repo coordination rules

### Gaps (NEEDS FROM claude-multi-agnet)

1. Only 2 basic agents (CTO, CMO)
2. No Idea-to-PDB workflow
3. No specialized subagents
4. No domain routing
5. Limited MCP ecosystem
6. No project type templates

---

## Unified Architecture

### Directory Structure

```
unified-template/
├── .claude/
│   ├── rules/                      # FROM claude-multi-agnet
│   │   ├── token-efficiency.md
│   │   ├── domain-routing.md
│   │   ├── domain-consultation.md
│   │   └── docs-editing.md
│   ├── skills/                     # FROM claude-multi-agnet
│   │   ├── apply-multi-agent-template/
│   │   ├── full-pipeline/
│   │   └── migrate-from-cursor/
│   ├── agents/                     # MERGED subagents
│   │   ├── generic/
│   │   ├── ideation/
│   │   ├── ingestion/
│   │   ├── specialists/
│   │   └── domains/
│   └── settings.json               # FROM execution-template
│
├── .cursor/                        # FROM execution-template
│   └── rules/
│       └── 00-project.mdc
├── .cursorrules                    # FROM execution-template
│
├── CLAUDE.md                       # MERGED (agent rules + CC integration)
├── AGENTS.md                       # FROM claude-multi-agnet (full system)
├── README.md                       # NEW (unified quick start)
│
├── templates/                      # FROM claude-multi-agnet
│   ├── claude-config/
│   ├── agents/
│   ├── subagents/
│   ├── tasks/
│   └── workflow/
│
├── mcp/
│   ├── status-reporter/            # FROM execution-template
│   │   ├── src/
│   │   └── package.json
│   └── .mcp.json                   # MERGED (30 MCPs + status)
│
├── status/                         # FROM execution-template
│   ├── status.json
│   └── progress.md
│
├── tasks/                          # FROM claude-multi-agnet
│   └── tasks.yml
│
├── docs/                           # MERGED
│   ├── product_design/             # For PDB output
│   ├── architecture/               # For TAD output
│   ├── IDEA_TO_PDB.md
│   ├── MCP_SETUP_GUIDE.md
│   └── INTEGRATION_GUIDE.md
│
├── src/                            # Business code (empty in template)
│
├── scripts/
│   ├── report-status.sh            # FROM execution-template
│   └── setup.sh                    # FROM claude-multi-agnet (enhanced)
│
└── examples/                       # FROM claude-multi-agnet
    ├── mobile-app-example/
    ├── web-app-example/
    └── full-stack-example/
```

### CLAUDE.md Structure (Merged)

```markdown
# Multi-Agent Execution Repository

## Overview
Level 2 execution repo with full multi-agent development system.
Reports status to Command Center (Brain) via MCP.

## Agent System
[FROM claude-multi-agnet - 4 core roles, subagent invocation]

## Task-Driven Development
[FROM claude-multi-agnet - YAML task schema]

## Command Center Integration
[FROM execution-template - status contract, coordination]

## Available Agents
[FROM claude-multi-agnet - full subagent list]

## Development Standards
[MERGED - both systems' standards]

## Status Reporting
[FROM execution-template - report workflow]
```

### MCP Configuration (Merged)

```json
{
  "mcpServers": {
    // TIER 0: COMMAND CENTER (NEW)
    "portfolio-server": {
      "command": "node",
      "args": ["${BRAIN_ROOT}/mcp/portfolio-server/dist/index.js"],
      "env": { "BRAIN_ROOT": "${BRAIN_ROOT}" }
    },

    // TIER 1-9: FROM claude-multi-agnet
    "context7": { ... },
    "sequential-thinking": { ... },
    "figma": { ... },
    // ... all 30 MCPs
  }
}
```

---

## Implementation Plan

### Phase 1: Base Structure
1. Create new repo from execution-template
2. Copy agent system from claude-multi-agnet
3. Merge CLAUDE.md files
4. Merge MCP configurations

### Phase 2: Integration
1. Update setup.sh to handle both systems
2. Add portfolio-server MCP to config
3. Wire status reporting into agent workflow
4. Test end-to-end with sample project

### Phase 3: Validation
1. Create test project using unified template
2. Verify Idea-to-PDB workflow
3. Verify status reporting to Brain
4. Verify all 30+ MCPs load correctly

### Phase 4: Migration
1. Update cc-new CLI to use unified template
2. Document migration path for existing repos
3. Update Command Center documentation

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Base repo | execution-template | Already has CC integration |
| Agent system | claude-multi-agnet | Much richer (30+ vs 2) |
| MCP config | Merge both | Need all MCPs + portfolio-server |
| Setup script | Enhance claude's | Interactive + adds CC config |
| Status contract | Keep as-is | Already working with Brain |
| Task schema | claude's YAML | More mature system |

---

## Success Criteria

1. ✅ Single `cc-new create` command produces working template
2. ✅ All 30+ subagents available and invocable
3. ✅ Idea-to-PDB workflow functions end-to-end
4. ✅ Status reporting works to Command Center
5. ✅ Setup script configures both agent system AND CC integration
6. ✅ Existing execution repos can migrate incrementally

---

## Next Steps

1. [ ] Create unified-template repo
2. [ ] Implement merged directory structure
3. [ ] Test with real project
4. [ ] Update cc-new CLI
5. [ ] Document migration path
