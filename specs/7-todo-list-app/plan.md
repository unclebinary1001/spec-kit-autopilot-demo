# Implementation Plan: Todo List App

**Feature**: 7-todo-list-app  
**Issue**: #7  
**Date**: 2026-03-20

---

## Summary

Build a simple full-stack todo list application with a **Next.js** frontend and a **Hono** backend API, persisting todos to a **SQLite** database via **Drizzle ORM**. The app supports creating, reading, updating (title + completion), deleting, and filtering todos.

---

## Technical Context

| Concern              | Decision                                              |
|----------------------|-------------------------------------------------------|
| Language             | TypeScript (strict mode)                              |
| Frontend Framework   | Next.js 14+ (App Router, Client Components for interactivity) |
| Backend Framework    | Hono (Node.js adapter)                                |
| Database             | SQLite via Drizzle ORM + better-sqlite3               |
| Data Fetching        | SWR (client-side)                                     |
| Input Validation     | Zod + @hono/zod-validator                             |
| Testing              | Vitest                                                |
| Package Manager      | npm                                                   |
| Node.js Version      | 18+                                                   |
| Target Platform      | Local development / Node.js server                    |
| Performance Goals    | Sub-100ms API responses for all CRUD operations (local SQLite) |

---

## Constitution Check

| Principle                        | Compliance                                                                                   |
|----------------------------------|----------------------------------------------------------------------------------------------|
| I. Simplicity First              | ✅ Single entity (Todo), no auth, minimal dependencies, no premature abstractions            |
| II. Full-Stack Separation        | ✅ Hono API is the sole data layer; Next.js only renders and calls API endpoints             |
| III. Test-First                  | ✅ Vitest tests written before implementation; Red-Green-Refactor enforced in task ordering  |
| IV. Library-First Dependencies   | ✅ Drizzle ORM, SWR, Zod, Hono chosen over custom implementations                           |
| V. Observability                 | ✅ Structured JSON error responses from API; frontend loading/error states required          |

**No constitution violations detected.**

---

## Project Structure

### Documentation (`specs/`)

```
specs/
└── 7-todo-list-app/
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

### Source Code

```
src/
├── backend/
│   ├── index.ts               # Hono server entry point (Node adapter)
│   ├── app.ts                 # Hono app factory (for testing)
│   ├── routes/
│   │   └── todos.ts           # /api/todos route handlers
│   ├── db/
│   │   ├── client.ts          # Drizzle client setup
│   │   ├── schema.ts          # Drizzle schema definition
│   │   └── migrations/        # Auto-generated Drizzle migrations
│   └── validators/
│       └── todo.ts            # Zod schemas for request validation
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx            # Main page (renders TodoList)
    │   └── globals.css
    ├── components/
    │   ├── TodoList.tsx        # List container with SWR fetching
    │   ├── TodoItem.tsx        # Individual todo row (checkbox, edit, delete)
    │   ├── TodoInput.tsx       # New todo form input
    │   └── TodoFilter.tsx      # All/Active/Completed filter tabs
    └── lib/
        └── api.ts              # API client (fetch wrappers for all endpoints)

tests/
├── backend/
│   ├── todos.routes.test.ts    # Integration tests for /api/todos routes
│   └── validators.test.ts      # Unit tests for Zod schemas
└── frontend/
    └── components/             # Component unit tests (optional at MVP)

drizzle.config.ts               # Drizzle Kit configuration
package.json                    # Root package.json (or monorepo)
tsconfig.json
```

---

## Architecture Notes

- **Monorepo or single package**: For simplicity, both frontend and backend live in one repository with a single `package.json`. The Next.js dev server proxies `/api/*` to the Hono server running on a separate port (e.g., 3001).
- **Next.js proxy**: `next.config.ts` configures `rewrites` to forward `/api/**` to `http://localhost:3001/api/**` in development. In production, Hono is deployed as a Node.js HTTP server alongside Next.js.
- **Database file**: Located at `./todos.db` (gitignored).
- **Migrations**: Run automatically when the Hono server starts.

---

## Complexity Tracking

_No constitution violations. No unjustified complexity._
