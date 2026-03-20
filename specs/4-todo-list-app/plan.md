# Implementation Plan: Todo List App

## Summary

Build a full-stack todo list application with a **Hono REST API** (Node.js, port 3001) backed by **SQLite**, and a **Next.js 14 App Router** frontend (port 3000) that fetches data from the API. The application supports creating, reading, updating (title + completion), and deleting todos.

---

## Technical Context

| Concern | Choice |
|---|---|
| Language | TypeScript 5.x, strict mode |
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend | Hono 4.x on Node.js ≥ 20 |
| Database | SQLite via `better-sqlite3` (dev); repository pattern for future swap |
| ORM / Query | Raw SQL via `better-sqlite3` (simple enough to avoid ORM overhead) |
| Validation | Zod (schema validation for API request bodies) |
| Testing (backend) | Vitest + `supertest`-style in-process Hono test client |
| Testing (E2E) | Playwright (optional, P2) |
| Monorepo layout | Single repo, two workspaces: `apps/api` (Hono) and `apps/web` (Next.js) |
| Package manager | npm workspaces |
| Target platform | Local development; Vercel-compatible output if deployed |
| Performance goals | API responses < 100 ms for local SQLite; no concurrent-load requirements |
| Constraints | No authentication; single-user; SQLite only for local dev |

---

## Constitution Check

| Principle | Compliance |
|---|---|
| **Simplicity First** | Raw SQL over an ORM, minimal dependencies, no auth complexity, Tailwind for rapid UI |
| **Test-First** | Vitest tests written before API handler implementations; test files created in Phase 2 before Phase 3+ |
| **Library-First** | Hono (routing), Zod (validation), better-sqlite3 (DB), Tailwind (CSS), Vitest (testing) — all community-standard |
| **Type Safety** | TypeScript strict mode throughout; Zod schemas generate inferred types used across API and shared types package |
| **Observability** | Hono logger middleware on all routes; structured JSON error responses with `error` + `message` fields |

---

## Project Structure

```
spec-kit-autopilot-demo/
├── .specify/
│   └── constitution.md
├── specs/
│   └── 4-todo-list-app/
│       ├── spec.md
│       ├── plan.md
│       ├── research.md
│       ├── data-model.md
│       ├── quickstart.md
│       ├── tasks.md
│       ├── contracts/
│       │   └── api.yaml
│       └── checklists/
│           └── requirements.md
├── apps/
│   ├── api/                          # Hono backend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts              # Entry point, app factory
│   │   │   ├── db.ts                 # SQLite connection + schema init
│   │   │   ├── todos/
│   │   │   │   ├── todo.schema.ts    # Zod schemas + inferred types
│   │   │   │   ├── todo.repository.ts # DB access layer
│   │   │   │   ├── todo.routes.ts    # Hono route handlers
│   │   │   │   └── todo.service.ts   # Business logic
│   │   │   └── middleware/
│   │   │       └── error-handler.ts  # Structured error middleware
│   │   └── tests/
│   │       ├── todo.routes.test.ts
│   │       └── todo.repository.test.ts
│   └── web/                          # Next.js frontend
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx          # Home page — todo list
│       │   │   └── globals.css
│       │   ├── components/
│       │   │   ├── TodoList.tsx
│       │   │   ├── TodoItem.tsx
│       │   │   └── AddTodoForm.tsx
│       │   └── lib/
│       │       └── api.ts            # Typed API client (fetch wrappers)
│       └── tests/                    # Placeholder for Playwright E2E
├── package.json                      # Root workspace config
└── tsconfig.base.json
```

---

## Complexity Tracking

No constitution violations identified. All principles are respected as described in the Constitution Check section above.
