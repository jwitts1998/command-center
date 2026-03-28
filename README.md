# Command Center - Multi-Project AI Orchestration Platform

A centralized platform for managing multiple AI agent projects with intelligent prompt enrichment, cost tracking, and cross-project pattern learning.

## Features

### ✅ Implemented (MVP - Phase 1 & 2)

- **Project Management**: Create and manage multiple AI agent projects
- **Prompt Enrichment Engine**: AI-powered ambiguity detection and question generation
- **Clarification Workflow**: Interactive Q&A to resolve prompt ambiguities
- **Context Building**: Automatic loading of tech stack, patterns, and preferences
- **Database Schema**: Full PostgreSQL schema with Neon serverless
- **REST API**: Complete API for projects, sessions, and enrichment
- **Dashboard UI**: Clean, modern interface with Shadcn UI components

### 🚧 Pending Implementation

- **Phase 3**: Real-time UI components (ClarificationDialog, EnrichedPromptDisplay)
- **Phase 4**: Project plugin for local installation
- **Phase 5**: Cost tracking with visualizations
- **Phase 6**: Pattern detection and auto-application
- **Phase 7**: Integration with existing tools/explorer dashboard

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes (serverless)
- **Database**: PostgreSQL (Neon serverless)
- **AI/LLM**: Vercel AI SDK with OpenAI (GPT-4o) and Anthropic (Claude)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (Neon recommended)
- OpenAI API key

### Installation

1. **Install dependencies**

```bash
npm install
```

2. **Set up environment variables**

Create a `.env.local` file:

```env
# Database
DATABASE_URL=postgresql://username:password@host/database

# OpenAI API
OPENAI_API_KEY=sk-...

# Anthropic API (optional)
ANTHROPIC_API_KEY=sk-ant-...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Initialize the database**

```bash
# Connect to your PostgreSQL database and run:
psql $DATABASE_URL < lib/db/schema.sql
```

4. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## API Documentation

### Projects API

**Create Project:**
```bash
POST /api/projects
{
  "name": "My Project",
  "description": "Project description",
  "tech_stack": { "languages": ["TypeScript"] },
  "monthly_budget": 100.00
}
```

**Get Projects:** `GET /api/projects`
**Get Project:** `GET /api/projects/:id`
**Update Project:** `PUT /api/projects/:id`

### Enrichment API

**Enrich Prompt:**
```bash
POST /api/enrich-prompt
{
  "project_id": "uuid",
  "user_prompt": "Add dark mode"
}
```

**Submit Answers:**
```bash
POST /api/clarifications
{
  "session_id": "uuid",
  "answers": { "q1": "option1" }
}
```

See full API reference in the [API Documentation](#api-reference) section below.

## Deployment

### Deploy to Vercel

```bash
vercel deploy --prod
```

Set environment variables in Vercel dashboard and run the database schema on your Neon PostgreSQL instance.

---

Built with Next.js 15, AI SDK, and PostgreSQL.
