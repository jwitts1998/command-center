# Command Center Setup Guide

Step-by-step instructions to get the Command Center running locally and deployed to production.

## Local Development Setup

### Step 1: Set Up PostgreSQL Database

**Option A: Neon (Recommended)**

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string (looks like: `postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb`)
4. Save it for the next step

**Option B: Local PostgreSQL**

1. Install PostgreSQL locally
2. Create a database: `createdb command_center`
3. Connection string: `postgresql://localhost:5432/command_center`

### Step 2: Configure Environment Variables

Create `.env.local` in the project root:

```env
# Database (use your Neon connection string or local)
DATABASE_URL=postgresql://username:password@host/database

# OpenAI API Key (required)
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...

# Anthropic API Key (optional)
# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Initialize Database Schema

```bash
# Option A: Using psql
psql $DATABASE_URL < lib/db/schema.sql

# Option B: Using Neon SQL Editor
# 1. Go to Neon dashboard > SQL Editor
# 2. Copy contents of lib/db/schema.sql
# 3. Paste and execute
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should see the Command Center dashboard!

### Step 6: Create Your First Project

1. Click "Create Project" button
2. Fill in:
   - **Name**: "Test Project"
   - **Description**: "Testing Command Center"
   - **Monthly Budget**: 100.00
3. Click "Create Project"
4. You should see your project in the list

### Step 7: Test Prompt Enrichment (via API)

```bash
# Get your project ID from the dashboard URL
PROJECT_ID="your-project-id-here"

# Test enrichment
curl -X POST http://localhost:3000/api/enrich-prompt \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": \"$PROJECT_ID\",
    \"user_prompt\": \"Add dark mode to the app\"
  }"
```

You should get back either:
- Clarification questions (if prompt is ambiguous)
- Enriched prompt (if prompt is clear enough)

---

## Production Deployment (Vercel)

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Set Up Neon Database

1. Create production database at [neon.tech](https://neon.tech)
2. Copy the production connection string

### Step 4: Link Project to Vercel

```bash
cd ~/dev/projects/command-center
vercel link
```

Follow prompts to create/link a Vercel project.

### Step 5: Add Environment Variables to Vercel

```bash
# Database URL
vercel env add DATABASE_URL
# Paste your Neon production connection string

# OpenAI API Key
vercel env add OPENAI_API_KEY
# Paste your OpenAI API key

# Anthropic API Key (optional)
vercel env add ANTHROPIC_API_KEY
# Paste your Anthropic API key

# Select "Production" for all
```

### Step 6: Initialize Production Database

```bash
# Connect to your production Neon database
psql <PRODUCTION_CONNECTION_STRING> < lib/db/schema.sql
```

Or use Neon's SQL Editor in the dashboard.

### Step 7: Deploy to Vercel

```bash
vercel deploy --prod
```

Wait for deployment to complete. You'll get a production URL like:
`https://command-center-xxx.vercel.app`

### Step 8: Verify Production

Visit your production URL and:
1. Create a test project
2. Test the enrichment API using the production URL

```bash
curl -X POST https://your-production-url.vercel.app/api/enrich-prompt \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": \"$PROJECT_ID\",
    \"user_prompt\": \"Add authentication\"
  }"
```

---

## Troubleshooting

### Database Connection Issues

**Error: `getaddrinfo ENOTFOUND`**
- Check `DATABASE_URL` is correct
- Ensure Neon database is active (not sleeping)
- Verify firewall/network allows PostgreSQL connections

**Error: `relation "projects" does not exist`**
- Database schema not initialized
- Run: `psql $DATABASE_URL < lib/db/schema.sql`

### API Errors

**Error: `OPENAI_API_KEY is not set`**
- Add to `.env.local` for local dev
- Add via `vercel env add` for production

**Error: `Module not found: Can't resolve '@/lib/...'`**
- Check `tsconfig.json` has correct path aliases
- Restart dev server: `npm run dev`

### Build Errors

**Error: `Type error: Property 'xxx' does not exist`**
- TypeScript type mismatch
- Check type definitions in `types/` directory
- Ensure database types match schema

---

## Next Steps

### Phase 3: Build UI Components

The API is ready! Now build the interactive UI:

1. **ClarificationDialog** - Display questions and collect answers
2. **EnrichedPromptDisplay** - Show original vs enriched prompt
3. **SessionMonitor** - Real-time session tracking

### Phase 4: Build Project Plugin

Create the plugin that gets installed in each project:

```bash
mkdir project-plugin
cd project-plugin
```

Plugin will:
- Intercept user prompts
- Call Command Center API
- Display clarifications in CLI
- Return enriched prompts to agents

### Phase 5: Add Cost Tracking

Implement:
- `CostTracker` service with model pricing
- Cost dashboard with charts
- Budget alerts

### Phase 6: Pattern Learning

Implement:
- `PatternDetector` - Identify recurring patterns
- `PatternApplicator` - Auto-apply learned patterns
- Pattern management UI

---

## Testing Checklist

- [ ] Local dev server starts successfully
- [ ] Database schema initializes without errors
- [ ] Can create a project via UI
- [ ] Can view project details
- [ ] `/api/projects` returns created projects
- [ ] `/api/enrich-prompt` detects ambiguities
- [ ] Clarification questions are well-formed
- [ ] Can submit answers to clarifications
- [ ] Enriched prompt includes context
- [ ] Production deployment succeeds
- [ ] Production API works correctly

---

## Support

Issues with setup?

1. Check logs: `npm run dev` output
2. Verify environment variables: `cat .env.local`
3. Test database connection: `psql $DATABASE_URL`
4. Review error messages carefully

For Vercel deployment issues:
- Check Vercel dashboard logs
- Verify environment variables are set
- Ensure database is accessible from Vercel

---

Ready to build! Follow the phases in the main plan to continue development.
