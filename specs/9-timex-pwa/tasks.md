# TimeX PWA — Task Breakdown

## Legend
- `[P]` = Parallelizable (no dependency on other in-flight tasks)
- `[US1]`–`[US10]` = User story from spec.md
- Phase ordering: foundational phases must complete before feature phases

---

## Phase 1 — Monorepo Scaffold

> **Goal:** Working Nx + pnpm monorepo structure with all three apps and two packages running locally.

- [ ] T001 [P] Initialize Nx monorepo with pnpm workspaces — create `nx.json`, `pnpm-workspace.yaml`, `package.json` at root with `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint` scripts (`package.json`, `nx.json`, `pnpm-workspace.yaml`)
- [ ] T002 [P] Create `packages/domain/` — `@timex/domain` TypeScript package with `src/types.ts`, `src/enums.ts` (TimesheetStatus, ExpenseCategory, Role, Platform), `src/index.ts`, `tsconfig.json`, `package.json` (`packages/domain/`)
- [ ] T003 [P] Create `packages/utils/` — `@timex/utils` TypeScript package with `src/date.ts`, `src/currency.ts`, `src/validate.ts`, `src/index.ts`, `tsconfig.json`, `package.json` (`packages/utils/`)
- [ ] T004 [P] Scaffold `apps/app/` — React 19 + Vite employee PWA with `src/main.tsx`, `src/App.tsx`, `vite.config.ts` (proxy `/api` to :3000), `tsconfig.json`, `package.json` (`apps/app/`)
- [ ] T005 [P] Scaffold `apps/portal/` — React 19 + Vite admin portal with `src/main.tsx`, `src/App.tsx`, `vite.config.ts` (proxy `/api` to :3000), `tsconfig.json`, `package.json` (`apps/portal/`)
- [ ] T006 [P] Scaffold `apps/api/` — Hono API with `src/index.ts`, `vercel.json`, `tsconfig.json`, `package.json`; configure Vercel Serverless adapter (`apps/api/`)
- [ ] T007 Set up ESLint + Prettier config at root — `eslint.config.js`, `.prettierrc`, `tsconfig.base.json` shared by all apps and packages (repo root)
- [ ] T008 Add shadcn/ui to `apps/app/` and `apps/portal/` — initialize `components.json`, add base components (Button, Card, Input, Toast) (`apps/app/src/components/ui/`, `apps/portal/src/components/ui/`)
- [ ] T009 Add TanStack Query v5 and React Router v6 to both frontend apps — configure `QueryClient`, `QueryClientProvider`, `RouterProvider` in both `apps/app/src/main.tsx` and `apps/portal/src/main.tsx`

**Checkpoint:** `pnpm dev` starts all three apps without errors; `pnpm build` succeeds for all three.

---

## Phase 2 — Database Foundation

> **Goal:** Schema live on Neon, RLS enabled, seed data loaded.

- [ ] T010 [P] Add Drizzle ORM + Neon serverless driver to `apps/api/` — install `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`; configure `drizzle.config.ts` (`apps/api/drizzle.config.ts`, `apps/api/src/db/client.ts`)
- [ ] T011 Write Drizzle schema for all 13 tables — `apps/api/src/db/schema.ts` covering tenants, profiles, user_tenant_roles, pay_periods, clients, assignments, timesheets, timesheet_entries, expenses, push_subscriptions, qbo_credentials, audit_logs, oauth_states with all constraints, indexes, and relations
- [ ] T012 Create raw SQL migration for `btree_gist` extension and all RLS policies — `apps/api/src/db/migrations/0001_enable_rls.sql` (all ALTER TABLE ENABLE ROW LEVEL SECURITY + CREATE POLICY statements for all business tables)
- [ ] T013 Create `scripts/seed.ts` — seed Let's Thrive tenant, 4 users (admin, manager, 2 employees), current month pay period, 3 clients, assignments for both employees to all clients (`scripts/seed.ts`)
- [ ] T014 Add `pnpm db:reset` script — chains `drizzle-kit migrate` + raw SQL migration + `tsx scripts/seed.ts` (`package.json`)
- [ ] T015 Write Vitest unit tests for schema constraints — test that duplicate `(tenant_id, employee_id, pay_period_id)` timesheets are rejected, overlapping pay periods are rejected, hours <= 0 are rejected (`apps/api/src/db/schema.test.ts`)

**Checkpoint:** `pnpm db:reset` runs without errors and outputs the expected seed confirmation messages from `quickstart.md`.

---

## Phase 3 — Hono API Core

> **Goal:** Middleware chain, auth routes, and branding route operational.

- [ ] T016 [P] Implement `tenantMiddleware` — resolves `:slug` to tenant row with 60s in-memory cache; sets `c.var.tenantId` and `c.var.tenant`; returns 404 for unknown slugs (`apps/api/src/middleware/tenantMiddleware.ts`)
- [ ] T017 [P] Implement `authMiddleware` — verifies JWT signature and expiry; validates `active_tenant_id === c.var.tenantId`; sets `c.var.userId`, `c.var.userRole`; returns 401/403 on failure (`apps/api/src/middleware/authMiddleware.ts`)
- [ ] T018 [P] Implement `corsMiddleware` — per-environment CORS policy allowing Employee App and Admin Portal origins (`apps/api/src/middleware/corsMiddleware.ts`)
- [ ] T019 Write Vitest tests for all three middleware functions — test tenant resolution cache, JWT validation, wrong tenant access returns 403 (`apps/api/src/middleware/tenantMiddleware.test.ts`, `authMiddleware.test.ts`)
- [ ] T020 Implement branding routes — `GET /api/org/:slug/branding/public` and `GET /api/org/:slug/manifest.json` (no auth required) (`apps/api/src/routes/branding.ts`)
- [ ] T021 Implement `apps/app/src/lib/api.ts` — typed API client with `fetch` wrapper, automatic auth header injection, refresh token retry on 401, base URL from env (`apps/app/src/lib/api.ts`)
- [ ] T022 Implement `apps/portal/src/lib/api.ts` — same pattern as T021 for portal (`apps/portal/src/lib/api.ts`)

**Checkpoint:** `curl http://localhost:3000/api/org/lets-thrive/branding/public` returns tenant branding JSON; `curl http://localhost:3000/api/org/lets-thrive/manifest.json` returns PWA manifest with Let's Thrive name and color.

---

## Phase 4 — Authentication [US1, US2]

> **Goal:** Employees can log in via magic link and password; JWT + refresh cookie issued.

- [ ] T023 Implement magic link token store — create `magic_link_tokens` table migration (token, email, expires_at, used_at) and Drizzle schema addition (`apps/api/src/db/schema.ts`, new migration file)
- [ ] T024 Implement `POST /api/auth/magic-link` — generate token, store in DB, send email via Resend SDK, return 200 always; rate limit by IP (3 requests/15min) (`apps/api/src/routes/auth.ts`)
- [ ] T025 Implement `GET /api/auth/verify` — validate token, check expiry, mark as used, issue JWT access token + httpOnly refresh cookie, redirect to tenant app; handle multi-tenant picker case (`apps/api/src/routes/auth.ts`)
- [ ] T026 Implement `POST /api/auth/login` (password fallback) — lookup profile by email+slug, compare bcrypt hash, issue tokens (`apps/api/src/routes/auth.ts`)
- [ ] T027 Implement `POST /api/auth/refresh` — validate httpOnly refresh cookie, issue new access token (`apps/api/src/routes/auth.ts`)
- [ ] T028 Implement `POST /api/auth/logout` — clear httpOnly refresh cookie (`apps/api/src/routes/auth.ts`)
- [ ] T029 Implement `POST /api/auth/switch-tenant` — validate user belongs to requested tenant, re-issue JWT with new `active_tenant_id` (`apps/api/src/routes/auth.ts`)
- [ ] T030 Write Vitest integration tests for all auth routes — magic link happy path, expired token 401, inactive user 403, wrong password 401, switch-tenant forbidden 403 (`apps/api/src/routes/auth.test.ts`)
- [ ] T031 [P] Implement `apps/app/src/features/auth/` — login page with email field, magic link request, password fallback form, tenant picker modal, redirect logic (`apps/app/src/features/auth/LoginPage.tsx`, `TenantPicker.tsx`, `useAuth.ts`)
- [ ] T032 [P] Implement `apps/portal/src/features/auth/` — same pattern as T031 for admin portal (`apps/portal/src/features/auth/LoginPage.tsx`, `useAuth.ts`)

**Checkpoint:** US1 and US2 acceptance scenarios pass manually (see quickstart.md §5).

---

## Phase 5 — Timesheets [US3, US4]

> **Goal:** Employee creates/submits timesheets; manager approves/rejects; QBO sync message enqueued.

- [ ] T033 Implement `GET/POST /api/org/:slug/timesheets` — list (role-scoped) and create; enforce pay period not locked on create (`apps/api/src/routes/timesheets.ts`)
- [ ] T034 Implement `GET /api/org/:slug/timesheets/:id` — return timesheet with all entries; validate employee owns it or caller is manager/admin (`apps/api/src/routes/timesheets.ts`)
- [ ] T035 Implement `POST /api/org/:slug/timesheets/:id/entries` — add entry; validate assignment exists; check hours > 0 (`apps/api/src/routes/timesheets.ts`)
- [ ] T036 Implement `PATCH /api/org/:slug/timesheets/:id/status` — enforce state machine transitions; role-guard employee vs manager/admin transitions; on `qbo_approved` enqueue RabbitMQ message and write audit log; on `rejected` write rejection note to audit log (`apps/api/src/routes/timesheets.ts`)
- [ ] T037 Implement `apps/api/src/services/rabbitmq.ts` — connect to AMQP, publish to `timex.qbo-sync` and `timex.notifications` queues, setup DLQs on first connect (`apps/api/src/services/rabbitmq.ts`)
- [ ] T038 Write Vitest tests for timesheet routes — create, add entry (valid + invalid assignment), submit, approve (employee role returns 403), reject, invalid transition 422 (`apps/api/src/routes/timesheets.test.ts`)
- [ ] T039 [P] Implement `apps/app/src/features/timesheets/` — TimesheetListPage, TimesheetDetailPage, NewTimesheetForm, EntryForm with client dropdown (TanStack Query hooks calling API) (`apps/app/src/features/timesheets/`)
- [ ] T040 [P] Implement `apps/portal/src/features/timesheets/` — ApprovalQueuePage, TimesheetReviewPage with approve/reject actions (`apps/portal/src/features/timesheets/`)

**Checkpoint:** US3 and US4 acceptance scenarios pass manually; RabbitMQ management UI shows message after approval.

---

## Phase 6 — Expenses [US5]

> **Goal:** Employee creates expense, uploads receipt via presigned S3 URL, submits.

- [ ] T041 [P] Implement `apps/api/src/services/s3.ts` — `getPresignedUploadUrl(tenantId, context, filename, contentType)`, `getPresignedDownloadUrl(tenantId, key)` (validates key prefix), max 10MB enforcement in upload URL metadata (`apps/api/src/services/s3.ts`)
- [ ] T042 [P] Implement `GET/POST /api/org/:slug/expenses` and `PATCH /api/org/:slug/expenses/:id/status` — create expense, list (role-scoped), status transitions (draft→submitted, submitted→approved/rejected) with audit log on approval (`apps/api/src/routes/expenses.ts`)
- [ ] T043 Implement `POST /api/org/:slug/upload/presign` and `POST /api/org/:slug/upload/download-url` — presigned URL generation with tenant prefix validation (`apps/api/src/routes/upload.ts`)
- [ ] T044 Write Vitest tests for expense and upload routes — create, submit, cross-tenant key access returns 403, presigned URL key validation (`apps/api/src/routes/expenses.test.ts`, `upload.test.ts`)
- [ ] T045 [P] Implement `apps/app/src/features/expenses/` — ExpenseListPage, NewExpenseForm, ReceiptUpload component (presign → direct S3 upload → update receipt_key on expense), submit action (`apps/app/src/features/expenses/`)
- [ ] T046 [P] Implement `apps/portal/src/features/expenses/` — ExpenseReviewPage with approve/reject (`apps/portal/src/features/expenses/`)

**Checkpoint:** US5 acceptance scenarios pass manually; S3 bucket shows uploaded receipt with `{tenantId}/receipts/` prefix.

---

## Phase 7 — QBO Integration [US6, US7]

> **Goal:** Admin connects QBO via OAuth 2.0; approved timesheets sync to QuickBooks.

- [ ] T047 Implement `apps/api/src/services/crypto.ts` — AES-256-GCM encrypt/decrypt functions using `QBO_TOKEN_ENCRYPTION_KEY` (`apps/api/src/services/crypto.ts`)
- [ ] T048 Implement `apps/api/src/services/qbo.ts` — `intuit-oauth` client configuration, token exchange, token auto-refresh (5min before expiry), `syncTimesheet(timesheetId, tenantId)` function that creates QBO Time Activities (`apps/api/src/services/qbo.ts`)
- [ ] T049 Implement QBO admin routes — `GET /admin/quickbooks` (status), `GET /admin/quickbooks/connect` (OAuth redirect with CSRF state), `GET /admin/quickbooks/callback` (exchange code, encrypt tokens, store), `DELETE /admin/quickbooks/disconnect` (revoke + delete + audit log), `POST /admin/quickbooks/sync` (manual enqueue) (`apps/api/src/routes/admin/quickbooks.ts`)
- [ ] T050 Write Vitest tests for crypto service — encrypt/decrypt round-trip, tampered ciphertext returns error (`apps/api/src/services/crypto.test.ts`)
- [ ] T051 Write Vitest tests for QBO routes — CSRF state validation on callback, non-admin 403, disconnect deletes credentials and writes audit log (`apps/api/src/routes/admin/quickbooks.test.ts`)
- [ ] T052 Implement `apps/api/src/workers/qboSyncWorker.ts` — AMQP consumer on `timex.qbo-sync`, retry up to 3 times, dead-letter on failure, update timesheet status to `qbo_synced`, write audit log (`apps/api/src/workers/qboSyncWorker.ts`)
- [ ] T053 [P] Implement `apps/portal/src/features/quickbooks/` — QBOSettingsPage showing connection status, Connect/Disconnect buttons, sync trigger button (`apps/portal/src/features/quickbooks/`)

**Checkpoint:** US6 and US7 acceptance scenarios pass; QBO sandbox shows Time Activities after sync.

---

## Phase 8 — Push Notifications [US9]

> **Goal:** Employees receive Web Push notifications on timesheet approval/rejection.

- [ ] T054 Implement `apps/api/src/services/push.ts` — generate VAPID keys, `sendPushNotification(userId, tenantId, payload)` using `web-push` library, auto-delete stale subscriptions (410 response) (`apps/api/src/services/push.ts`)
- [ ] T055 Implement `POST /api/org/:slug/push/subscribe` and `POST /api/org/:slug/push/unsubscribe` routes (`apps/api/src/routes/push.ts`)
- [ ] T056 Implement `apps/api/src/workers/notificationsWorker.ts` — AMQP consumer on `timex.notifications` queue; sends push notification to all `push_subscriptions` for the target user (`apps/api/src/workers/notificationsWorker.ts`)
- [ ] T057 Integrate push notification enqueue into timesheet approval and rejection in `timesheets.ts` route — after status update, publish to `timex.notifications` queue with employee's userId and event type (`apps/api/src/routes/timesheets.ts`)
- [ ] T058 [P] Implement push subscription management in `apps/app/` — `src/lib/push.ts` (request permission, register service worker push handler, call subscribe/unsubscribe API), "Enable notifications" prompt component shown after second app visit (`apps/app/src/lib/push.ts`, `apps/app/src/features/notifications/`)

**Checkpoint:** US9 acceptance scenarios pass; push notification arrives within 60s of timesheet approval.

---

## Phase 9 — PWA Configuration [US8]

> **Goal:** Employee PWA is installable; offline shell works; dynamic manifest per tenant.

- [ ] T059 Install and configure `vite-plugin-pwa` with `injectManifest` strategy — `apps/app/vite.config.ts` updated; `apps/app/src/sw/service-worker.ts` created with Workbox precache + offline fallback + push event handler (`apps/app/vite.config.ts`, `apps/app/src/sw/service-worker.ts`)
- [ ] T060 Configure dynamic manifest — `vite-plugin-pwa` configured with `manifestFilename: false`; `<link rel="manifest">` in `apps/app/index.html` points to `/api/org/:slug/manifest.json`; manifest route already implemented in T020 (`apps/app/index.html`)
- [ ] T061 Implement custom install prompt — `apps/app/src/hooks/usePWAInstall.ts` tracks visit count in `localStorage`; shows install banner on second visit; stores `beforeinstallprompt` event for deferred trigger (`apps/app/src/hooks/usePWAInstall.ts`, `apps/app/src/components/InstallBanner.tsx`)
- [ ] T062 Implement offline banner — `apps/app/src/hooks/useOnline.ts` listens to `navigator.onLine` and `online`/`offline` events; `apps/app/src/components/OfflineBanner.tsx` displays "You are offline" when disconnected (`apps/app/src/hooks/useOnline.ts`, `apps/app/src/components/OfflineBanner.tsx`)
- [ ] T063 Test PWA install and offline in Playwright — `tests/e2e/pwa.spec.ts` with mobile viewport simulation, service worker registration verification, offline mode test

**Checkpoint:** US8 acceptance scenarios pass; Lighthouse PWA score ≥ 90 on mobile simulation.

---

## Phase 10 — Admin Portal Features [US10]

> **Goal:** Admin can manage employees, clients, assignments, and view dashboard stats.

- [ ] T064 [P] Implement admin routes — `GET /api/org/:slug/admin/dashboard`, `GET/POST /api/org/:slug/admin/employees`, `GET/POST /api/org/:slug/admin/clients`, `GET/POST /api/org/:slug/admin/assignments`, `GET/POST /api/org/:slug/admin/pay-periods` (`apps/api/src/routes/admin/`)
- [ ] T065 [P] Write Vitest tests for admin routes — dashboard stats accuracy, manager/admin role gates, employee role returns 403 (`apps/api/src/routes/admin/admin.test.ts`)
- [ ] T066 [P] Implement `apps/portal/src/features/dashboard/` — DashboardPage with pending timesheet count, open expense count, current pay period, QBO connection status (`apps/portal/src/features/dashboard/`)
- [ ] T067 [P] Implement `apps/portal/src/features/employees/` — EmployeeListPage with role and status display (`apps/portal/src/features/employees/`)
- [ ] T068 [P] Implement `apps/portal/src/features/clients/` — ClientListPage and CreateClientForm (`apps/portal/src/features/clients/`)
- [ ] T069 [P] Implement `apps/portal/src/features/assignments/` — AssignmentListPage and CreateAssignmentForm (`apps/portal/src/features/assignments/`)

**Checkpoint:** US10 acceptance scenarios pass; admin can navigate all management pages without errors.

---

## Phase 11 — Observability

> **Goal:** Structured logging, New Relic agent, audit log integration complete.

- [ ] T070 [P] Add `pino` logger to `apps/api/` — `src/lib/logger.ts` with child logger factory; attach `tenantId`, `userId`, `role` to logger context in `authMiddleware.ts`; log all API errors with route + tenant + error message (`apps/api/src/lib/logger.ts`)
- [ ] T071 [P] Add New Relic browser agent to `apps/app/` and `apps/portal/` — initialize in `main.tsx` conditionally (skip when `PLAYWRIGHT=true`); attach user context after login (`apps/app/src/main.tsx`, `apps/portal/src/main.tsx`)
- [ ] T072 Verify audit log writes — integration test confirming that timesheet approval, rejection, QBO connect, QBO disconnect all produce rows in `audit_logs` with correct `action`, `entity_type`, and `entity_id` (`apps/api/src/audit.test.ts`)

**Checkpoint:** Dev server logs show structured JSON with tenantId on API errors; `audit_logs` table populated after test scenarios.

---

## Phase 12 — CI/CD

> **Goal:** GitHub Actions pipelines for PR (lint/test/Neon branch) and main (migrate/deploy).

- [ ] T073 Create `.github/workflows/pr.yml` — trigger on `pull_request`; steps: checkout, pnpm install, `pnpm lint`, `pnpm test` (Nx affected), create Neon preview branch using Neon CLI with `neon branches create --name pr-${{ github.event.pull_request.number }}` (`.github/workflows/pr.yml`)
- [ ] T074 Create `.github/workflows/main.yml` — trigger on `push` to `main`; steps: checkout, pnpm install, full `pnpm lint` + `pnpm test`, `drizzle-kit migrate` against Neon main, deploy API to Vercel, deploy App + Portal to Vercel in parallel (`.github/workflows/main.yml`)
- [ ] T075 Create `.github/workflows/pr-cleanup.yml` — trigger on `pull_request` closed; delete Neon branch `pr-${{ github.event.pull_request.number }}` using Neon CLI (`.github/workflows/pr-cleanup.yml`)
- [ ] T076 Add GitHub Secrets documentation — `docs/github-secrets.md` listing all required secrets: `NEON_API_KEY`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MAGIC_LINK_SECRET`, `RESEND_API_KEY`, `FROM_EMAIL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `AMQP_URL`, `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`, `QBO_TOKEN_ENCRYPTION_KEY`, `VERCEL_TOKEN`, `NEW_RELIC_LICENSE_KEY` (`docs/github-secrets.md`)

**Checkpoint:** PR opened triggers CI; Neon branch created; lint and tests pass; PR closed deletes Neon branch.

---

## Phase 13 — E2E Tests

> **Goal:** Full Playwright suite covering all user stories and tenant isolation.

- [ ] T077 Configure Playwright — `playwright.config.ts` at repo root; projects for Chromium (desktop + mobile viewport) and WebKit (iOS simulation); base URL from env; global setup runs `pnpm db:reset` (`playwright.config.ts`, `tests/e2e/setup/global-setup.ts`)
- [ ] T078 Write `tests/e2e/auth.spec.ts` — magic link flow (using DB token lookup), password login, logout, redirect to correct tenant, expired token 401 [US1, US2]
- [ ] T079 Write `tests/e2e/timesheets.spec.ts` — create timesheet, add entries, submit, view history, locked pay period 422 [US3]
- [ ] T080 Write `tests/e2e/expenses.spec.ts` — create expense, upload receipt (intercept S3 PUT), submit [US5]
- [ ] T081 Write `tests/e2e/approval.spec.ts` — manager approves and rejects timesheets; status confirmation visible to employee [US4]
- [ ] T082 Write `tests/e2e/branding.spec.ts` — tenant name and logo rendered on login and home screens [US8, US10]
- [ ] T083 Write `tests/e2e/tenant-isolation.spec.ts` — employee A cannot see employee B's timesheets; cross-tenant API returns 403 [FR-001, SC-006]
- [ ] T084 Add `pnpm e2e` script to `package.json`; add E2E step to `main.yml` CI workflow running against Neon preview branch (`package.json`, `.github/workflows/main.yml`)

**Checkpoint:** `pnpm e2e` passes all 6 suites with zero failures (SC-008).

---

## Phase 14 — Documentation & AI Guidance

> **Goal:** `CLAUDE.md`, `AGENTS.md` at repo root; project fully documented for AI agents.

- [ ] T085 [P] Create `CLAUDE.md` at repo root — project stack summary, `pnpm` commands reference, seed user credentials, architecture crib notes (tenant middleware chain, state machines, S3 key conventions, JWT structure), Drizzle schema location, Playwright test locations (`CLAUDE.md`)
- [ ] T086 [P] Create `AGENTS.md` at repo root — code quality rules (TypeScript strict, no `any`), naming conventions (camelCase for TS, kebab-case for files), testing expectations (all routes have Vitest tests, all user stories have E2E tests), constitution reference, prohibited patterns (direct DB access from frontend, public S3 URLs) (`AGENTS.md`)
- [ ] T087 Create `.env.example` at repo root — all env var keys with placeholder values and inline comments describing purpose (`.env.example`)

**Checkpoint:** All three files exist with substantive content; `grep -r "TODO\|FIXME\|PLACEHOLDER"` in `CLAUDE.md` and `AGENTS.md` returns empty.

---

## Dependencies & Execution Order

```
Phase 1 (Scaffold) → Phase 2 (DB) → Phase 3 (API Core) → Phase 4 (Auth)
                                                               ↓
                                         Phase 5 (Timesheets) ─┬─ Phase 7 (QBO)
                                         Phase 6 (Expenses)    │
                                                               ↓
                                         Phase 8 (Push) ← Phase 5 completion
                                         Phase 9 (PWA)  ← Phase 3 completion (manifest route)
                                         Phase 10 (Admin) ← Phase 3 + 4 completion
                                                               ↓
                                         Phase 11 (Observability) ← Phases 5–10 complete
                                         Phase 12 (CI/CD) ← Phase 2 completion (migrations)
                                         Phase 13 (E2E) ← All feature phases complete
                                         Phase 14 (Docs) ← All phases complete
```

### Parallel Opportunities Within Phases
- T002 + T003 (package setup) can run in parallel
- T004 + T005 + T006 (app scaffolds) can run in parallel
- T016 + T017 + T018 (middleware) can run in parallel
- T031 + T032 (frontend auth) can run in parallel after T030
- T039 + T040 (timesheet UIs) can run in parallel after T038
- T045 + T046 (expense UIs) can run in parallel after T044
- T064 + T065 + T066 + T067 + T068 + T069 (admin features) can run in parallel
