# Research: Todo List App — Library & Framework Decisions

**Feature**: 7-todo-list-app  
**Date**: 2026-03-20

---

## Decision 1: ORM / Database Access Layer

### Context
The constitution mandates SQLite for local development. We need to choose how to interact with the database from the Hono backend (Node.js/TypeScript).

### Options Evaluated

#### Option A: Drizzle ORM
- **Summary**: Lightweight, type-safe TypeScript ORM with a SQL-like query builder. First-class SQLite support via `better-sqlite3`.
- **Pros**: Full TypeScript inference, schema-first with migrations, minimal runtime overhead, actively maintained.
- **Cons**: Newer library (less SO coverage than Prisma), migration tooling slightly more manual than Prisma.
- **Constitution Compatibility**: ✅ TypeScript-native, SQLite supported, Library-First principle satisfied.

#### Option B: Prisma
- **Summary**: Industry-standard ORM with a declarative schema and auto-generated client.
- **Pros**: Excellent DX, strong migration tooling, widespread adoption.
- **Cons**: Heavy runtime dependency, Prisma Client is generated (extra build step), SQLite support exists but is secondary to PostgreSQL.
- **Constitution Compatibility**: ✅ Compatible but adds unnecessary complexity for a simple local app.

#### Option C: better-sqlite3 (raw)
- **Summary**: Synchronous SQLite bindings for Node.js. Fast, no abstractions.
- **Pros**: Zero ORM overhead, simple for small projects.
- **Cons**: No type safety for queries, manual schema management, verbose SQL for CRUD.
- **Constitution Compatibility**: ⚠️ Violates Library-First (no productivity layer) and Test-First (harder to mock).

### Recommendation
**Drizzle ORM** — best balance of type safety, simplicity, and SQLite compatibility. Avoids Prisma's heavyweight setup while providing schema and migration management.

---

## Decision 2: Backend API Framework

### Context
The issue explicitly specifies **Hono** as the backend API framework. No evaluation needed.

### Selected: Hono
- **Summary**: Ultralight, edge-first web framework for Node.js (and Cloudflare Workers, Deno, etc.).
- **TypeScript support**: Native.
- **Routing**: Express-like syntax, middleware support.
- **Validation**: `@hono/zod-validator` provides request validation via Zod.
- **Constitution Compatibility**: ✅ Satisfies Simplicity First, Full-Stack Separation, and Technology Constraints.

---

## Decision 3: Frontend Framework & Data Fetching

### Context
The issue explicitly specifies **Next.js** as the frontend. The question is which data-fetching approach to use.

### Options Evaluated

#### Option A: Next.js App Router with React Server Components + fetch
- **Summary**: Use server components to fetch data directly, with client components for interactivity.
- **Pros**: Modern Next.js pattern, no additional client library needed.
- **Cons**: Mixing server/client components can complicate mutation flows; adds complexity.
- **Constitution Compatibility**: ⚠️ More complex than needed for a simple todo app.

#### Option B: Next.js App Router + SWR (Client Components)
- **Summary**: All data fetching done client-side using SWR for caching/revalidation.
- **Pros**: Simple mental model, optimistic updates built-in, easy to use alongside Hono API.
- **Cons**: No SSR for initial data; adds one dependency.
- **Constitution Compatibility**: ✅ Simplicity, Library-First satisfied.

#### Option C: Next.js App Router + TanStack Query
- **Summary**: Full-featured server state management library.
- **Pros**: Powerful caching, mutation hooks with loading/error states.
- **Cons**: More complex than needed for a simple todo app.
- **Constitution Compatibility**: ⚠️ Over-engineered for this scope.

### Recommendation
**SWR** — simple, well-established, and perfectly suited for a CRUD todo app. Provides caching and revalidation with minimal boilerplate.

---

## Decision 4: Input Validation

### Context
The spec requires the API to validate inputs and return structured errors (FR-009). Hono supports middleware-based validation.

### Selected: Zod + @hono/zod-validator
- **Summary**: Zod provides schema-based TypeScript validation; the Hono validator middleware integrates it directly into route handlers.
- **Pros**: Type-safe validation, automatic 422 responses, reusable schemas.
- **Constitution Compatibility**: ✅ Library-First, Test-First (schemas are independently testable).

---

## Decision 5: Testing Framework

### Context
The constitution mandates Test-First development. We need a test runner compatible with both the Hono backend and Next.js frontend.

### Selected: Vitest
- **Summary**: Vite-native test runner, Jest-compatible API, fast.
- **Pros**: Works with both Node.js (Hono) and browser environments (React), excellent TypeScript support, fast execution.
- **Constitution Compatibility**: ✅ Supports Test-First principle.

For API integration tests, `@hono/testing` (or direct `fetch` against the Hono app using `app.request(...)`) will be used.

---

## Summary of Recommendations

| Decision              | Recommendation              |
|-----------------------|-----------------------------|
| ORM                   | Drizzle ORM (better-sqlite3)|
| Backend Framework     | Hono (as specified)         |
| Frontend Framework    | Next.js (as specified)      |
| Data Fetching         | SWR                         |
| Input Validation      | Zod + @hono/zod-validator   |
| Testing               | Vitest                      |
