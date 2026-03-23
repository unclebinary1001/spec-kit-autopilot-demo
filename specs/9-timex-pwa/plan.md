# TimeX PWA — Implementation Plan

## Summary

Build TimeX from a single-directory React POC into a production-ready, multi-tenant Progressive Web App for home health care time and expense tracking. The implementation spans an Nx monorepo with three deployable apps (`apps/app`, `apps/portal`, `apps/api`), two shared packages, Neon PostgreSQL with Drizzle ORM, AWS S3, RabbitMQ via CloudAMQP, QuickBooks Online OAuth 2.0 integration, and full Playwright E2E test coverage — deployed on Vercel with CI/CD via GitHub Actions.

---

## Technical Context

| Dimension | Details |
|---|---|
| **Language** | TypeScript 5.x (strict mode throughout) |
| **Runtime** | Node.js 20 LTS (API), browser (frontend apps) |
| **Monorepo** | Nx 19 + pnpm 9 workspaces |
| **Frontend** | React 19, Vite 5, shadcn/ui, TanStack Query v5, React Router v6 |
| **API framework** | Hono v4 (Vercel Serverless adapter) |
| **Database** | Neon PostgreSQL (serverless), Drizzle ORM, `drizzle-kit` migrations |
| **Auth** | Custom JWT (jsonwebtoken), magic link via Resend, bcrypt password fallback |
| **Storage** | AWS S3 (presigned URLs via `@aws-sdk/client-s3`) |
| **Messaging** | RabbitMQ via CloudAMQP (`amqplib`) |
| **QBO** | QuickBooks Online API v3 (`node-quickbooks`), OAuth 2.0 via `intuit-oauth` |
| **PWA** | Vite PWA plugin (`vite-plugin-pwa`), Workbox service worker, Web Push (`web-push`) |
| **Testing** | Vitest (unit/integration), Playwright (E2E) |
| **Observability** | New Relic browser agent, structured JSON logging (`pino`) |
| **Deployment** | Vercel (3 projects), GitHub Actions CI/CD |
| **Performance** | FCP < 3s on mobile 3G simulation; Lighthouse PWA score ≥ 90 |
| **Constraints** | HIPAA technical safeguards required; PHI in `clients` table must be encrypted at rest and protected by RLS |

---

## Constitution Check

| Principle | Compliance |
|---|---|
| **I. Security-First** | ✅ Every Hono route applies `tenantMiddleware` + `authMiddleware`. RLS on all business tables. JWT `active_tenant_id` validated against URL slug. QBO tokens AES-256-GCM encrypted. S3 key prefix validated before presigning. |
| **II. API-Boundary Discipline** | ✅ Frontend apps exclusively call the Hono API. No direct DB or S3 access from `apps/app` or `apps/portal`. File uploads go directly to S3 via presigned URLs obtained from the API. |
| **III. Monorepo Cohesion** | ✅ Nx + pnpm workspace. Shared `@timex/domain` (types/enums) and `@timex/utils` (formatters/validators). Each of the 3 apps deploys independently to Vercel. |
| **IV. Mobile-First, Offline-Capable PWA** | ✅ Employee PWA built with Vite PWA plugin + Workbox. Dynamic manifest per tenant. Install prompt shown on second visit. Offline shell fallback. Push notifications for status changes. |
| **V. Observability by Default** | ✅ All status transitions write to `audit_logs`. Structured `pino` logs with tenant/user context on every error. New Relic browser agent in production. RabbitMQ DLQs for all queues. |

---

## Project Structure

### Monorepo Layout

```
timex/
├── apps/
│   ├── app/                    # Employee PWA (React + Vite, port 5173)
│   │   ├── src/
│   │   │   ├── features/       # Feature-first: auth/, timesheets/, expenses/, notifications/, profile/
│   │   │   ├── components/     # Shared UI components (layout, nav, offline banner)
│   │   │   ├── hooks/          # Global hooks (useAuth, useTenant, useOnline)
│   │   │   ├── lib/            # API client, push subscription helpers
│   │   │   ├── sw/             # Service worker entry (workbox config)
│   │   │   └── main.tsx
│   │   ├── public/
│   │   └── vite.config.ts
│   │
│   ├── portal/                 # Admin Portal (React + Vite, port 5174)
│   │   ├── src/
│   │   │   ├── features/       # auth/, dashboard/, timesheets/, expenses/, employees/, clients/, assignments/, quickbooks/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── main.tsx
│   │   └── vite.config.ts
│   │
│   └── api/                    # Hono API (Vercel Serverless, port 3000)
│       ├── src/
│       │   ├── middleware/     # tenantMiddleware.ts, authMiddleware.ts, corsMiddleware.ts
│       │   ├── routes/         # branding.ts, auth.ts, timesheets.ts, expenses.ts, clients.ts, upload.ts, admin/
│       │   ├── services/       # qbo.ts, s3.ts, push.ts, email.ts, crypto.ts
│       │   ├── db/             # schema.ts, client.ts, migrations/
│       │   ├── workers/        # qboSyncWorker.ts, notificationsWorker.ts
│       │   └── index.ts
│       └── vercel.json
│
├── packages/
│   ├── domain/                 # @timex/domain — TypeScript types and enums
│   │   └── src/
│   │       ├── types.ts        # Tenant, Profile, Timesheet, Expense, etc.
│   │       ├── enums.ts        # TimesheetStatus, ExpenseCategory, Role, Platform
│   │       └── index.ts
│   │
│   └── utils/                 # @timex/utils — formatters and validators
│       └── src/
│           ├── date.ts         # formatDate, getCurrentPayPeriod, daysBetween
│           ├── currency.ts     # formatCurrency, parseCurrency
│           ├── validate.ts     # isValidEmail, isPositiveHours, isFutureDate
│           └── index.ts
│
├── scripts/
│   ├── seed.ts                 # Seed Let's Thrive tenant + 4 users
│   └── e2e-setup.ts           # E2E test data setup
│
├── tests/
│   └── e2e/                   # Playwright test suites
│       ├── auth.spec.ts
│       ├── timesheets.spec.ts
│       ├── expenses.spec.ts
│       ├── approval.spec.ts
│       ├── branding.spec.ts
│       └── tenant-isolation.spec.ts
│
├── .github/
│   └── workflows/
│       ├── pr.yml              # Lint + test (affected) + Neon branch
│       ├── main.yml            # Migrate + deploy
│       └── pr-cleanup.yml      # Delete Neon branch on PR close
│
├── specs/
│   └── 9-timex-pwa/           # This feature's spec artifacts
│
├── CLAUDE.md
├── AGENTS.md
├── nx.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

### Spec Artifacts Location

```
specs/9-timex-pwa/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
├── contracts/
│   └── api.yaml
└── checklists/
    └── requirements.md
```

---

## Architecture Decisions

### Middleware Chain (every protected route)
1. `corsMiddleware` — CORS policy per environment
2. `tenantMiddleware` — resolves `:slug` → tenant row with 60s in-memory cache; 404 if unknown
3. `authMiddleware` — verifies JWT signature, expiry, and `active_tenant_id === tenantId`; 401/403 on failure

### State Machine Enforcement
Timesheet status transitions are enforced in the PATCH handler via an allowed-transitions map, not ad-hoc if/else logic. Invalid transitions return 422.

### Tenant Isolation Layers
1. **Application layer**: every Drizzle query includes `.where(eq(table.tenantId, c.var.tenantId))`
2. **Database layer**: RLS policies on all business tables — service role connection used only by workers and migrations

### QBO OAuth (per tenant)
`intuit-oauth` library handles the OAuth 2.0 flow. Per-tenant `access_token_enc` and `refresh_token_enc` are stored in `qbo_credentials`. Auto-refresh occurs 5 minutes before `expires_at`. Re-encryption happens on every token refresh.

### RabbitMQ Worker Architecture
Workers (`qboSyncWorker.ts`, `notificationsWorker.ts`) run as long-lived Node.js processes separate from the Vercel serverless API. They are deployed as Vercel cron-triggered functions or as standalone processes on a container service (to be decided during Phase 8). Each has a dedicated DLQ.

### Dynamic PWA Manifest
`/api/org/:slug/manifest.json` (public, no auth) returns a JSON manifest with tenant branding. The Vite PWA plugin is configured with `injectManifest` strategy; the service worker imports the manifest URL at runtime.

---

## Complexity Tracking

No constitution violations. The following areas warrant extra attention during implementation:

| Area | Complexity Note |
|---|---|
| QBO token auto-refresh | Must be thread-safe in serverless context; use DB `updated_at` as optimistic lock |
| RLS + Drizzle | Drizzle does not natively manage RLS policies; raw SQL migrations required for RLS setup |
| Neon preview branches in CI | Neon CLI integration with GitHub Actions; branch name derived from PR number |
| Multi-tenant JWT re-issuance | Tenant picker must not create a session before the user selects a tenant |
| Dynamic service worker manifest | Workbox `injectManifest` requires careful precache manifest exclusion to avoid caching tenant-specific assets globally |
