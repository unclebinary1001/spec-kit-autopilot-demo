# TimeX PWA — Research

## Overview

This document evaluates key library and framework choices for the TimeX platform. Each decision is grounded in the constitution's technology constraints (TypeScript strict, Hono API, Neon/Drizzle, Vercel deployment, HIPAA considerations).

---

## 1. ORM: Drizzle vs Prisma vs Kysely

### Drizzle ORM
**Summary:** TypeScript-first query builder with a schema-as-code approach. Migrations via `drizzle-kit`. Explicit SQL semantics — no magic.

**Pros:**
- Native Neon serverless driver support (`drizzle-orm/neon-serverless`) — critical for Vercel cold-start performance
- Schema defined in TypeScript; inferred types propagate through the entire codebase
- No separate binary/Prisma engine; zero overhead on Vercel Serverless
- `drizzle-kit push` supports Neon preview branches natively
- Lightweight — no global ORM singleton conflicts in serverless edge contexts

**Cons:**
- Less mature than Prisma; fewer community examples
- No built-in RLS management — must use raw SQL migrations for policies
- Migrations require manual coordination with `drizzle-kit`

### Prisma
**Summary:** Industry-standard ORM with auto-generated client, powerful schema DSL, and extensive tooling.

**Pros:**
- Largest community and documentation
- Built-in migration tooling

**Cons:**
- Prisma Engine (Rust binary) adds ~50ms cold start on Vercel Serverless — unacceptable for mobile users
- Official Neon + Prisma integration requires Prisma's Accelerate proxy (additional cost/complexity)
- Not edge-compatible without Accelerate

### Kysely
**Summary:** Type-safe SQL query builder; no schema or migration tooling.

**Pros:**
- Ultra-thin; pure TypeScript
- Works with any raw SQL migration tool

**Cons:**
- No migration tooling — would require a separate tool (Flyway, `node-pg-migrate`)
- More boilerplate than Drizzle for schema definition
- Smaller community

**Decision: Drizzle ORM** — the only choice with first-class Neon serverless support, zero cold-start overhead, and TypeScript schema-as-code that integrates with `drizzle-kit` for Neon preview branch migrations.

---

## 2. Authentication: Custom JWT vs Auth0 vs Clerk

### Custom JWT (jsonwebtoken + Resend)
**Summary:** Hand-rolled magic link + password auth using `jsonwebtoken`, bcrypt, and Resend email.

**Pros:**
- Full control over JWT structure (custom claims: `active_tenant_id`, `role`, `tenant_ids`)
- No per-MAU pricing; HIPAA BAA signed directly with infrastructure providers (Neon, AWS, Vercel)
- Magic link tokens stored in DB — can be invalidated server-side
- Refresh token rotation with httpOnly cookies aligns with OWASP best practices

**Cons:**
- More implementation work (token management, refresh rotation, secure cookie config)
- Security responsibility lies entirely with the team

### Auth0
**Summary:** Managed auth platform with social/magic link/password flows.

**Pros:**
- Battle-tested; minimal implementation

**Cons:**
- Custom JWT claims (multi-tenant `active_tenant_id`) require Auth0 Actions — complex, fragile
- HIPAA BAA available only on Enterprise plan ($$$)
- Vendor lock-in; migrating away is painful

### Clerk
**Summary:** Modern auth platform with embeddable components.

**Pros:**
- Excellent DX; React components for login UI

**Cons:**
- Multi-tenant architecture requires Organizations feature — adds complexity and cost
- HIPAA BAA status unclear for healthcare data
- Less control over JWT payload structure

**Decision: Custom JWT** — the multi-tenant JWT design with `active_tenant_id` and per-tenant role requires full control. HIPAA compliance is straightforward without a third-party auth vendor handling PHI tokens. Resend provides reliable transactional email delivery for magic links.

---

## 3. Messaging: RabbitMQ (CloudAMQP) vs AWS SQS vs Bull/BullMQ

### RabbitMQ via CloudAMQP
**Summary:** Full-featured message broker with exchange/queue routing, DLQ support, and management UI.

**Pros:**
- Native dead-letter queue support via `x-dead-letter-exchange` — matches spec requirements
- CloudAMQP free tier sufficient for MVP; paid plans have SLA
- `amqplib` Node.js client is mature and well-documented
- Message routing flexibility (fanout for notifications, direct for QBO sync)
- Management UI for monitoring and manual replay of DLQ messages

**Cons:**
- Persistent TCP connection (AMQP) — worker process must run as a long-lived Node.js process, not serverless function
- CloudAMQP connection limit on free tier (1 connection)

### AWS SQS
**Summary:** Managed queue service from AWS; simple polling model.

**Pros:**
- Serverless-friendly (polling, no persistent connection)
- FIFO queues for ordering guarantees

**Cons:**
- DLQ configuration more verbose; no routing exchange model
- Already using AWS for S3 — adds another service to manage
- Harder to inspect/replay messages manually vs RabbitMQ management UI

### BullMQ (Redis)
**Summary:** Job queue library built on Redis.

**Pros:**
- Rich job dashboard (Bull Board); retry strategies; cron support

**Cons:**
- Requires a Redis instance (additional infrastructure cost)
- Less separation between "queue" and "worker" concerns than RabbitMQ

**Decision: RabbitMQ via CloudAMQP** — explicitly called out in the issue requirements. DLQ support and the management UI for manual replay are critical for the QBO sync operational workflow.

---

## 4. PWA Service Worker: Vite PWA Plugin vs Manual Workbox vs PWABuilder

### Vite PWA Plugin (`vite-plugin-pwa`)
**Summary:** Official Vite plugin that integrates Workbox with zero-config defaults and `injectManifest` for custom service workers.

**Pros:**
- Seamless Vite integration; precache manifest injected at build time
- `injectManifest` strategy allows fully custom service worker logic (offline fallback, push handling)
- TypeScript support for service worker types
- Generates `manifest.webmanifest` or allows linking to a dynamic endpoint

**Cons:**
- Dynamic manifest (per-tenant branding) requires using `includeManifestIcons: false` and pointing to the API endpoint — slight configuration complexity

### Manual Workbox
**Summary:** Direct use of Workbox libraries without Vite integration.

**Pros:**
- Maximum control

**Cons:**
- Boilerplate for precache integration with Vite build hashes
- No `injectManifest` automation — must manually track asset URLs

### PWABuilder
**Summary:** Microsoft tool for generating PWA assets.

**Pros:**
- Good for generating icons and manifest boilerplate

**Cons:**
- Not a build-time integration; doesn't replace Workbox for runtime caching

**Decision: Vite PWA Plugin with `injectManifest` strategy** — tight Vite integration, full service worker control for push notification handling, and the ability to link the manifest to the dynamic API endpoint for per-tenant branding.

---

## 5. Logging: Pino vs Winston vs Console

### Pino
**Summary:** High-performance structured JSON logger with async logging to minimize blocking.

**Pros:**
- Fastest Node.js logger (benchmarked); important for API latency
- Structured JSON output natively — New Relic Logs ingests JSON directly
- Child loggers enable per-request context (tenantId, userId, role) without manual repetition
- `pino-pretty` for human-readable dev output

**Cons:**
- Async by default; log statements may be lost on crash without `pino/file` transport (use `sync: true` in test)

### Winston
**Summary:** Widely-used, flexible logger.

**Pros:**
- Familiar to most Node.js developers

**Cons:**
- 2–3× slower than Pino; not ideal for high-throughput API paths
- More verbose configuration for structured JSON

### Console
**Pros:** Zero dependencies.
**Cons:** Not structured; not suitable for production observability.

**Decision: Pino** — performance-critical API logging with structured JSON output that feeds directly into New Relic Logs. Child loggers make per-tenant/per-user context injection trivial.

---

## 6. E2E Testing: Playwright vs Cypress vs Vitest Browser Mode

### Playwright
**Summary:** Microsoft's cross-browser E2E testing framework.

**Pros:**
- Multi-browser (Chromium, Firefox, WebKit/Safari) — critical for testing iOS PWA behaviour
- Mobile viewport emulation with real touch events
- Network interception (mock or passthrough) for offline testing
- Runs against real Neon preview databases in CI (spec requirement)
- First-class TypeScript support

**Cons:**
- Heavier CI setup than Cypress (multiple browser binaries)

### Cypress
**Summary:** Browser-based E2E framework with excellent developer experience.

**Pros:**
- Excellent time-travel debugging
- Component testing mode

**Cons:**
- No native Safari/WebKit support — cannot test iOS PWA scenarios
- Single browser per test run (historically)

### Vitest Browser Mode
**Summary:** Vitest running tests in a real browser via WebDriver.

**Pros:**
- Shares Vitest config; great for unit/component tests in browser

**Cons:**
- Immature for full E2E workflows; better suited for component-level tests

**Decision: Playwright** — multi-browser support (including WebKit for iOS PWA simulation) and real-database integration with Neon preview branches align directly with spec requirements.

---

## 7. Form Handling: React Hook Form vs Formik vs Native

### React Hook Form
**Summary:** Performant, hook-based form library with minimal re-renders and built-in validation.

**Pros:**
- Tiny bundle (~8KB gzipped); fits the FCP < 3s performance budget
- Uncontrolled inputs by default — minimal re-renders on large forms (timesheet entries)
- First-class Zod integration via `@hookform/resolvers` for schema-based validation
- Excellent TypeScript support with inferred form types

**Cons:**
- Uncontrolled approach can be unfamiliar to developers used to controlled inputs

### Formik
**Summary:** Popular form library with controlled input model.

**Pros:**
- Large community, extensive documentation

**Cons:**
- ~15KB gzipped; heavier than React Hook Form
- Controlled inputs cause re-renders on every keystroke — problematic for timesheet entry forms with many fields
- Yup integration (not Zod) — adds another validation library

**Decision: React Hook Form** — best performance/bundle-size ratio for mobile-first PWA with many form-heavy screens. Zod resolver enables shared validation schemas between frontend and API.

---

## 8. Validation: Zod vs Valibot vs Joi

### Zod
**Summary:** TypeScript-first schema validation library. Compiles to types and validates at runtime.

**Pros:**
- Infers TypeScript types from schemas — single source of truth for types and validation
- Integrates with Drizzle (`drizzle-zod`) to generate Zod schemas from DB schema
- Integrates with React Hook Form via `@hookform/resolvers/zod`
- Works on both frontend and API — shared validation in `@timex/domain`

**Cons:**
- ~13KB gzipped; larger than Valibot

### Valibot
**Summary:** Ultra-lightweight validation library (~1KB gzipped) with tree-shakeable API.

**Pros:**
- Smallest bundle size of any validation library

**Cons:**
- Smaller ecosystem; no `drizzle-valibot` equivalent
- Less mature TypeScript inference

**Decision: Zod** — the Drizzle + React Hook Form + Hono ecosystem all have first-class Zod support. `drizzle-zod` generates Zod schemas from the Drizzle schema, creating a single type/validation chain from DB → API → frontend.

---

## 9. Date/Time: date-fns vs Day.js vs Native Intl

### date-fns
**Summary:** Modular, tree-shakeable date utility library.

**Pros:**
- Tree-shakeable — only import functions used (typically 2-5KB total for date formatting + comparison)
- Pure functions, immutable — no global state issues in serverless
- Covers all TimeX needs: `format`, `isWithinInterval`, `differenceInDays`, `startOfWeek`

**Cons:**
- Many small imports can be verbose

### Day.js
**Summary:** Lightweight Moment.js replacement (~2KB core).

**Pros:**
- Small core, familiar Moment-like API

**Cons:**
- Plugin system adds complexity for timezone/locale support
- Mutable by default; `.clone()` needed for immutability

**Decision: date-fns** — tree-shaking keeps bundle small, pure functions align with serverless and React patterns, and covers all pay period/work date calculations.

---

## 10. Rate Limiting: hono-rate-limiter vs Custom Middleware

### hono-rate-limiter (rhinobase)
**Summary:** Express-style rate limiting middleware for Hono with pluggable stores.

**Pros:**
- Drop-in Hono middleware; supports per-route configuration
- Multiple store backends: memory (development), Vercel KV (production), Redis
- Configurable window, max requests, key generator (by IP, by user, by IP+email)

**Cons:**
- In-memory store doesn't share state across Vercel serverless instances — Vercel KV or Redis required for production

### Custom Middleware
**Pros:**
- No dependency
**Cons:**
- Must implement sliding window, key generation, and distributed state from scratch

**Decision: hono-rate-limiter** — proven middleware with Vercel KV store for distributed rate limiting across serverless instances. Apply to all auth endpoints with per-route limits.

---

## Version Compatibility Matrix

| Library | Version | Node.js | TypeScript | Notes |
|---|---|---|---|---|
| React | 19.x | — | 5.x | React 19 requires TS 5.x |
| Vite | 5.x | 20+ | 5.x | |
| Hono | 4.x | 18+ | 5.x | |
| Drizzle ORM | 0.36+ | 18+ | 5.x | Native Neon serverless driver support |
| TanStack Query | 5.x | — | 5.x | |
| React Router | 6.x | — | 5.x | |
| Playwright | 1.48+ | 18+ | — | WebKit support for iOS PWA testing |
| Zod | 3.23+ | — | 5.x | `drizzle-zod` compat |
| React Hook Form | 7.53+ | — | 5.x | Zod resolver support |
| date-fns | 4.x | — | 5.x | ESM-only in v4 |
| hono-rate-limiter | 0.4+ | 18+ | 5.x | Vercel KV store support |
| web-push | 3.6+ | 16+ | — | VAPID support |

---

## Organizational Constraints

- **HIPAA**: All external services (Neon, Vercel, AWS, CloudAMQP) must have BAA agreements in place before storing PHI. Resend is used for magic links only (no PHI in email body — tokens only).
- **Cost**: CloudAMQP free tier is used for development; production uses the "Lemur" plan ($19/mo). Neon Pro plan required for encryption-at-rest and higher connection limits.
- **Vercel limits**: Vercel Serverless Function execution timeout is 10s (Hobby) or 60s (Pro). QBO sync is handled by a worker process, not a Vercel function, to avoid timeout constraints.
