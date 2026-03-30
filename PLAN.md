# Mini Campaign Manager — Master Tech Task Plan

## Project Overview

Full-stack Mini Campaign Manager — MarTech tool for marketers to create, manage, and track email campaigns.

**Tech Stack:**
- **Backend:** Node.js + Express + PostgreSQL + Sequelize + BullMQ + Redis
- **Frontend:** React 18 + TypeScript (Vite) + Zustand + React Query + PrimeReact + PrimeFlex
- **Monorepo:** Yarn Workspaces
- **Infra:** Docker Compose

---

## Phase 0: Project Initialization

### Task 0.1 — Monorepo Setup (Yarn Workspaces)
- **Description:** Initialize the project root with Yarn Workspaces, configure `backend` and `frontend` packages
- **Output:** `package.json` root, `.gitignore`, `yarn.lock`
- **Skill:** [skills/project-setup/SKILL.md](skills/project-setup/SKILL.md)
- **Test:** Verify `yarn install` runs successfully from root

### Task 0.2 — Docker Compose Setup
- **Description:** Set up `docker-compose.yml` with PostgreSQL, Redis, Mailpit, backend, and frontend services
- **Output:** `docker-compose.yml`, `Dockerfile` for backend and frontend
- **Skill:** [skills/docker-setup/SKILL.md](skills/docker-setup/SKILL.md)
- **Test:** `docker compose up` starts all services

### Task 0.3 — Environment Configuration
- **Description:** Set up `.env.example` and config management for backend/frontend
- **Output:** `.env.example`, `backend/src/config/index.ts`
- **Rule:** [rules/env-config.md](rules/env-config.md)

---

## Phase 1: Backend — Database & Schema

### Task 1.1 — Sequelize Setup & Database Connection
- **Description:** Configure Sequelize, database connection, and migration framework
- **Output:** `backend/src/database/connection.ts`, `.sequelizerc`
- **Skill:** [skills/database-schema/SKILL.md](skills/database-schema/SKILL.md)
- **Init Test:** Connection test — verify DB connection succeeds
- **Integration Test:** Migration up/down cycle completes successfully

### Task 1.2 — Migration: Users Table
- **Description:** Create migration for `users` table with id (UUID), email (unique), name, password_hash, created_at
- **Output:** `backend/src/database/migrations/001-create-users.ts`
- **Indexes:** `UNIQUE(email)`, `INDEX(created_at)`
- **Init Test:** Migration runs and rolls back successfully
- **Integration Test:** Insert/query user records

### Task 1.3 — Migration: Campaigns Table
- **Description:** Create migration for `campaigns` table with id (UUID), name, subject, body, status (ENUM: draft|sending|scheduled|sent), scheduled_at, created_by (FK → users.id), created_at, updated_at
- **Output:** `backend/src/database/migrations/002-create-campaigns.ts`
- **Indexes:** `INDEX(status)`, `INDEX(created_by)`, `INDEX(scheduled_at)`, `INDEX(created_at)`
- **Init Test:** Migration runs, FK constraint works
- **Integration Test:** CRUD operations with campaigns

### Task 1.4 — Migration: Recipients Table
- **Description:** Create migration for `recipients` table with id (UUID), email (unique), name, created_at
- **Output:** `backend/src/database/migrations/003-create-recipients.ts`
- **Indexes:** `UNIQUE(email)`, `INDEX(created_at)`
- **Init Test:** Migration runs successfully
- **Integration Test:** Insert/query recipients

### Task 1.5 — Migration: CampaignRecipients Table
- **Description:** Create migration for `campaign_recipients` table with campaign_id (FK), recipient_id (FK), sent_at, opened_at, status (ENUM: pending|sent|failed)
- **Output:** `backend/src/database/migrations/004-create-campaign-recipients.ts`
- **Indexes:** `PRIMARY(campaign_id, recipient_id)`, `INDEX(status)`, `INDEX(sent_at)`
- **Init Test:** Migration runs, composite key works
- **Integration Test:** Insert/query with FK relationships

### Task 1.6 — Sequelize Models
- **Description:** Create Sequelize models for User, Campaign, Recipient, CampaignRecipient with associations
- **Output:** `backend/src/models/*.ts`
- **Skill:** [skills/database-schema/SKILL.md](skills/database-schema/SKILL.md)
- **Init Test:** Model instantiation succeeds
- **Integration Test:** Association queries (include, eager loading)

### Task 1.7 — Seed Data
- **Description:** Create demo seed data (users, campaigns, recipients)
- **Output:** `backend/src/database/seeders/*.ts`
- **Init Test:** Seeder runs successfully

---

## Phase 2: Backend — Authentication

### Task 2.1 — Auth Middleware (JWT)
- **Description:** Implement JWT middleware: generate token, verify token, extract user from token
- **Output:** `backend/src/middleware/auth.ts`, `backend/src/utils/jwt.ts`
- **Skill:** [skills/auth-jwt/SKILL.md](skills/auth-jwt/SKILL.md)
- **Init Test (Unit):**
  - ✅ Generate valid JWT token
  - ✅ Verify valid token returns decoded payload
  - ✅ Reject expired token
  - ✅ Reject invalid/tampered token
- **Integration Test:**
  - ✅ Protected route returns 401 when no token provided
  - ✅ Protected route returns 401 when token is expired
  - ✅ Protected route allows access with valid token

### Task 2.2 — POST /auth/register
- **Description:** Register a new user, hash password, return user info
- **Output:** `backend/src/routes/auth.ts`, `backend/src/controllers/auth.controller.ts`
- **Validation:** email (valid format, unique), name (required, min 2 chars), password (min 8 chars)
- **Init Test (Unit):**
  - ✅ Validate input schema (valid/invalid cases)
  - ✅ Password hashing logic
- **Integration Test:**
  - ✅ Register success → 201 + user data
  - ✅ Register duplicate email → 409 Conflict
  - ✅ Register invalid email → 400 Bad Request
  - ✅ Register missing fields → 400 Bad Request

### Task 2.3 — POST /auth/login
- **Description:** Login endpoint — verify credentials, return JWT token
- **Output:** Same files as Task 2.2
- **Init Test (Unit):**
  - ✅ Password comparison logic
- **Integration Test:**
  - ✅ Login success → 200 + token
  - ✅ Wrong password → 401 Unauthorized
  - ✅ Email not found → 401 Unauthorized

---

## Phase 3: Backend — Campaign CRUD

### Task 3.1 — Input Validation Layer (Zod)
- **Description:** Set up Zod schemas for all API inputs
- **Output:** `backend/src/validators/*.ts`
- **Skill:** [skills/api-validation/SKILL.md](skills/api-validation/SKILL.md)
- **Init Test (Unit):**
  - ✅ Create campaign schema: valid/invalid cases
  - ✅ Update campaign schema: partial validation
  - ✅ Schedule campaign schema: future date validation

### Task 3.2 — GET /campaigns (List)
- **Description:** List campaigns for the authenticated user, with pagination support
- **Output:** `backend/src/routes/campaigns.ts`, `backend/src/controllers/campaign.controller.ts`
- **Query params:** `page`, `limit`, `status` (filter)
- **Init Test:** Controller logic with mock service
- **Integration Test:**
  - ✅ List campaigns → 200 + paginated data
  - ✅ Filter by status works correctly
  - ✅ Unauthorized → 401

### Task 3.3 — POST /campaigns (Create)
- **Description:** Create a new campaign in `draft` status
- **Output:** Same files as Task 3.2
- **Business Rule:** Campaigns are always created with status `draft`
- **Init Test (Unit):**
  - ✅ Campaign always created with status draft
- **Integration Test:**
  - ✅ Create success → 201 + campaign data
  - ✅ Create with invalid data → 400
  - ✅ Auto-set status = draft

### Task 3.4 — GET /campaigns/:id (Detail)
- **Description:** Campaign detail + recipient stats aggregation
- **Output:** Same files as Task 3.2
- **Integration Test:**
  - ✅ Get detail → 200 + campaign + stats
  - ✅ Campaign not found → 404
  - ✅ Campaign belongs to another user → 403

### Task 3.5 — PATCH /campaigns/:id (Update)
- **Description:** Update campaign — ONLY when status is `draft`
- **Output:** Same files as Task 3.2
- **Business Rule:** Updates are only allowed when status = draft
- **Skill:** [skills/business-rules/SKILL.md](skills/business-rules/SKILL.md)
- **Init Test (Unit):**
  - ✅ Business rule: reject update when status != draft
- **Integration Test:**
  - ✅ Update draft campaign → 200
  - ✅ Update scheduled campaign → 400/403
  - ✅ Update sent campaign → 400/403
  - ✅ Update partial fields → 200

### Task 3.6 — DELETE /campaigns/:id
- **Description:** Delete campaign — ONLY when status is `draft`
- **Output:** Same files as Task 3.2
- **Business Rule:** Deletion is only allowed when status = draft
- **Integration Test:**
  - ✅ Delete draft campaign → 204
  - ✅ Delete non-draft campaign → 400/403
  - ✅ Delete non-existent campaign → 404

---

## Phase 4: Backend — Campaign Actions

### Task 4.1 — POST /campaigns/:id/schedule
- **Description:** Schedule a campaign — set `scheduled_at` (must be a future timestamp), transition status → `scheduled`, enqueue a delayed BullMQ job
- **Output:** `backend/src/controllers/campaign.controller.ts`, `backend/src/jobs/queue.ts`
- **Business Rules:**
  - `scheduled_at` must be a future timestamp
  - Only draft campaigns can be scheduled
- **Skill:** [skills/business-rules/SKILL.md](skills/business-rules/SKILL.md)
- **Init Test (Unit):**
  - ✅ Reject past timestamp
  - ✅ Reject non-draft campaign
- **Integration Test:**
  - ✅ Schedule success → 200 + updated campaign
  - ✅ Schedule with past date → 400
  - ✅ Schedule already-sent campaign → 400

### Task 4.2 — POST /campaigns/:id/send (BullMQ Queue)
- **Description:** Enqueue an immediate send job via BullMQ. Worker picks it up, transitions status → `sending`, marks recipients `sent`/`failed` randomly via Nodemailer + Mailpit, sets final status → `sent`
- **Output:** `backend/src/services/campaign-send.service.ts`, `backend/src/jobs/queue.ts`, `backend/src/jobs/worker.ts`, `backend/src/jobs/scheduler.ts`
- **Business Rules:**
  - Only draft or scheduled campaigns can be sent
  - Cannot be undone once sent
  - Recipients are randomly marked sent/failed
- **Skill:** [skills/business-rules/SKILL.md](skills/business-rules/SKILL.md)
- **Init Test (Unit):**
  - ✅ Send service: random sent/failed distribution
  - ✅ Status transition: draft/scheduled → sending → sent
- **Integration Test:**
  - ✅ Send success → recipients updated
  - ✅ Send already-sent campaign → 400
  - ✅ Campaign status transitions to `sent` after completion

### Task 4.3 — Campaign Stats Endpoint (implicitly via GET /campaigns/:id)
- **Description:** Return aggregated stats: total, sent, failed, opened, open_rate, send_rate
- **Output:** `backend/src/services/campaign-stats.service.ts`
- **Init Test (Unit):**
  - ✅ Stats calculation logic
  - ✅ Rate calculations (edge case: division by zero)
- **Integration Test:**
  - ✅ Stats are correct after send
  - ✅ Stats are correct when there are no recipients

---

## Phase 5: Backend — Recipients

### Task 5.1 — GET /recipients
- **Description:** List all recipients with pagination
- **Output:** `backend/src/routes/recipients.ts`, `backend/src/controllers/recipient.controller.ts`
- **Integration Test:**
  - ✅ List recipients → 200 + paginated data

### Task 5.2 — POST /recipients
- **Description:** Create a new recipient
- **Output:** Same files as Task 5.1
- **Validation:** email (valid format, unique), name (required)
- **Integration Test:**
  - ✅ Create success → 201
  - ✅ Duplicate email → 409

---

## Phase 6: Frontend — Setup & Auth

### Task 6.1 — Vite + React + TypeScript Setup
- **Description:** Initialize the frontend workspace with Vite, React 18, and TypeScript
- **Output:** `frontend/` package
- **Skill:** [skills/frontend-setup/SKILL.md](skills/frontend-setup/SKILL.md)
- **Init Test:** `yarn dev` starts successfully

### Task 6.2 — PrimeReact + PrimeFlex + CSS Utilities Setup
- **Description:** Install and configure PrimeReact component library, PrimeFlex, modern-normalize reset, and custom utility classes (replaces Tailwind/shadcn)
- **Output:** `frontend/src/main.tsx` (imports), `frontend/src/index.css`, `frontend/src/styles/utilities.css`, `frontend/postcss.config.js`
- **Init Test:** UI renders correctly with PrimeReact theme

### Task 6.3 — Zustand Store Setup
- **Description:** Set up Zustand stores for auth state and campaign state
- **Output:** `frontend/src/store/*.ts`
- **Skill:** [skills/frontend-state/SKILL.md](skills/frontend-state/SKILL.md)
- **Init Test (Unit):**
  - ✅ Auth store: set/clear token
  - ✅ Store persistence

### Task 6.4 — React Query Setup + API Client
- **Description:** Set up React Query provider and fetch-based API client with JWT interceptor
- **Output:** `frontend/src/lib/api.ts`, `frontend/src/lib/query-client.ts`
- **Init Test (Unit):**
  - ✅ API client attaches JWT header
  - ✅ API client handles 401 → redirect to login

### Task 6.5 — Login Page (/login)
- **Description:** Login form, calls API, stores JWT token
- **Output:** `frontend/src/pages/Login.tsx`
- **Init Test:**
  - ✅ Form renders
  - ✅ Validation displays errors
- **Integration Test:**
  - ✅ Login flow end-to-end (mock API)

### Task 6.6 — Auth Guard / Protected Routes
- **Description:** Route protection — redirects to /login if not authenticated
- **Output:** `frontend/src/components/AuthGuard.tsx`, `frontend/src/router.tsx`
- **Init Test:**
  - ✅ Redirects when not logged in
  - ✅ Allows access when authenticated

---

## Phase 7: Frontend — Campaign Pages

### Task 7.1 — Campaigns List Page (/campaigns)
- **Description:** List campaigns with color-coded status badges and pagination
- **Output:** `frontend/src/pages/Campaigns.tsx`
- **UI:**
  - Status badges: draft=grey, scheduled=blue, sent=green
  - PrimeReact Button filter chips by status
  - DataTable with action buttons
  - Loading skeleton and error state
- **Skill:** [skills/frontend-pages/SKILL.md](skills/frontend-pages/SKILL.md)
- **Init Test:**
  - ✅ Component renders with mock data
  - ✅ Status badges display correct colors
  - ✅ Loading skeleton displays
- **Integration Test:**
  - ✅ Fetch and display campaigns from API

### Task 7.2 — Create Campaign Page (/campaigns/new)
- **Description:** Campaign creation form: name, subject, body, recipient emails
- **Output:** `frontend/src/pages/CampaignNew.tsx`
- **UI:**
  - PrimeReact `<Card>` sections with `<Divider>`
  - Form fields with validation
  - Recipient email input with DataTable preview
  - Excel import via `<ExcelUpload>`
  - Submit button with loading state
- **Init Test:**
  - ✅ Form validation
  - ✅ Submit calls API
- **Integration Test:**
  - ✅ Create campaign flow end-to-end

### Task 7.3 — Campaign Detail Page (/campaigns/:id)
- **Description:** Campaign detail, stats, recipient list, and action buttons
- **Output:** `frontend/src/pages/CampaignDetail.tsx`
- **UI:**
  - Stats display (progress bars: open rate, send rate)
  - Recipient list with status
  - Conditional action buttons: Schedule, Send, Delete
  - Loading/error states
- **Init Test:**
  - ✅ Stats display renders correctly
  - ✅ Conditional action button rendering
  - ✅ Recipient list renders
- **Integration Test:**
  - ✅ Full detail page flow

### Task 7.4 — Campaign Actions (Schedule, Send, Delete)
- **Description:** Implement action handlers, confirmation dialogs, and cache invalidation
- **Output:** `frontend/src/hooks/useCampaignActions.ts`
- **Init Test:**
  - ✅ Confirmation dialog displays
  - ✅ Optimistic update logic
- **Integration Test:**
  - ✅ Schedule campaign flow
  - ✅ Send campaign flow
  - ✅ Delete campaign flow

---

## Phase 8: Testing (Comprehensive)

### Task 8.1 — Backend Unit Tests
- **Description:** Unit tests for services, validators, and business logic
- **Output:** `backend/src/__tests__/unit/*.test.ts`
- **Skill:** [skills/testing/SKILL.md](skills/testing/SKILL.md)
- **Coverage targets:**
  - ✅ JWT utils (generate, verify, expired, invalid)
  - ✅ Campaign business rules (status transitions)
  - ✅ Stats calculation (rates, edge cases)
  - ✅ Input validators (all schemas)
  - ✅ Send simulation logic
  - ✅ BullMQ scheduler startup sync (overdue / future / already-queued)

### Task 8.2 — Backend Integration Tests
- **Description:** API integration tests against a real database
- **Output:** `backend/src/__tests__/integration/*.test.ts`
- **Skill:** [skills/testing/SKILL.md](skills/testing/SKILL.md)
- **Coverage targets:**
  - ✅ Auth flow (register → login → access protected route)
  - ✅ Campaign CRUD lifecycle (create → update → list → detail → delete)
  - ✅ Campaign send flow (create → add recipients → send → verify stats)
  - ✅ Schedule flow (create → schedule → verify timestamp)
  - ✅ Business rules enforcement (edit sent campaign, delete scheduled)
  - ✅ Error responses (400, 401, 403, 404, 409)
  - ✅ Campaign duplicate endpoint
  - ✅ SSE endpoint responds with correct headers and initial state

### Task 8.3 — Frontend Unit Tests
- **Description:** Component tests, store tests, and hook tests
- **Output:** `frontend/src/__tests__/*.test.tsx`
- **Coverage targets:**
  - ✅ Zustand store operations
  - ✅ Component rendering (status badges, forms)
  - ✅ Form validation
  - ✅ `useCampaignSSE` hook (active guard, URL format, progress/status/complete events, cleanup)

### Task 8.4 — Frontend Integration Tests
- **Description:** Page-level integration tests with MSW (Mock Service Worker)
- **Output:** `frontend/src/__tests__/integration/*.test.tsx`
- **Coverage targets:**
  - ✅ Login flow
  - ✅ Campaign list + pagination
  - ✅ Campaign CRUD flow

---

## Phase 9: BullMQ Worker — Background Job Processing

### Task 9.1 — BullMQ Queue Setup
- **Description:** Create the BullMQ queue producer with retry/backoff options. Expose `enqueueCampaignSend()` (immediate) and `scheduleCampaignSend()` (delayed) helpers.
- **Output:** `backend/src/jobs/queue.ts`
- **Config:**
  - Queue name: `campaign-send`
  - Retry: 3 attempts, exponential backoff starting at 5 s
  - `removeOnComplete: { count: 100 }`, `removeOnFail: { count: 200 }`
- **Integration Test:**
  - ✅ Immediate job enqueued with correct `jobId`
  - ✅ Delayed job enqueued with correct delay
  - ✅ Duplicate `jobId` is deduplicated by BullMQ

### Task 9.2 — BullMQ Worker (Consumer)
- **Description:** Create the BullMQ Worker that consumes `campaign-send` jobs and calls `processCampaignSend()`. Runs as a **separate Docker container** (`worker` service).
- **Output:** `backend/src/jobs/worker.ts`, `backend/src/worker-entry.ts`
- **Config:** Concurrency: 5
- **Lifecycle:**
  - `startWorker()` / `stopWorker()` — graceful shutdown on `SIGTERM`/`SIGINT`
  - On `completed`: log campaign ID
  - On `failed`: log error + campaignId
- **Integration Test:**
  - ✅ Worker processes job and updates campaign status to `sent`
  - ✅ Worker handles missing campaign gracefully (no crash)
  - ✅ Graceful shutdown closes queue connection

### Task 9.3 — Startup Scheduler Sync
- **Description:** On backend startup, sync all `scheduled` campaigns from DB into BullMQ. Overdue campaigns are enqueued immediately; future campaigns are enqueued with delay. Skips campaigns already present in the queue.
- **Output:** `backend/src/jobs/scheduler.ts`
- **Unit Test:**
  - ✅ Overdue campaign → `enqueueCampaignSend` called
  - ✅ Future campaign → `scheduleCampaignSend` called with correct delay
  - ✅ Already-queued campaign → skipped (no duplicate)
  - ✅ `null` scheduled_at → treated as immediate
  - ✅ Empty list → no errors

### Task 9.4 — Separate Migrations Service (Docker)
- **Description:** Extract DB migrations out of the backend startup command into a one-shot `migrate` Docker service that runs before backend/worker.
- **Output:** `docker-compose.yml` (migrate service)
- **Config:**
  - `restart: "no"`, `depends_on: db: service_healthy`
  - `backend` and `worker` depend on `migrate: service_completed_successfully`
- **Test:** `docker compose up` brings up all services in correct order

---

## Phase 10: Realtime — Server-Sent Events (SSE)

### Task 10.1 — Campaign Event Bus
- **Description:** Create a singleton `EventEmitter` as an in-process event bus for SSE events. Types: `CampaignStatusEvent`, `CampaignProgressEvent`, `CampaignCompleteEvent`.
- **Output:** `backend/src/events/campaign-events.ts`
- **Config:** `setMaxListeners(200)` to support concurrent SSE connections

### Task 10.2 — Redis Pub/Sub Bridge
- **Description:** Because the `worker` runs in a separate container, it cannot emit events directly to the API process. Use Redis Pub/Sub as a bridge: worker publishes, backend subscribes and re-emits into the local EventEmitter.
- **Output:** `backend/src/events/redis-publisher.ts`, `backend/src/events/redis-subscriber.ts`
- **Channel:** `campaign-events`
- **Message format:** `{ type: 'campaign:status' | 'campaign:progress' | 'campaign:complete', payload: object }`
- **Lifecycle:**
  - `startCampaignEventSubscriber()` — called on backend startup
  - `stopCampaignEventSubscriber()` — called on backend shutdown
  - `closePublisher()` — called on worker shutdown
- **Integration Test:**
  - ✅ Publisher sends message on Redis channel
  - ✅ Subscriber receives message and emits on local EventEmitter

### Task 10.3 — SSE API Endpoint
- **Description:** `GET /campaigns/:id/events` — opens a persistent SSE stream to the authenticated client. Sends initial campaign status immediately, then forwards all events from the local EventEmitter. Sends a heartbeat every 25 s to prevent proxy timeouts.
- **Output:** `backend/src/controllers/campaign.controller.ts` (`streamCampaignEvents`), `backend/src/routes/campaigns.ts`
- **Auth:** JWT accepted from `Authorization: Bearer` header **or** `?token=` query param (EventSource API cannot set headers)
- **Events sent:**
  - `status` — when campaign transitions to `sending` or `sent`
  - `progress` — per-email progress `{ current, total, sent, failed }`
  - `complete` — final stats object
- **Cleanup:** Removes all listeners + clears heartbeat on `req.close`
- **Integration Test:**
  - ✅ SSE endpoint returns `Content-Type: text/event-stream`
  - ✅ Initial `status` event sent on connect
  - ✅ Unauthorized → 401

### Task 10.4 — Frontend `useCampaignSSE` Hook
- **Description:** React hook that opens an `EventSource` connection to the SSE endpoint for a campaign. Handles all three event types and updates React Query cache in-place.
- **Output:** `frontend/src/hooks/useCampaignSSE.ts`
- **Behavior:**
  - Only opens connection when `active` flag is `true` (campaign not yet `sent`)
  - `progress` → `setQueryData` in-place (instant progress bar update, no refetch)
  - `status` / `complete` → `invalidateQueries` (full refresh from server)
  - Closes connection on `complete` event and on unmount
  - Token injected via `?token=` query param from Zustand auth store
- **Unit Test:**
  - ✅ Does not open EventSource when `active = false`
  - ✅ URL contains correct campaign ID and token
  - ✅ `progress` event → `setQueryData` called (not `invalidateQueries`)
  - ✅ `status` event → `invalidateQueries` called
  - ✅ `complete` event → `invalidateQueries` + EventSource closed
  - ✅ Closes EventSource on unmount
  - ✅ Ignores events for different campaign IDs

### Task 10.5 — Campaign Detail Realtime Progress Banner
- **Description:** Use `useCampaignSSE` in `CampaignDetail.tsx` to show a live banner with `ProgressBar` while status is `sending`.
- **Output:** `frontend/src/pages/CampaignDetail.tsx`
- **UI:**
  - Blue animated `ProgressBar` showing `current / total`
  - "Sending in progress…" label with sent/failed counters
  - Banner auto-hides when `status !== 'sending'`
- **Rules of Hooks:** Hook must be called at top level, before any early returns. Compute `active` from `data?.data?.status`.

---

## Phase 11: Additional Features

### Task 11.1 — Campaign Duplicate
- **Description:** `POST /campaigns/:id/duplicate` — creates a copy of any campaign with status `draft`, `scheduled_at = now + 5 min`, and all recipients cloned back to `pending`. Frontend: select multiple + bulk Duplicate button.
- **Output:** `backend/src/controllers/campaign.controller.ts` (`duplicateCampaign`), `backend/src/routes/campaigns.ts`, `frontend/src/hooks/useCampaigns.ts` (`useDuplicateCampaign`), `frontend/src/pages/Campaigns.tsx`
- **Business Rules:**
  - Always creates as `draft`
  - Does **not** enqueue a send job (user must explicitly schedule or send)
  - Name suffixed with ` (Copy)`
- **Integration Test:**
  - ✅ Duplicate creates new campaign with status `draft`
  - ✅ All recipients copied with status `pending`
  - ✅ Original campaign unaffected

### Task 11.2 — Schedule At Column in Campaign List
- **Description:** Add a `Schedule At` column to the campaigns DataTable. Display a color-coded badge: `In X min` (< 60 min), formatted date (≥ 60 min), `Sending…`, `Processing`, or `—` for sent.
- **Output:** `frontend/src/pages/Campaigns.tsx` (`ScheduleCell` component)

### Task 11.3 — Bulk Export to Excel
- **Description:** Select campaigns via DataTable checkboxes, export selected rows to `.xlsx` using `xlsx` library.
- **Output:** `frontend/src/pages/Campaigns.tsx`

---

## Phase 12: Documentation & Deployment

### Task 12.1 — README.md
- **Description:** Comprehensive README with setup instructions, screenshots, architecture overview, SMTP configuration guide
- **Output:** `README.md`
- **Sections:** ✅ Features, Screenshots, Tech Stack, Project Structure, Getting Started, Development, Testing, Environment Variables, Real SMTP deployment guide, Realtime SSE architecture

### Task 12.2 — Final Docker Compose Verification
- **Description:** Verify the full stack works with `docker compose up`
- **Checklist:**
  - ✅ `migrate` service runs migrations + seeds and exits cleanly
  - ✅ PostgreSQL starts + healthcheck passes
  - ✅ Redis starts + healthcheck passes
  - ✅ Mailpit starts (SMTP sandbox)
  - ✅ Backend starts after `migrate` completes
  - ✅ Worker container starts and connects to Redis queue
  - ✅ Frontend starts + connects to backend
  - ✅ All tests pass (`yarn test`)

---

## Task Dependencies Graph

```
Phase 0 (Setup)
  ├── 0.1 Monorepo → 0.2 Docker → 0.3 Env Config
  │
Phase 1 (Database) — depends on 0.x
  ├── 1.1 Sequelize → 1.2 Users → 1.3 Campaigns → 1.4 Recipients → 1.5 CampaignRecipients
  ├── 1.6 Models (depends on 1.2-1.5) → 1.7 Seeds
  │
Phase 2 (Auth) — depends on 1.2, 1.6
  ├── 2.1 JWT Middleware → 2.2 Register → 2.3 Login
  │
Phase 3 (Campaign CRUD) — depends on 2.x
  ├── 3.1 Validation → 3.2 List → 3.3 Create → 3.4 Detail → 3.5 Update → 3.6 Delete
  │
Phase 4 (Campaign Actions) — depends on 3.x
  ├── 4.1 Schedule → 4.2 Send → 4.3 Stats
  │
Phase 5 (Recipients) — depends on 1.4, 2.x
  ├── 5.1 List → 5.2 Create
  │
Phase 6 (Frontend Setup) — can start parallel with Phase 2
  ├── 6.1 Vite → 6.2 PrimeReact → 6.3 Zustand → 6.4 React Query → 6.5 Login → 6.6 AuthGuard
  │
Phase 7 (Frontend Pages) — depends on 6.x
  ├── 7.1 List → 7.2 Create → 7.3 Detail → 7.4 Actions
  │
Phase 8 (Testing) — depends on Phase 3, 4, 7
  ├── 8.1 Backend Unit → 8.2 Backend Integration → 8.3 Frontend Unit → 8.4 Frontend Integration
  │
Phase 9 (BullMQ Worker) — depends on Phase 4
  ├── 9.1 Queue → 9.2 Worker → 9.3 Scheduler Sync → 9.4 Migrate Service
  │
Phase 10 (Realtime SSE) — depends on Phase 9
  ├── 10.1 Event Bus → 10.2 Redis Pub/Sub Bridge → 10.3 SSE Endpoint → 10.4 useCampaignSSE → 10.5 Progress Banner
  │
Phase 11 (Additional Features) — depends on Phase 7, 9
  ├── 11.1 Duplicate → 11.2 Schedule At Column → 11.3 Bulk Export
  │
Phase 12 (Documentation) — depends on all
  └── 12.1 README → 12.2 Final Verification
```

---

## Summary

| Phase | Tasks | Estimated Files |
|-------|-------|----------------|
| Phase 0 — Setup | 3 tasks | ~8 files |
| Phase 1 — Database | 7 tasks | ~15 files |
| Phase 2 — Auth | 3 tasks | ~6 files |
| Phase 3 — Campaign CRUD | 6 tasks | ~8 files |
| Phase 4 — Campaign Actions | 3 tasks | ~4 files |
| Phase 5 — Recipients | 2 tasks | ~4 files |
| Phase 6 — Frontend Setup | 6 tasks | ~12 files |
| Phase 7 — Frontend Pages | 4 tasks | ~8 files |
| Phase 8 — Testing | 4 tasks | ~14 files |
| Phase 9 — BullMQ Worker | 4 tasks | ~6 files |
| Phase 10 — Realtime SSE | 5 tasks | ~7 files |
| Phase 11 — Additional Features | 3 tasks | ~4 files |
| Phase 12 — Documentation | 2 tasks | ~2 files |
| **Total** | **52 tasks** | **~98 files** |
