# Campaign Manager

**Campaign Manager** is a full-stack email campaign platform that lets you create, schedule, send, and track email campaigns — all from a clean, responsive UI.

Campaigns are queued via **BullMQ + Redis** so scheduled sends are reliable even across restarts. The sending progress is streamed to the browser in real time using **Server-Sent Events (SSE)** — no polling needed.

---

## Features

- **Authentication** — JWT-based login/logout with protected routes
- **Campaign Management** — Create, edit, delete, and view campaigns with status tracking (Draft → Scheduled → Sending → Sent)
- **Recipient Management** — Add recipients manually or bulk-import via Excel
- **Email Scheduling** — Schedule campaigns for a future date/time or send immediately; BullMQ holds delayed jobs in Redis so they survive backend restarts
- **Realtime Progress** — Live send progress (emails sent/failed) streamed to the UI via Server-Sent Events while a campaign is sending
- **Live Statistics** — Track sent count, open rate, and send rate per campaign with pixel-based open tracking
- **Email Preview** — Built-in Mailpit SMTP sandbox for safe local email testing

---

## Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Campaign List
![Campaign List](docs/screenshots/list-campaign.png)

### Bulk Actions — Export & Duplicate
![Bulk Actions](docs/screenshots/action-selected-campaign.png)

### Campaign Detail
![Campaign Detail](docs/screenshots/campain-detail.png)

### New Campaign — Campaign Info & Email Content
![New Campaign](docs/screenshots/new-campaign.png)

### New Campaign — Select Recipients
![Select Recipients](docs/screenshots/new-campaign-2.png)

### Recipients — Bulk Import
![Bulk Import Recipients](docs/screenshots/recipients-import.png)

### Mailpit — Email Sandbox
![Mailpit](docs/screenshots/mail-test.png)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + PrimeReact + PrimeFlex |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 + Sequelize ORM |
| Auth | JWT (jsonwebtoken) |
| Queue | BullMQ + Redis 7 (delayed & retried jobs) |
| Realtime | Server-Sent Events (SSE) via Redis Pub/Sub bridge |
| Email | Nodemailer + Mailpit (dev sandbox) |
| Infra | Docker Compose + Yarn Workspaces |

---

## Project Structure

```
campain-manager/
├── backend/          # Express API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── jobs/      # BullMQ queue, worker, startup scheduler
│   │   └── events/    # Redis Pub/Sub publisher & subscriber (SSE bridge)
│   └── migrations/
├── frontend/         # React SPA
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── hooks/     # useCampaigns, useRecipients, useCampaignSSE
│       ├── store/
│       └── lib/
└── docker-compose.yml
```

---

## Getting Started with Docker

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### 1. Clone the repository

```bash
git clone <repo-url>
cd campain-manager
```

### 2. (Optional) Set a custom JWT secret

By default a development secret is used automatically. For a custom secret create a `.env` file in the project root:

```bash
echo "JWT_SECRET=your-strong-secret-here" > .env
```

### 3. Start all services

```bash
docker compose up --build
```

This will start 6 services in the correct order:

1. **PostgreSQL** database — port `5433`
2. **Redis** — port `6379` (job queue + SSE event bridge)
3. **Mailpit** (email sandbox UI) — port `8025`
4. **migrate** — one-shot container that runs DB migrations & seeds, then exits
5. **backend** API — port `3000` (starts after migrations complete)
6. **worker** — BullMQ worker that processes campaign send jobs
7. **frontend** dev server — port `5174`

### 4. Open the app

| Service | URL |
|---|---|
| Frontend | http://localhost:5174 |
| Backend API | http://localhost:3000 |
| Mailpit (email UI) | http://localhost:8025 |
| Redis | localhost:6379 |

### 5. Default login credentials (seeded)

```
Email:    admin@example.com
Password: password123
```

---

## Development

### Rebuild a single service

```bash
# Rebuild only the frontend (e.g. after changing package.json or config files)
docker compose up --build frontend

# Rebuild only the backend
docker compose up --build backend
```

### View logs

```bash
docker compose logs -f frontend
docker compose logs -f backend
```

### Stop all services

```bash
docker compose down
```

### Stop and remove volumes (full reset including database)

```bash
docker compose down -v
```

---

## Testing

### Prerequisites

- Docker services must be running (PostgreSQL on port `5433`)
- Node.js dependencies must be installed: `yarn install`

### Setup Test Database

```bash
# Create the test database (required before running tests)
yarn db:setup:test
```

### Run All Tests

```bash
yarn test
```

### Run Tests by Category

```bash
# Unit tests only
yarn test:unit

# Integration tests only
yarn test:integration

# With coverage report
yarn test:coverage
```

### Backend Tests (Jest)

```bash
# All backend tests
yarn workspace backend test

# Unit tests
yarn workspace backend test:unit

# Integration tests
yarn workspace backend test:integration

# With coverage
yarn workspace backend test:coverage
```

### Frontend Tests (Vitest)

```bash
# All frontend tests
yarn workspace frontend test

# Watch mode
yarn workspace frontend test:watch
```

### Test Database Management

```bash
# Create test database
yarn workspace backend db:create:test

# Drop test database
yarn workspace backend db:drop:test

# Reset test database (drop + create)
yarn workspace backend db:reset:test
```

### Test Structure

```
backend/src/__tests__/
├── helpers/
│   ├── setup.ts        # Test setup (DB connection, sync)
│   └── auth.ts         # Auth helpers for tests
├── unit/
│   ├── jwt.test.ts             # JWT utility tests
│   ├── password.test.ts        # Password utility tests
│   ├── campaign-rules.test.ts   # Campaign business rules tests
│   ├── stats.test.ts           # Stats calculation tests
│   └── validators.test.ts       # Zod schema validation tests
└── integration/
    ├── auth.test.ts            # Auth API integration tests
    ├── campaign-crud.test.ts   # Campaign CRUD API tests
    ├── campaign-actions.test.ts # Campaign schedule/send tests
    ├── recipients.test.ts       # Recipients API tests
    └── stats.test.ts           # Stats API tests

frontend/src/__tests__/
├── setup.ts                    # Test setup (MSW server)
├── mocks/
│   └── server.ts              # MSW mock handlers
├── unit/
│   ├── auth-store.test.ts      # Auth store tests
│   └── StatusBadge.test.tsx    # StatusBadge component tests
└── integration/                # (reserved for future integration tests)
```

### Test Coverage Targets

| Layer | Target |
|---|---|
| Backend services/utils/validators | >= 80% |
| Frontend components/stores/hooks | >= 70% |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `super-secret-dev-key-for-docker-compose` | Secret used to sign JWT tokens |
| `DB_HOST` | `db` | PostgreSQL host (service name inside Docker) |
| `DB_PORT` | `5432` | PostgreSQL port inside the container |
| `DB_NAME` | `campaign_manager` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `SMTP_HOST` | `mailpit` | SMTP host for sending emails |
| `SMTP_PORT` | `1025` | SMTP port |
| `BASE_URL` | `http://localhost:3000` | Public URL of the backend (used in tracking links) |
| `FRONTEND_URL` | `http://localhost:5174` | Allowed CORS origin |
| `REDIS_HOST` | `redis` | Redis host (BullMQ queue + SSE pub/sub) |
| `REDIS_PORT` | `6379` | Redis port |

---

## Deploying with Real SMTP (Staging / Production)

By default the stack uses **Mailpit** — a local sandbox that captures all outgoing emails without actually sending them. To send real emails on staging or production, replace Mailpit with a real SMTP provider by setting the environment variables below.

### Step 1 — Create a `.env` file in the project root

```bash
# .env  (never commit this file)

JWT_SECRET=your-strong-random-secret-here
BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# SMTP — see provider examples below
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=Campaign Manager <noreply@yourdomain.com>
```

> `SMTP_SECURE=true` uses port 465 (TLS). `SMTP_SECURE=false` uses STARTTLS (port 587) — recommended for most providers.

---

### Step 2 — Remove (or disable) Mailpit from docker-compose

Comment out or delete the `mailpit` service and update `backend` + `worker` to remove the `mailpit` dependency:

```yaml
# Remove or comment out:
# mailpit:
#   image: axllent/mailpit:latest
#   ...

backend:
  depends_on:
    migrate:
      condition: service_completed_successfully
    redis:
      condition: service_healthy
    # mailpit:        ← remove this line
    #   condition: service_started
```

---

### Step 3 — Start the stack

```bash
docker compose up --build
```

The `backend` and `worker` containers will load the `.env` file automatically via Docker Compose variable interpolation.

---

### Provider Examples

#### Gmail (with App Password)

Google requires an **App Password** when 2FA is enabled. Regular account passwords will be rejected.

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Generate an App Password for "Mail"

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx   # 16-char App Password
SMTP_FROM=you@gmail.com
```

> Gmail limits free accounts to ~500 emails/day. Use a transactional provider for bulk sends.

---

#### SendGrid

1. Create an account at [sendgrid.com](https://sendgrid.com)
2. Go to **Settings → API Keys → Create API Key** (Full Access or "Mail Send" only)
3. Verify your sender domain under **Sender Authentication**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey          # literal string "apikey"
SMTP_PASS=SG.xxxxxxxxxxxx # your SendGrid API key
SMTP_FROM=noreply@yourdomain.com
```

---

#### Amazon SES

1. Verify your sending domain/email in the [SES Console](https://console.aws.amazon.com/ses)
2. Create SMTP credentials under **SMTP Settings → Create SMTP credentials**

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com   # change region as needed
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASS=your-ses-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

> SES accounts start in **sandbox mode** (can only send to verified addresses). [Request production access](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html) before going live.

---

#### Brevo (formerly Sendinblue)

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-brevo-login@example.com
SMTP_PASS=your-brevo-smtp-key   # from Account → SMTP & API
SMTP_FROM=noreply@yourdomain.com
```

---

### Verifying the SMTP connection

The backend logs the SMTP verification result on startup:

```
SMTP connection verified       ← success
SMTP connection failed: ...    ← check your credentials / firewall
```

You can also send a test campaign to a single recipient and confirm delivery in your inbox (or provider dashboard).

---

## Realtime Campaign Progress (SSE)

When a campaign starts sending, the browser opens a persistent **Server-Sent Events** connection to:

```
GET /api/campaigns/:id/events?token=<jwt>
```

The backend subscribes to a **Redis Pub/Sub** channel. The `worker` container publishes three event types as it sends emails:

| Event | Payload | Frontend action |
|---|---|---|
| `campaign:status` | `{ campaignId, status }` | Invalidate campaign query (full refresh) |
| `campaign:progress` | `{ campaignId, current, total, sent, failed }` | Update progress bar in-place (no refetch) |
| `campaign:complete` | `{ campaignId, stats }` | Show final stats, close SSE connection |

```
worker container          Redis Pub/Sub          backend container
────────────────          ─────────────          ────────────────────────────
processCampaignSend()                            startCampaignEventSubscriber()
  └─ publishCampaignEvent() ──► PUBLISH ──────►  campaignEventBus.emit()
                                                       └─ SSE → browser
```

The `useCampaignSSE` hook in the frontend handles connection lifecycle, token injection, and React Query cache updates automatically.

---

## How I Used Claude Code

This project was built entirely in **VS Code Agent mode** using **GitHub Copilot — Claude Sonnet 4.6**.

The workflow had two layers:
- **GitHub Copilot (VS Code)** — interactive planning, corrections, feature additions, and refinements
- **[opencode](https://opencode.ai)** — terminal AI agent used for bulk boilerplate implementation across phases

---

### What I Delegated to GitHub Copilot

| Task | Notes |
|---|---|
| Reading and summarizing the challenge spec (`document.md`) | Extracted schema, endpoints, business rules, and eval criteria in one pass |
| Generating `PLAN.md` from skills + rules | Produced a 12-phase phased plan with task-level output files and verification steps |
| Scaffolding all boilerplate | Dockerfiles, `tsconfig.json`, Sequelize models, Express routes, Zod validators |
| Implementing phases 0–8 via opencode | Backend API, frontend pages, migrations, seeders — all driven by skill files |
| Writing test cases | Unit tests for business rules + JWT; integration tests for API routes |
| BullMQ queue + worker architecture | `queue.ts`, `worker.ts`, `worker-entry.ts`, `scheduler.ts`, Redis Pub/Sub bridge |
| SSE realtime feature end-to-end | `redis-publisher.ts`, `redis-subscriber.ts`, SSE controller, `useCampaignSSE` hook |
| Duplicate campaign endpoint + frontend hook | Full-stack: backend controller, route, frontend mutation hook |

---

### Real Prompts I Used

**Prompt 1 — Project planning**
> *"Read `document.md`, the skills in `skills/`, and the rules in `rules/`. Create a `PLAN.md` with phased tasks. Each task must list its output files, reference the relevant skill, and include a verification step I can check manually."*

This produced the full `PLAN.md` structure with phases 0–9, which was then extended to phases 0–12 as features were added.

---

**Prompt 2 — BullMQ worker architecture**
> *"The API currently uses `node-cron` to poll the DB every minute. Replace it with a proper BullMQ job queue: a `queue.ts` producer, a `worker.ts` consumer with concurrency 5 and 3-retry exponential backoff, and a `scheduler.ts` that syncs existing scheduled campaigns from the DB into BullMQ on startup. The worker must run as a separate Docker container."*

This produced `queue.ts`, `worker.ts`, `worker-entry.ts`, and `scheduler.ts`, plus the `worker` service in `docker-compose.yml` and the `migrate` one-shot service for migration separation.

---

**Prompt 3 — SSE with cross-process event delivery**
> *"The worker and backend are separate Docker containers, so they can't share an EventEmitter. Add a Redis Pub/Sub bridge: the worker publishes `campaign:status`, `campaign:progress`, and `campaign:complete` events to a Redis channel; the backend subscribes and re-emits them on a local EventEmitter that feeds the SSE endpoint. Frontend: a `useCampaignSSE` hook that opens an EventSource, handles all three event types, and keeps the React Query cache updated in-place for progress events (no full refetch)."*

---

### Where Claude Code Was Wrong or Needed Correction

| Issue | Root cause | Fix |
|---|---|---|
| Used `autoprefixer` in `postcss.config.js` after it was removed from `package.json` | Config file not updated when the dependency was removed | Emptied the plugins object; Vite handles prefixing natively |
| `@import 'modern-normalize'` failed in CSS | PostCSS cannot resolve bare `node_modules` specifiers | Moved to a JS `import` in `main.tsx` |
| `<Link><Button /></Link>` anti-pattern throughout the campaign list | Habit from older React Router patterns | Replaced with `<Button onClick={() => navigate('...')} />` |
| Campaign duplicate call used `createCampaign` mutation with `recipientIds: []`, failing the `min(1)` Zod guard | Wrong reuse of create endpoint | Added a dedicated `POST /campaigns/:id/duplicate` endpoint that copies recipients from the DB — no `recipientIds` required in the request body |
| `useCampaignSSE` hook called inside a conditional (after an early `return`) | Rules of Hooks violation | Moved the hook call to the top of the component; computed the `active` flag from `data?.data?.status` instead |
| Worker container crashed on startup with `npm run worker not found` | `worker` script was never added to `package.json` | Created `worker-entry.ts` as the dedicated entrypoint and added `"worker": "tsx watch src/worker-entry.ts"` to `backend/package.json` |
| Worker EventEmitter events never reached browser SSE clients | Worker and backend are isolated OS processes — `EventEmitter` is in-process only | Replaced with Redis Pub/Sub bridge (publisher in worker, subscriber in backend) |

---

### What I Would Not Let GitHub Copilot Do — and Why

| Task | Why human-only |
|---|---|
| **Final security review** | JWT secret handling, CORS origin whitelist, SQL injection surface, and timing attack vectors require deliberate review that an AI may gloss over or handle inconsistently across files |
| **Production secrets management** | Copilot should never see `.env.production` values. Secrets injection strategy (Docker secrets, Vault, AWS Secrets Manager) requires architectural judgment tied to the deployment context |
| **Git commit strategy** | Deciding what constitutes a coherent, reviewable commit (and what to keep out of version control) is a human judgment call — especially when the working tree contains experimental branches of code |
| **Performance profiling decisions** | Identifying which queries need indexes, connection pool tuning, and Redis key expiry strategy requires load-test data and production metrics that the AI has no access to |
| **Choosing the UI library** | The original plan referenced Tailwind; switching to PrimeReact + PrimeFlex was a product decision based on development speed vs. design-system flexibility trade-offs |
