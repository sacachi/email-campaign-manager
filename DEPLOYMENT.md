# How This Project Was Built — Step-by-Step

This document describes the end-to-end process used to build the **Campaign Manager** full-stack application, from initial planning to final deployment.

---

## Project Summary

**Campaign Manager** is a full-stack MarTech tool that lets marketers create, manage, schedule, and track email campaigns.

- **Challenge source:** AI Full-Stack Code Challenge (see `document.md`)
- **Time target:** 4–8 hours
- **AI model used:** GitHub Copilot — Claude Sonnet 4.6

**Core requirements:**
- REST API (Node.js + Express + PostgreSQL) with JWT auth, business-rule enforcement, and migrations
- React SPA with campaign CRUD, recipient management, stats dashboard, and Excel import
- At least 3 meaningful tests (unit + integration)
- Docker Compose one-command deployment

---

## Step 1 — Understand the Challenge with GitHub Copilot

**Tool:** GitHub Copilot (Claude Sonnet 4.6) in VS Code Agent mode

Open `document.md` and ask Copilot to summarize what needs to be built:

> **Prompt used:**
> *"Read document.md and give me a concise summary of what needs to be built: backend schema, API endpoints, business rules, frontend pages, and evaluation criteria."*

**Output:** A structured summary covering:
- 4 database tables (User, Campaign, Recipient, CampaignRecipient)
- 12 REST endpoints
- Business rules: draft-only edits, future `scheduled_at`, irreversible send
- Frontend pages: `/login`, `/campaigns`, `/campaigns/new`, `/campaigns/:id`
- Evaluation focus: correctness, UX polish, AI collaboration transparency

---

## Step 2 — Define Skills and Rules

**Tool:** GitHub Copilot — file editing in VS Code

Before writing any code, populate the `skills/` and `rules/` folders to give Copilot consistent context on every future prompt.

**Skills created (`skills/`):**

| Skill | Purpose |
|---|---|
| `project-setup` | Yarn Workspaces monorepo structure |
| `docker-setup` | Docker Compose with PostgreSQL + Mailpit |
| `database-schema` | Sequelize models, migrations, indexing strategy |
| `auth-jwt` | JWT middleware, bcrypt, token shape |
| `api-validation` | Zod validators, error response shapes |
| `business-rules` | Campaign state machine, send/schedule guards |
| `frontend-setup` | Vite + React 18 + TypeScript base config |
| `frontend-pages` | Page structure, routing, protected routes |
| `frontend-state` | Zustand store + React Query patterns |
| `testing` | Vitest unit tests, Supertest integration tests |

**Rules created (`rules/`):**

| Rule file | Covers |
|---|---|
| `coding-standards.md` | Naming, file structure, TypeScript strictness |
| `api-conventions.md` | REST response shapes, status codes, pagination |
| `security-standards.md` | JWT handling, password hashing, input sanitization |
| `testing-standards.md` | Test naming, coverage targets, mock strategy |
| `env-config.md` | Environment variable conventions |

> **Why this step matters:** Skills and rules act as persistent memory for Copilot. Every subsequent prompt automatically benefits from these constraints, keeping output consistent across all files.

---

## Step 3 — Create PLAN.md

**Tool:** GitHub Copilot — `PLAN.md` generation

With skills and rules in place, ask Copilot to generate a phased implementation plan:

> **Prompt used:**
> *"Based on document.md, the skills in skills/ and rules in rules/, create a PLAN.md with phased tasks. Each task should reference the relevant skill file, list its output files, and include a verification step."*

**Result (`PLAN.md`):**

| Phase | Description |
|---|---|
| Phase 0 | Monorepo setup, Docker Compose, environment config |
| Phase 1 | Database schema: migrations, models, seeders |
| Phase 2 | Backend API: auth, campaigns, recipients, stats, tracking |
| Phase 3 | Frontend: routing, auth pages, layout, campaign pages |
| Phase 4 | Advanced features: Excel import, scheduler, email sending |
| Phase 5 | Tests: unit (services/validators) + integration (API routes) |
| Phase 6 | Polish: error handling, loading states, responsive layout |

---

## Step 4 — Implement with opencode (AI CLI Agent)

**Tool:** [opencode](https://opencode.ai) — terminal-based AI agent

`opencode` was used to implement the plan tasks autonomously in the terminal, which is more cost-efficient than driving everything interactively through the VS Code UI. It reads the codebase, applies changes, and runs verification commands.

**Why opencode for bulk implementation:**
- Runs headlessly — no UI overhead
- Can chain multiple file edits + terminal commands in one session
- Lower token cost per task compared to interactive chat
- Reads `PLAN.md` and `skills/` automatically as context

**Workflow per phase:**

```bash
# Start opencode in the project root
opencode

# Example prompt for Phase 1
> Implement Phase 1 from PLAN.md. Use the database-schema skill.
> Create migrations in backend/migrations/, Sequelize models in backend/src/models/,
> and a seeder in backend/seeders/. Follow rules/coding-standards.md.
```

**Phases implemented via opencode:**
- Phase 0 — Monorepo, Dockerfile, docker-compose.yml
- Phase 1 — All migrations, models (User, Campaign, Recipient, CampaignRecipient)
- Phase 2 — All API controllers, routes, validators, JWT middleware
- Phase 3 — React app scaffold, routing, AuthGuard, AppLayout, all pages
- Phase 4 — Excel upload (xlsx), campaign scheduler (BullMQ + Redis), Nodemailer integration
- Phase 5 — Initial test scaffolding (unit + integration test files)

---

## Step 5 — Manual Updates and Corrections

After AI-generated code, these areas required manual review and correction:

### 5.1 — Replaced node-cron with BullMQ + Redis

The original scheduler used `node-cron` to poll the database every minute for due campaigns and call `processCampaignSend` directly. This was replaced with a proper job queue architecture:

**Flow:** `API → enqueue job → BullMQ (Redis) → worker → processCampaignSend`

Files created:
- `backend/src/jobs/queue.ts` — Queue definition, `enqueueCampaignSend()` and `scheduleCampaignSend()` helpers
- `backend/src/jobs/worker.ts` — BullMQ Worker that processes `campaign-send` jobs (concurrency: 5, retries: 3 exponential)
- `backend/src/jobs/scheduler.ts` — On startup, syncs existing `scheduled` campaigns from DB into Redis delayed jobs

`docker-compose.yml` updated:
- Added `redis:7-alpine` service with healthcheck on port `6379`
- Backend `depends_on` Redis (condition: `service_healthy`)
- Added `REDIS_HOST` and `REDIS_PORT` env vars to backend service

`backend/package.json` updated:
- Added: `bullmq`, `ioredis`
- Removed: `node-cron`, `@types/node-cron`

**Why BullMQ over node-cron:**
- Jobs are persisted in Redis — survive server restarts
- Built-in retry with exponential backoff
- Delayed jobs replace polling (more efficient than DB scan every minute)
- Concurrency control (max 5 jobs in parallel)
- `jobId` deduplication prevents double-sends on restart

### 5.2 — Removed Tailwind, replaced with PrimeFlex + custom utilities

The original plan referenced Tailwind CSS, but the project uses PrimeReact + PrimeFlex. Tailwind was removed:

```bash
# Removed from package.json devDependencies:
# - tailwindcss
# - autoprefixer (also removed from postcss.config.js)
# Deleted: frontend/tailwind.config.js
```

A `main.css` utility file (Tailwind-scale spacing/color classes) was integrated as `frontend/src/styles/utilities.css` and `modern-normalize` was added for CSS reset.

### 5.3 — Campaign form rebuilt with PrimeReact `<Card>` + `<Divider>`

`/campaigns/new` sections were originally using raw `div.surface-card` with inline styles. Replaced with:
- `<Card title={<SectionHeader />}>` for each section
- `<Divider>` instead of `style={{ borderBottom: ... }}`

### 5.4 — Filter chips on `/campaigns` replaced with PrimeReact `<Button>`

Status filter chips were raw `<button>` elements with inline `chipStyle()`. Replaced with PrimeReact `<Button size="small" text/outlined>`.

### 5.5 — `Link` wrapper removed from action buttons

`<Link to="..."><Button /></Link>` pattern replaced with `<Button onClick={() => navigate('...')} />` throughout Campaigns page.

### 5.6 — PostCSS config fixed

`autoprefixer` was removed from `package.json` alongside Tailwind but remained referenced in `postcss.config.js`. Caused container crash. Fixed by emptying the plugins object (Vite handles prefixing natively via esbuild).

### 5.7 — `modern-normalize` CSS import path

CSS `@import 'modern-normalize'` in `utilities.css` failed (PostCSS can't resolve bare node_modules specifiers). Fixed by importing as a JS module in `main.tsx`:
```ts
import 'modern-normalize/modern-normalize.css';
```

---

## Step 6 — Tests

**Tool:** GitHub Copilot — Claude Sonnet 4.6

After implementation, tests were written using Copilot in agent mode with the `testing` skill loaded:

> **Prompt used:**
> *"Read skills/testing/SKILL.md and rules/testing-standards.md. Write unit tests for the campaign service business rules (send guard, schedule guard, draft-only edit) and integration tests for POST /auth/login and GET /campaigns using Supertest."*

**Test coverage:**
- `backend/src/__tests__/unit/` — Service-level business rule validation
- `backend/src/__tests__/integration/` — API endpoint request/response contracts
- `frontend/src/__tests__/unit/` — Hook and validator logic
- `frontend/src/__tests__/integration/` — Page render + interaction tests

---

## Step 7 — Final Docker Deployment

All services are orchestrated by `docker-compose.yml`:

```bash
docker compose up --build
```

| Service | Host Port | Notes |
|---|---|---|
| PostgreSQL | 5433 | Persistent volume `pgdata` |
| Redis | 6379 | BullMQ job broker |
| Mailpit (SMTP sandbox) | 8025 (UI), 1025 (SMTP) | Catches all outbound email |
| Backend API | 3000 | Auto-runs migrations + seeds on start |
| Frontend (Vite dev) | 5174 | Hot-reload via volume mount on `src/` |

See `README.md` for full setup instructions.

---

## AI Collaboration Notes

### What was delegated to Copilot / opencode

- Reading and summarizing the challenge specification
- Generating PLAN.md from skills + document.md
- Scaffolding all boilerplate (Dockerfiles, tsconfig, Sequelize models, routes, validators)
- Bulk implementation of phases 0–5 via opencode
- Writing test cases once implementation was stable

### What required human judgment

- Choosing PrimeReact + PrimeFlex over Tailwind (UI library decision)
- Reviewing business rule enforcement at the API level
- Fixing PostCSS/CSS import path issues (toolchain knowledge)
- UX decisions: filter chip design, form layout, section headers
- Deciding what tests were "meaningful" vs. trivial coverage padding

### Where the AI was wrong or needed correction

| Issue | Root Cause | Fix |
|---|---|---|
| Used `autoprefixer` in postcss after it was removed | Context gap between package.json edit and postcss config | Emptied postcss plugins |
| `@import 'modern-normalize'` failed in CSS | PostCSS can't resolve bare node_modules imports | Moved to JS `import` in main.tsx |
| Used `<Link><Button></Link>` anti-pattern | Habit from older React Router patterns | Replaced with `onClick={() => navigate(...)}` |
| Inline styles on section headers | No style constraint in initial prompt | Applied after loading skills to Copilot context |

### What would not be delegated to AI

- Final security review (JWT secret handling, CORS config, SQL injection checks)
- Git commit strategy and branch naming
- Production deployment configuration (secrets management, HTTPS, rate limiting)
- Performance profiling and query optimization decisions
