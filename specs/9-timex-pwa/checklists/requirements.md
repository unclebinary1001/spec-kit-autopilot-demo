# TimeX PWA — Requirements Checklist

This checklist acts as "unit tests for English" on the complete artifact set. Every item must be checked before implementation begins.

---

## Specification Quality

- [x] No `[NEEDS CLARIFICATION]` markers remain anywhere — all 8 clarifications resolved in `spec.md § Clarifications`
- [x] Every user story has at least one Given/When/Then acceptance scenario
  - US1: 3 scenarios (magic link happy path, expired link, inactive user)
  - US2: 2 scenarios (correct password, incorrect password)
  - US3: 4 scenarios (create, add entry, submit, unassigned client rejected)
  - US4: 4 scenarios (approval queue visible, approve, reject, employee role 403)
  - US5: 4 scenarios (create, upload receipt, submit, presigned download)
  - US6: 4 scenarios (OAuth redirect, callback stores tokens, status display, disconnect)
  - US7: 3 scenarios (message enqueued, sync success, DLQ on failure)
  - US8: 3 scenarios (install prompt, tenant branding, offline fallback)
  - US9: 3 scenarios (approval notification, rejection notification, permission prompt)
  - US10: 3 scenarios (dashboard stats, employee list, assignment creation)
- [x] All success criteria (SC-001 through SC-012) are measurable and verifiable
  - SC-001: `pnpm install` exits 0 — objective
  - SC-002: `pnpm db:reset` output matches expected seed messages — objective
  - SC-003: Three ports respond — objective
  - SC-004: Login completes in < 5s — measurable via Playwright timing
  - SC-005: Full E2E cycle passes — objective
  - SC-006: 403 HTTP status — objective
  - SC-007: Lighthouse score ≥ 90 — measurable via Playwright/Lighthouse CI
  - SC-008: All Playwright suites pass — objective
  - SC-009: Zero lint/test errors — objective
  - SC-010: Zero build errors — objective
  - SC-011: DB query shows ciphertext in `access_token_enc` column — objective
  - SC-012: New Relic agent absent in Playwright runs (env check) — objective
- [x] No speculative or "might need" features included — all requirements trace to issue phases 0–18

---

## Plan Completeness

- [x] Every functional requirement (FR-001 through FR-024) is addressed in `plan.md`
  - FR-001 (tenant isolation): addressed in "Tenant Isolation Layers" section
  - FR-002 (PWA installable): addressed in "Dynamic PWA Manifest" and Constitution IV
  - FR-003 (magic link 15-min expiry): addressed in Phase 4 tasks (T023–T025)
  - FR-004 (JWT expiry): addressed in auth implementation plan (T025, T026)
  - FR-005 (presigned uploads): addressed in "API-Boundary Discipline" principle
  - FR-006 (S3 key validation): addressed in `s3.ts` service description
  - FR-007 (AES-256-GCM): addressed in "QBO OAuth" and crypto service plan
  - FR-008 (assignment validation): addressed in T035 entry creation task
  - FR-009 (state machine): addressed in "State Machine Enforcement" section
  - FR-010 (RabbitMQ on approval): addressed in T036 and services/rabbitmq.ts
  - FR-011 (audit logs): addressed in Observability principle and T057, T072
  - FR-012 (60s cache): addressed in tenantMiddleware description
  - FR-013 (dynamic manifest): addressed in "Dynamic PWA Manifest" section
  - FR-014 (3 retries): addressed in T052 worker implementation
  - FR-015 (push notifications): addressed in Phase 8 tasks
  - FR-016 (CLAUDE.md + AGENTS.md): addressed in Phase 14 tasks
  - FR-017 (Neon preview branches): addressed in Phase 12 tasks (T073–T075)
  - FR-018 (Vercel preview URLs): addressed in T073–T074 CI workflows
  - FR-019 (MFA for HIPAA §164.312(d)): addressed in constitution §164.312 mapping; T029a implements hono-rate-limiter + device-bound cookie
  - FR-020 (password login rate limiting): addressed in T029a; `api.yaml` 429 on /auth/login
  - FR-021 (all auth endpoints 429 on limit): addressed in T029a and `api.yaml`
  - FR-022 (expired token cleanup): addressed in T071a scheduled job
  - FR-023 (6-year audit log retention): addressed in T071a + data-model.md audit_logs notes
  - FR-024 (WCAG 2.1 AA): addressed in NFR-001 and SC-008 Playwright suite
- [x] All constitution principles listed with explicit compliance notes in `plan.md § Constitution Check`
- [x] `research.md` provides a clear final recommendation for each of 10 decisions:
  - ORM: Drizzle ORM ✓
  - Auth: Custom JWT ✓
  - Messaging: RabbitMQ via CloudAMQP ✓
  - PWA: Vite PWA Plugin (injectManifest) ✓
  - Logging: Pino ✓
  - E2E Testing: Playwright ✓
  - Form handling: React Hook Form ✓
  - Validation: Zod ✓
  - Date/time: date-fns ✓
  - Rate limiting: hono-rate-limiter ✓
- [x] `data-model.md` covers all 14 entities mentioned in the spec (tenants, profiles, user_tenant_roles, pay_periods, clients, assignments, timesheets, timesheet_entries, expenses, push_subscriptions, qbo_credentials, audit_logs, oauth_states, magic_link_tokens) — `magic_link_tokens` fully defined with columns, indexes, and cleanup strategy
- [x] `contracts/api.yaml` covers all API surfaces mentioned in the plan:
  - Branding + manifest (T020) ✓
  - Auth routes (T023–T029) ✓
  - Timesheets CRUD + status (T033–T036) ✓
  - Expenses CRUD + status (T041–T042) ✓
  - Clients list (T064) ✓
  - Upload presign + download (T043) ✓
  - Push subscribe/unsubscribe (T055) ✓
  - Admin QBO routes (T049) ✓
  - Admin employees/clients/assignments/pay-periods/dashboard (T064) ✓

---

## Tasks Readiness

- [x] Every contract endpoint/event has a corresponding task:
  - `GET /org/:slug/branding/public` → T020
  - `GET /org/:slug/manifest.json` → T020
  - `POST /auth/magic-link` → T024
  - `GET /auth/verify` → T025
  - `POST /auth/login` → T026
  - `POST /auth/refresh` → T027
  - `POST /auth/logout` → T028
  - `POST /auth/switch-tenant` → T029
  - `GET/POST /org/:slug/timesheets` → T033
  - `GET /org/:slug/timesheets/:id` → T034
  - `POST /org/:slug/timesheets/:id/entries` → T035
  - `PATCH /org/:slug/timesheets/:id/status` → T036
  - `GET/POST /org/:slug/expenses` → T042
  - `PATCH /org/:slug/expenses/:id/status` → T042
  - `GET /org/:slug/clients` → T064
  - `POST /org/:slug/upload/presign` → T043
  - `POST /org/:slug/upload/download-url` → T043
  - `POST /org/:slug/push/subscribe` → T055
  - `POST /org/:slug/push/unsubscribe` → T055
  - `GET /org/:slug/admin/quickbooks` → T049
  - `GET /org/:slug/admin/quickbooks/connect` → T049
  - `GET /org/:slug/admin/quickbooks/callback` → T049
  - `DELETE /org/:slug/admin/quickbooks/disconnect` → T049
  - `POST /org/:slug/admin/quickbooks/sync` → T049
  - `GET /org/:slug/admin/employees` → T064
  - `GET/POST /org/:slug/admin/clients` → T064
  - `GET/POST /org/:slug/admin/assignments` → T064
  - `GET/POST /org/:slug/admin/pay-periods` → T064
  - `GET /org/:slug/admin/dashboard` → T064
- [x] Every data model entity has a corresponding schema/migration task:
  - All 13 tables → T011 (Drizzle schema)
  - RLS policies → T012 (raw SQL migration)
  - `btree_gist` extension → T012
  - `magic_link_tokens` → T023
  - Drizzle config + client → T010
- [x] Every user story has at least one task phase:
  - US1 (magic link login) → Phase 4 (T023–T032)
  - US2 (password login) → Phase 4 (T026)
  - US3 (create/submit timesheet) → Phase 5 (T033–T039)
  - US4 (approve/reject) → Phase 5 (T036–T040)
  - US5 (expense + receipt) → Phase 6 (T041–T046)
  - US6 (QBO OAuth) → Phase 7 (T047–T053)
  - US7 (QBO sync) → Phase 7 (T052)
  - US8 (PWA installable) → Phase 9 (T059–T063)
  - US9 (push notifications) → Phase 8 (T054–T058)
  - US10 (admin portal) → Phase 10 (T064–T069)
- [x] All deferred architectural decisions have resolution tasks — worker deployment resolved in plan.md with Railway; task T047a creates deployment config
- [x] New CRUD operations have corresponding tasks — T040a (delete entry), T040b (pay periods), T046a (edit expense), T064b-e (admin CRUD)
- [x] HIPAA 2026 MFA requirement addressed — FR-019 added, constitution updated with §164.312 safeguard mapping
- [x] Rate limiting on all auth endpoints — T029a implements `hono-rate-limiter` middleware; FR-020/FR-021 specify limits
- [x] Data cleanup strategy defined — T071a for expired tokens/states; FR-022/FR-023 specify retention
- [x] Seed data supports isolation testing — T013 updated to seed second tenant (Test Corp)
- [x] VAPID keys documented in env template — T054 updated to add to `.env.example`
- [x] Phase ordering respects dependencies:
  - Phase 2 (DB) comes before Phase 3 (API) — schema must exist before middleware
  - Phase 3 (API Core) comes before Phase 4 (Auth) — middleware chain needed
  - Phase 4 (Auth) comes before Phases 5–10 — login gates all features
  - Phase 5 (Timesheets) comes before Phase 8 (Push) — push triggered by timesheet status
  - Phase 5 (Timesheets) comes before Phase 7 (QBO) — sync requires approved timesheets
  - Phase 12 (CI/CD) depends on Phase 2 — migrations run in CI
  - Phase 13 (E2E) comes last — tests exercise completed feature phases
- [x] All tasks have exact file paths — every task specifies the target file(s) in parentheses

---

## Cross-Artifact Consistency

- [x] User story IDs are consistent across artifacts:
  - spec.md: US1–US10 (named with P1/P2/P3 priority)
  - plan.md: references US1–US10 via phase descriptions
  - tasks.md: `[US1]`–`[US10]` tags on relevant tasks
  - contracts/api.yaml: tags align with user story groupings
- [x] Requirement IDs (FR-001 through FR-024) are consistent across spec.md and plan.md (plan §Constitution Check + Complexity Tracking reference FR numbers)
- [x] Technology choices in plan.md match recommendations in research.md:
  - ORM: Drizzle ORM (plan: "Drizzle ORM + Neon serverless driver") ✓
  - Auth: Custom JWT + Resend (plan: "jsonwebtoken, magic link via Resend, bcrypt") ✓
  - Messaging: RabbitMQ / `amqplib` (plan: "RabbitMQ via CloudAMQP (`amqplib`)") ✓
  - PWA: Vite PWA Plugin (plan: "Vite PWA plugin (`vite-plugin-pwa`), Workbox") ✓
  - Logging: Pino (plan: "structured JSON logging (`pino`)") ✓
  - Testing: Playwright (plan: "Playwright (E2E)") ✓
- [x] `data-model.md` entity names match Drizzle schema in task T011 (snake_case table names consistent throughout)
- [x] Edge cases from spec.md EC-001–EC-015 are addressed in API contracts and tasks:
  - EC-001 (locked pay period) → T033 enforces; `api.yaml` 422 on POST /timesheets
  - EC-002 (hours = 0) → T035; DB CHECK constraint in T011; `api.yaml` minimum: 0.01
  - EC-003 (expired magic link) → T025 handles; `api.yaml` 401 on /auth/verify
  - EC-004 (expired QBO refresh) → T048 auto-refresh; error handling in T052 worker
  - EC-005 (cross-tenant S3 key) → T041 validates prefix; `api.yaml` 403 on download-url
  - EC-006 (overlapping pay periods) → T011 exclusion constraint; `api.yaml` 409
  - EC-007 (stale push token) → T054 auto-deletes on 410; T056 handles
  - EC-008 (multi-tenant user) → T025 tenant picker redirect; T029 switch-tenant
  - EC-009 (no QBO credentials) → T052 worker checks before sync; dead-letters
  - EC-010 (10 MB limit) → T041 S3 service + `api.yaml` 413; T045 frontend validation
  - EC-011 (migration failure in CI) → T073 step ordering; deploy blocked until migrate succeeds
  - EC-012 (QBO disconnect mid-sync) → T052 checks credentials existence before each sync
  - EC-013 (brute force — 10+ failed attempts) → T029a rate limiter; FR-020; `api.yaml` 429 on /auth/login
  - EC-014 (expired magic link tokens accumulate) → T071a cleanup job; FR-022 specifies 1-hour purge window
  - EC-015 (employee accesses pay period list) → T040b non-admin endpoint; `api.yaml` GET /org/:slug/pay-periods
