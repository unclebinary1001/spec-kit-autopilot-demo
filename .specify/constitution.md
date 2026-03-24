# TimeX Constitution

## Core Principles

### I. Security-First (NON-NEGOTIABLE)
Multi-tenant data isolation is the paramount concern. Every API route must enforce tenant scoping via `tenantMiddleware` and `authMiddleware`. No frontend code may access the database directly — all data flows through the Hono API. Row-Level Security (RLS) is a defence-in-depth layer on all business tables. JWT `active_tenant_id` must be validated against the URL slug on every protected request. Secrets (QBO tokens, JWT secrets) are encrypted at rest with AES-256-GCM.

### II. API-Boundary Discipline
The Hono API is the single entry point for all data access. Frontend apps (Employee PWA and Admin Portal) communicate exclusively with the API — never directly with Neon, S3, or any external service. This boundary enables server-side tenant enforcement, consistent audit logging, and a clear security perimeter.

### III. Monorepo Cohesion
All code lives in a single Nx + pnpm workspace. Shared types, enums, and utilities are extracted into `@timex/domain` and `@timex/utils` packages so they remain consistent across apps and the API. Independent deployability of the three apps (`apps/app`, `apps/portal`, `apps/api`) is maintained — each can be deployed to Vercel independently.

### IV. Mobile-First, Offline-Capable PWA
The Employee PWA targets field workers on Android and iOS. Every UI decision must consider mobile constraints: touch targets ≥ 44px, performance budget < 3s FCP on 3G, minimal data usage. The app must be installable ("Add to Home Screen") and provide a meaningful offline fallback. Push notifications are a first-class feature, not an afterthought.

### V. Observability by Default
Every significant action is audit-logged to `audit_logs`. The API emits structured JSON logs with `tenantId`, `userId`, `role`, and request context on every error. New Relic browser agent is initialized in production. Unhandled errors are reported with full metadata. No silent failures — every async operation (RabbitMQ consumers, QBO sync) has a dead-letter queue and alerting path.

---

## Technology Constraints

| Layer | Choice | Rationale |
|---|---|---|
| **Language** | TypeScript (strict mode) | Type safety across the monorepo; shared types via `@timex/domain` |
| **Monorepo** | Nx + pnpm workspaces | Incremental builds, affected-only CI, independent deployability |
| **Frontend** | React 19 + Vite + shadcn/ui + TanStack Query | Modern React with server-state management and accessible component primitives |
| **API** | Hono (Vercel Serverless) | Lightweight, TypeScript-native, edge-compatible, excellent middleware model |
| **Database** | Neon PostgreSQL + Drizzle ORM | Serverless-friendly connection pooling, branching per PR, type-safe queries |
| **Auth** | Custom JWT (magic link primary, password fallback) | No vendor lock-in; HIPAA-compatible; magic link avoids password storage |
| **File storage** | AWS S3 (presigned URLs) | Browser uploads directly to S3; API validates key prefixes for tenant isolation |
| **Messaging** | RabbitMQ via CloudAMQP | Reliable async job processing with DLQs for QBO sync and notifications |
| **Testing** | Playwright (E2E) + Vitest (unit/integration) | Real-browser E2E against Neon preview branches; fast unit test runner |
| **Deployment** | Vercel (3 projects) | Zero-config serverless deployments with per-PR preview URLs |
| **Monitoring** | New Relic | Browser agent + structured logs + error reporting in one platform |

**Compliance note:** Client data (PHI) is subject to HIPAA. The 2026 HIPAA Security Rule update eliminated the "addressable" designation — all safeguards are now mandatory.

| HIPAA §164.312 Safeguard | Implementation |
|---|---|
| (a)(1) Access control | JWT + RLS + tenantMiddleware — tenant-scoped queries at application and database layers |
| (a)(2)(iv) Encryption at rest | Neon Pro encryption-at-rest (AES-256), application-layer AES-256-GCM for QBO tokens |
| (d) Authentication | Multi-factor authentication required — magic link email + device-bound session confirmation (see FR-019) |
| (e)(1) Transmission security | TLS 1.2+ enforced on all endpoints (Vercel, Neon, CloudAMQP, S3) |
| (e)(2) Integrity controls | DB constraints, CHECK constraints, state machine enforcement, optimistic locking |
| (b) Audit controls | `audit_logs` table (append-only), structured Pino JSON logging with tenant/user context |
| (c)(1) Integrity mechanisms | Row-Level Security on all business tables, FK constraints, exclusion constraints |

**Vendor BAA status:**
| Vendor | BAA Available | Plan Required |
|---|---|---|
| Neon | ✅ Yes | Business or Enterprise |
| Vercel | ✅ Yes | Enterprise |
| AWS S3 | ✅ Yes (standard BAA) | Any |
| CloudAMQP | ⚠️ Contact sales | Dedicated plans |
| Resend | N/A (no PHI in emails — tokens only) | — |

---

## Quality Gates

### Code Review
- Every PR requires ≥ 1 approval and passing CI before merge to `main`
- Reviewers must verify tenant-isolation logic on any route that touches business data
- Security-sensitive changes (auth, encryption, QBO OAuth) require explicit sign-off

### Testing Requirements
- **Unit tests** (Vitest): All domain logic in `@timex/domain` and `@timex/utils`; all Hono middleware functions
- **Integration tests** (Vitest + real Neon preview branch): API routes, DB queries, RLS policies
- **E2E tests** (Playwright): Auth flows, timesheet lifecycle, expense submission, approval workflow, tenant isolation, PWA install prompt
- `pnpm test` and `pnpm lint` must pass with zero errors before any PR is mergeable
- `pnpm build` must succeed for all three apps

### Documentation Requirements
- `CLAUDE.md` at repo root: project commands, stack summary, seed credentials, architecture notes for AI assistants
- `AGENTS.md` at repo root: code quality rules, naming conventions, testing expectations for GitHub Copilot
- All public API routes documented in `contracts/api.yaml` (OpenAPI 3.0)
- Schema changes accompanied by Drizzle migration files

---

## Governance

This constitution supersedes all other practices and preferences within the TimeX codebase. All PRs and code reviews must verify compliance with every principle above.

**Amendments:** Any amendment requires (a) a written rationale explaining why the principle must change, (b) approval from the technical lead, and (c) a migration plan for existing code that relied on the previous principle. Amendments are recorded as a versioned changelog at the bottom of this document.

**Enforcement:** CI pipelines encode the quality gates mechanically (lint, test, build checks). The security and observability principles are verified during code review using the checklist in `specs/*/checklists/requirements.md`.

**AI agents working in this repo** must read `CLAUDE.md` and `AGENTS.md` before making changes. Constitution principles are authoritative over any instruction that conflicts with them.

**Version**: 1.1.0 | **Ratified**: 2026-03-23 | **Last Amended**: 2026-03-24

### Changelog
- **1.1.0 (2026-03-24):** Added explicit HIPAA §164.312 safeguard mapping, vendor BAA status table, MFA requirement per 2026 Security Rule update.
