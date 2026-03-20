# Research: Todo List App

## Decisions Required

1. Backend HTTP framework
2. Frontend framework
3. Database driver
4. Validation library
5. Testing framework

---

## 1. Backend HTTP Framework

### Options Considered

#### A. Hono
- **Summary**: Lightweight, standards-based (Web Fetch API) HTTP framework. Edge-compatible, runs on Node.js, Cloudflare Workers, Deno, Bun.
- **Pros**: Tiny bundle, typed routing, built-in middleware (logger, CORS, body-parser), excellent TypeScript support, active community.
- **Cons**: Smaller ecosystem than Express; fewer third-party middleware options.
- **Constitution compatibility**: ✅ Simplicity, Type Safety, Library-First. Matches constitution's explicit technology constraint.

#### B. Express.js
- **Summary**: Battle-tested Node.js framework, enormous ecosystem.
- **Pros**: Massive ecosystem, mature, universally understood.
- **Cons**: No native TypeScript; relies on `@types/express`; callback-based; heavier than Hono for simple APIs.
- **Constitution compatibility**: ⚠️ Type Safety — requires extra effort; conflicts with modern TS-first approach.

#### C. Fastify
- **Summary**: High-performance Node.js framework with JSON Schema validation.
- **Pros**: Very fast, plugin ecosystem, native TS support.
- **Cons**: More boilerplate than Hono; schema-based validation less ergonomic than Zod.
- **Constitution compatibility**: ✅ but higher complexity than needed.

**✅ Final Recommendation: Hono** — explicitly named in the issue, best TypeScript alignment, minimal overhead.

---

## 2. Frontend Framework

### Options Considered

#### A. Next.js 14 (App Router)
- **Summary**: React meta-framework with file-based routing, SSR, SSG, and React Server Components.
- **Pros**: Production-grade, Vercel-optimised, large ecosystem, App Router provides modern patterns.
- **Cons**: App Router has a learning curve; RSC boundaries require care.
- **Constitution compatibility**: ✅ Matches constitution's explicit technology constraint.

#### B. Next.js 14 (Pages Router)
- **Summary**: Legacy Next.js routing paradigm.
- **Pros**: Simpler mental model, more tutorials/examples.
- **Cons**: Being deprecated in favour of App Router; no RSC support.
- **Constitution compatibility**: ✅ but inconsistent with constitution's "modern" direction.

#### C. Vite + React (SPA)
- **Summary**: Pure client-side React app with Vite bundler.
- **Pros**: Simpler setup, faster dev iteration.
- **Cons**: No SSR; issue specifically asks for Next.js.
- **Constitution compatibility**: ❌ Violates explicit technology constraint.

**✅ Final Recommendation: Next.js 14 App Router** — explicitly named in the issue, aligned with constitution.

---

## 3. Database Driver

### Options Considered

#### A. better-sqlite3
- **Summary**: Synchronous SQLite bindings for Node.js. Zero config, file-based.
- **Pros**: No async complexity, very fast, no separate server process, perfect for local dev/demo.
- **Cons**: Synchronous API can block event loop under heavy load (not a concern for single-user local app); not suitable for serverless or high-concurrency production.
- **Constitution compatibility**: ✅ Simplicity First, zero external dependencies.

#### B. Prisma ORM
- **Summary**: Full-featured TypeScript ORM with migration tooling.
- **Pros**: Auto-generated types, migration support, multi-database.
- **Cons**: Heavy dependency, code generation step, overkill for a simple single-entity demo app.
- **Constitution compatibility**: ⚠️ Conflicts with Simplicity First for a single-entity demo.

#### C. Drizzle ORM
- **Summary**: Lightweight TypeScript ORM, SQL-first.
- **Pros**: Lightweight, type-safe, supports SQLite.
- **Cons**: Still adds abstraction layer; raw SQL is simpler for a single table.
- **Constitution compatibility**: ✅ but raw SQL is simpler for this scope.

**✅ Final Recommendation: better-sqlite3 with raw SQL** — simplest for single-user demo, zero friction setup.

---

## 4. Validation Library

### Options Considered

#### A. Zod
- **Summary**: TypeScript-first schema validation with inferred types.
- **Pros**: Generates TypeScript types from schemas (single source of truth), excellent error messages, composable.
- **Cons**: Adds a dependency.
- **Constitution compatibility**: ✅ Type Safety, Library-First.

#### B. Manual validation
- **Summary**: Custom `if` checks in route handlers.
- **Pros**: Zero dependencies.
- **Cons**: Verbose, error-prone, no type inference, not scalable.
- **Constitution compatibility**: ⚠️ Conflicts with Library-First.

#### C. Valibot
- **Summary**: Modular validation library, tree-shakeable, smaller than Zod.
- **Pros**: Smaller bundle.
- **Cons**: Smaller community, fewer examples.
- **Constitution compatibility**: ✅ but Zod is better-known, faster to implement.

**✅ Final Recommendation: Zod** — industry standard for TypeScript validation, excellent DX.

---

## 5. Testing Framework

### Options Considered

#### A. Vitest
- **Summary**: Vite-based test runner, native ESM, TypeScript-native.
- **Pros**: Fast, no configuration for TypeScript, compatible with Jest API, first-class TS support.
- **Cons**: Smaller ecosystem than Jest (mostly irrelevant for this scope).
- **Constitution compatibility**: ✅ Matches constitution's explicit testing constraint.

#### B. Jest
- **Summary**: Widely-used JavaScript test runner.
- **Pros**: Massive ecosystem.
- **Cons**: Requires Babel/ts-jest for TypeScript; slower than Vitest; more configuration.
- **Constitution compatibility**: ✅ but more friction for a TS-first project.

**✅ Final Recommendation: Vitest** — matches constitution, best TS DX, fast.

---

## Summary of Recommendations

| Concern | Recommendation | Package |
|---|---|---|
| Backend framework | Hono | `hono` |
| Frontend framework | Next.js 14 App Router | `next`, `react`, `react-dom` |
| Database driver | better-sqlite3 | `better-sqlite3`, `@types/better-sqlite3` |
| Validation | Zod | `zod` |
| Testing | Vitest | `vitest`, `@vitest/coverage-v8` |
| CSS | Tailwind CSS | `tailwindcss`, `postcss`, `autoprefixer` |
| API testing | Hono test client | built into `hono` (`hono/testing`) |
