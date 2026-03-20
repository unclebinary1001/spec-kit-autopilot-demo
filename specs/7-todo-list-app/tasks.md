# Tasks: Todo List App

**Feature**: 7-todo-list-app  
**Issue**: #7  
**Date**: 2026-03-20

Legend: `[P]` = parallelizable | `[US#]` = user story reference

---

## Phase 1 — Setup

Initialize the monorepo structure, install all dependencies, and configure tooling. No user story yet—this unblocks all subsequent phases.

- [ ] T001 Setup root `package.json` with scripts: `dev:backend`, `dev:frontend`, `db:migrate`, `test` — file: `package.json`
- [ ] T002 Configure TypeScript — file: `tsconfig.json`
- [ ] T003 Configure Drizzle Kit — file: `drizzle.config.ts`
- [ ] T004 Configure Vitest — file: `vitest.config.ts`
- [ ] T005 Configure Next.js with `/api` proxy rewrites — file: `src/frontend/next.config.ts`
- [ ] T006 Add `.gitignore` entries: `todos.db`, `node_modules`, `.next`, `dist`
- [ ] T007 Install production dependencies: `hono`, `@hono/node-server`, `@hono/zod-validator`, `zod`, `drizzle-orm`, `better-sqlite3`, `next`, `react`, `react-dom`, `swr`
- [ ] T008 Install dev dependencies: `typescript`, `vitest`, `@types/node`, `@types/better-sqlite3`, `drizzle-kit`, `tsx`

---

## Phase 2 — Foundational (Blocks All User Stories)

Core infrastructure: database, Hono app factory, base routing. Must be complete before any user story phase.

- [ ] T009 Define Drizzle schema — file: `src/backend/db/schema.ts`
- [ ] T010 Generate initial migration from schema — file: `src/backend/db/migrations/0000_create_todos.sql`
- [ ] T011 Create Drizzle client (applies migrations on init) — file: `src/backend/db/client.ts`
- [ ] T012 Create Hono app factory (for testability, no side effects) — file: `src/backend/app.ts`
- [ ] T013 Create Hono server entry point (Node adapter, runs migrations, starts server) — file: `src/backend/index.ts`
- [ ] T014 Create Zod validation schemas for create and update requests — file: `src/backend/validators/todo.ts`
- [ ] T015 [P] Create Next.js root layout — file: `src/frontend/app/layout.tsx`
- [ ] T016 [P] Create global CSS — file: `src/frontend/app/globals.css`
- [ ] T017 Create API client library (typed fetch wrappers for all 5 endpoints) — file: `src/frontend/lib/api.ts`

---

## Phase 3 — US1: View Todo List

Write tests first, then implement.

- [ ] T018 Write integration test: `GET /api/todos` returns empty array when DB is empty — file: `tests/backend/todos.routes.test.ts`
- [ ] T019 Write integration test: `GET /api/todos` returns seeded todos — file: `tests/backend/todos.routes.test.ts`
- [ ] T020 Implement `GET /api/todos` route handler — file: `src/backend/routes/todos.ts`
- [ ] T021 Register todos router on Hono app — file: `src/backend/app.ts`
- [ ] T022 [P] Implement `TodoList` component: fetches todos via SWR, renders list or empty state — file: `src/frontend/components/TodoList.tsx`
- [ ] T023 [P] Implement main page rendering `TodoList` — file: `src/frontend/app/page.tsx`

**Checkpoint**: `GET /api/todos` returns `[]`; page shows "No todos yet!" message.

---

## Phase 4 — US2: Create a Todo

- [ ] T024 Write unit test: Zod schema rejects empty title, accepts valid title — file: `tests/backend/validators.test.ts`
- [ ] T025 Write integration test: `POST /api/todos` with valid body returns 201 + todo — file: `tests/backend/todos.routes.test.ts`
- [ ] T026 Write integration test: `POST /api/todos` with empty title returns 422 — file: `tests/backend/todos.routes.test.ts`
- [ ] T027 Implement `POST /api/todos` route handler — file: `src/backend/routes/todos.ts`
- [ ] T028 Implement `TodoInput` component: form with text input, submits via `api.createTodo`, triggers SWR revalidation — file: `src/frontend/components/TodoInput.tsx`
- [ ] T029 Integrate `TodoInput` into `TodoList` — file: `src/frontend/components/TodoList.tsx`

**Checkpoint**: Typing in the input and pressing Enter adds a new todo to the list; empty submit shows error.

---

## Phase 5 — US3: Complete/Uncomplete a Todo

- [ ] T030 Write integration test: `PATCH /api/todos/:id` with `{ completed: true }` returns updated todo — file: `tests/backend/todos.routes.test.ts`
- [ ] T031 Write integration test: `PATCH /api/todos/:id` on non-existent ID returns 404 — file: `tests/backend/todos.routes.test.ts`
- [ ] T032 Implement `PATCH /api/todos/:id` route handler (supports partial updates: title and/or completed) — file: `src/backend/routes/todos.ts`
- [ ] T033 Implement `TodoItem` component: renders title, checkbox; clicking checkbox calls `api.updateTodo` — file: `src/frontend/components/TodoItem.tsx`
- [ ] T034 Integrate `TodoItem` into `TodoList` — file: `src/frontend/components/TodoList.tsx`

**Checkpoint**: Checkbox toggles completion; strikethrough applied; state persists on reload.

---

## Phase 6 — US4: Delete a Todo

- [ ] T035 Write integration test: `DELETE /api/todos/:id` returns 204 and todo no longer exists — file: `tests/backend/todos.routes.test.ts`
- [ ] T036 Write integration test: `DELETE /api/todos/:id` on non-existent ID returns 404 — file: `tests/backend/todos.routes.test.ts`
- [ ] T037 Implement `DELETE /api/todos/:id` route handler — file: `src/backend/routes/todos.ts`
- [ ] T038 Add delete button to `TodoItem` component; calls `api.deleteTodo`, triggers SWR revalidation — file: `src/frontend/components/TodoItem.tsx`

**Checkpoint**: Clicking delete removes todo from list immediately.

---

## Phase 7 — US5: Edit a Todo

- [ ] T039 Write unit test: Zod schema accepts partial update with only `title` or only `completed` — file: `tests/backend/validators.test.ts`
- [ ] T040 Write integration test: `PATCH /api/todos/:id` with new title returns updated todo — file: `tests/backend/todos.routes.test.ts`
- [ ] T041 Add inline edit mode to `TodoItem`: double-click shows input, Enter saves, Escape cancels; calls `api.updateTodo` — file: `src/frontend/components/TodoItem.tsx`

**Checkpoint**: Double-click to edit, Enter saves, Escape cancels.

---

## Phase 8 — US6: Filter Todos

- [ ] T042 Write integration test: `GET /api/todos?status=active` returns only incomplete todos — file: `tests/backend/todos.routes.test.ts`
- [ ] T043 Write integration test: `GET /api/todos?status=completed` returns only completed todos — file: `tests/backend/todos.routes.test.ts`
- [ ] T044 Update `GET /api/todos` route to support `?status` query parameter — file: `src/backend/routes/todos.ts`
- [ ] T045 Implement `TodoFilter` component: All/Active/Completed tabs; updates SWR fetch key with status param — file: `src/frontend/components/TodoFilter.tsx`
- [ ] T046 Integrate `TodoFilter` into `TodoList`; pass selected filter to SWR key — file: `src/frontend/components/TodoList.tsx`

**Checkpoint**: Filter tabs show/hide todos by completion status.

---

## Phase 9 — Final Polish

- [ ] T047 [P] Add loading spinner/skeleton state to `TodoList` — file: `src/frontend/components/TodoList.tsx`
- [ ] T048 [P] Add error banner to `TodoList` when API calls fail — file: `src/frontend/components/TodoList.tsx`
- [ ] T049 [P] Add `GET /api/todos/:id` route handler (required by contract) — file: `src/backend/routes/todos.ts`
- [ ] T050 [P] Write integration test: `GET /api/todos/:id` returns todo; returns 404 for missing — file: `tests/backend/todos.routes.test.ts`
- [ ] T051 [P] Verify all `package.json` scripts work end-to-end
- [ ] T052 [P] Verify `quickstart.md` steps are accurate against final implementation

---

## Dependencies & Execution Order

```
Phase 1 (Setup)
    └── Phase 2 (Foundational)
            ├── Phase 3 (US1: View)
            │       └── Phase 4 (US2: Create)
            │               └── Phase 5 (US3: Complete)
            │                       ├── Phase 6 (US4: Delete)
            │                       └── Phase 7 (US5: Edit)
            │                               └── Phase 8 (US6: Filter)
            │                                       └── Phase 9 (Polish)
            └── (T015–T017 in Phase 2 can run in parallel with DB setup)
```

**Parallelizable within phase**: Tasks marked `[P]` within the same phase touch different files and can be worked simultaneously by multiple developers.

**Within-story ordering**: Tests (T018–T019) must be written and confirmed failing before implementation tasks (T020–T023) begin — per Test-First principle.
