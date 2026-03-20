# Tasks: Todo List App

## Phase 1 — Setup

> Project scaffolding, dependency initialisation, and tooling configuration.

- [ ] T001 [P] Bootstrap npm workspaces root — create `package.json` at repo root with `"workspaces": ["apps/*"]` and `tsconfig.base.json` with strict TypeScript settings. _Files: `package.json`, `tsconfig.base.json`_
- [ ] T002 [P] Scaffold Hono API workspace — create `apps/api/package.json` with `hono`, `better-sqlite3`, `zod`, `uuid` dependencies and `vitest`, `@types/better-sqlite3`, `@types/uuid` devDependencies. Add `tsconfig.json` extending base. _Files: `apps/api/package.json`, `apps/api/tsconfig.json`_
- [ ] T003 [P] Scaffold Next.js web workspace — run `npx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir --no-import-alias` (or manual equivalent). _Files: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/next.config.ts`, `apps/web/tailwind.config.ts`_
- [ ] T004 Create `apps/api/src/` directory structure — create empty placeholder files to establish the module layout. _Files: `apps/api/src/index.ts`, `apps/api/src/db.ts`, `apps/api/src/todos/todo.schema.ts`, `apps/api/src/todos/todo.repository.ts`, `apps/api/src/todos/todo.routes.ts`, `apps/api/src/todos/todo.service.ts`, `apps/api/src/middleware/error-handler.ts`_
- [ ] T005 Add `.gitignore` entries — ensure `apps/api/data/`, `node_modules/`, `.next/`, `dist/` are ignored. _Files: `.gitignore`_
- [ ] T006 Configure Vitest in API workspace — add `vitest.config.ts` with `test.environment: 'node'` and coverage settings. _Files: `apps/api/vitest.config.ts`_

---

## Phase 2 — Foundational Infrastructure

> Core infrastructure that blocks all user stories: database, schema, repository, routing skeleton, and error handling.

- [ ] T007 [US1,US2,US3,US4,US5] Implement `apps/api/src/db.ts` — SQLite connection factory using `better-sqlite3`; run `CREATE TABLE IF NOT EXISTS todos (...)` on first call; export singleton `db` instance. Store file at `apps/api/data/todos.db`. _Files: `apps/api/src/db.ts`_
- [ ] T008 [US1,US2,US3,US4,US5] Define Zod schemas and TypeScript types in `apps/api/src/todos/todo.schema.ts` — `TodoSchema`, `CreateTodoSchema`, `UpdateTodoSchema`, `PatchTodoSchema`; export inferred `Todo` type. _Files: `apps/api/src/todos/todo.schema.ts`_
- [ ] T009 [US1,US2,US3,US4,US5] Write repository tests FIRST in `apps/api/tests/todo.repository.test.ts` — test `findAll`, `findById`, `create`, `update`, `patch`, `remove` with an in-memory or temp-file SQLite DB. Ensure tests FAIL before implementation. _Files: `apps/api/tests/todo.repository.test.ts`_
- [ ] T010 [US1,US2,US3,US4,US5] Implement `apps/api/src/todos/todo.repository.ts` — `findAll()`, `findById(id)`, `create(data)`, `update(id, data)`, `patch(id, data)`, `remove(id)` using `better-sqlite3` prepared statements. _Files: `apps/api/src/todos/todo.repository.ts`_
- [ ] T011 Implement `apps/api/src/middleware/error-handler.ts` — Hono `onError` handler returning `{ error, message }` JSON for all uncaught exceptions. _Files: `apps/api/src/middleware/error-handler.ts`_
- [ ] T012 Implement `apps/api/src/index.ts` — create Hono app instance, register logger middleware, CORS middleware (allow `http://localhost:3000`), error handler, mount `/todos` routes, add `GET /health` endpoint, listen on port 3001. _Files: `apps/api/src/index.ts`_

---

## Phase 3 — US1: View All Todos

- [ ] T013 [US1] Write route tests for `GET /todos` and `GET /todos/:id` in `apps/api/tests/todo.routes.test.ts` (use Hono test client). Cover: list returns array sorted by `createdAt`, empty list returns `[]`, `GET /todos/:id` returns 404 for unknown ID. Ensure tests FAIL. _Files: `apps/api/tests/todo.routes.test.ts`_
- [ ] T014 [US1] Implement `GET /todos` and `GET /todos/:id` handlers in `apps/api/src/todos/todo.routes.ts` — call repository, return 200 with todos array or single todo; return 404 if not found. _Files: `apps/api/src/todos/todo.routes.ts`_
- [ ] T015 [US1] Implement typed API client function `getTodos()` in `apps/web/src/lib/api.ts` — `fetch('http://localhost:3001/todos')`, return `Todo[]`. _Files: `apps/web/src/lib/api.ts`_
- [ ] T016 [US1] Implement `TodoList` and `TodoItem` components — `apps/web/src/components/TodoList.tsx` renders list; `TodoItem.tsx` renders a single row with title and completed status. Show empty-state message when list is empty. _Files: `apps/web/src/components/TodoList.tsx`, `apps/web/src/components/TodoItem.tsx`_
- [ ] T017 [US1] Wire up `apps/web/src/app/page.tsx` — fetch todos client-side on mount using `useEffect`/`useState`; pass to `TodoList`. _Files: `apps/web/src/app/page.tsx`_

**Checkpoint US1**: `GET /todos` returns `[]` in curl; visiting http://localhost:3000 shows "No todos yet".

---

## Phase 4 — US2: Create a Todo

- [ ] T018 [US2] Add route tests for `POST /todos` to `apps/api/tests/todo.routes.test.ts` — cover: valid title → 201 + todo, empty title → 400, title > 500 chars → 400. Ensure tests FAIL. _Files: `apps/api/tests/todo.routes.test.ts`_
- [ ] T019 [US2] Implement `POST /todos` handler in `apps/api/src/todos/todo.routes.ts` — parse body with `CreateTodoSchema`, call repository `create()`, return 201. _Files: `apps/api/src/todos/todo.routes.ts`_
- [ ] T020 [US2] Add `createTodo(title: string)` to `apps/web/src/lib/api.ts`. _Files: `apps/web/src/lib/api.ts`_
- [ ] T021 [US2] Implement `AddTodoForm` component — text input + submit button; calls `createTodo`, invokes `onCreated` callback to refresh list. _Files: `apps/web/src/components/AddTodoForm.tsx`_
- [ ] T022 [US2] Add `AddTodoForm` to `apps/web/src/app/page.tsx`; refresh todo list on creation. _Files: `apps/web/src/app/page.tsx`_

**Checkpoint US2**: Submitting the form adds a todo to the list without page reload.

---

## Phase 5 — US3: Toggle Completion

- [ ] T023 [US3] Add route tests for `PATCH /todos/:id` — cover: toggle false→true, toggle true→false, 404 for unknown ID. _Files: `apps/api/tests/todo.routes.test.ts`_
- [ ] T024 [US3] Implement `PATCH /todos/:id` handler — validate `PatchTodoSchema`, call `repository.patch()`, return 200 or 404. _Files: `apps/api/src/todos/todo.routes.ts`_
- [ ] T025 [US3] Add `patchTodo(id: string, completed: boolean)` to `apps/web/src/lib/api.ts`. _Files: `apps/web/src/lib/api.ts`_
- [ ] T026 [US3] Add checkbox to `TodoItem.tsx` — `onChange` calls `patchTodo` and invokes `onUpdated` callback; visually mark completed todos (e.g., line-through). _Files: `apps/web/src/components/TodoItem.tsx`_

**Checkpoint US3**: Clicking checkbox toggles completion visually and persists in DB.

---

## Phase 6 — US4: Delete a Todo

- [ ] T027 [US4] Add route tests for `DELETE /todos/:id` — cover: existing ID → 200 + message, unknown ID → 404. _Files: `apps/api/tests/todo.routes.test.ts`_
- [ ] T028 [US4] Implement `DELETE /todos/:id` handler — call `repository.remove()`, return `{ message: "Todo deleted" }` or 404. _Files: `apps/api/src/todos/todo.routes.ts`_
- [ ] T029 [US4] Add `deleteTodo(id: string)` to `apps/web/src/lib/api.ts`. _Files: `apps/web/src/lib/api.ts`_
- [ ] T030 [US4] Add delete button to `TodoItem.tsx` — calls `deleteTodo` and invokes `onDeleted` callback to remove item from list. _Files: `apps/web/src/components/TodoItem.tsx`_

**Checkpoint US4**: Clicking delete removes the todo from the UI and the database.

---

## Phase 7 — US5: Edit Todo Title

- [ ] T031 [US5] Add route tests for `PUT /todos/:id` — cover: valid title update → 200, empty title → 400, unknown ID → 404. _Files: `apps/api/tests/todo.routes.test.ts`_
- [ ] T032 [US5] Implement `PUT /todos/:id` handler — validate `UpdateTodoSchema`, call `repository.update()`, return 200 or 404/400. _Files: `apps/api/src/todos/todo.routes.ts`_
- [ ] T033 [US5] Add `updateTodo(id: string, title: string)` to `apps/web/src/lib/api.ts`. _Files: `apps/web/src/lib/api.ts`_
- [ ] T034 [US5] Add inline edit mode to `TodoItem.tsx` — edit button toggles an input field; on confirm calls `updateTodo`; on cancel restores original title; validates non-empty before calling API. _Files: `apps/web/src/components/TodoItem.tsx`_

**Checkpoint US5**: Editing a todo title updates it in the UI and the database.

---

## Final Phase — Polish & Cross-Cutting Concerns

- [ ] T035 [P] Add `apps/api/src/todos/todo.service.ts` — thin service layer delegating to repository; ensures business logic (e.g., UUID generation, `createdAt` assignment) is separate from route handlers. _Files: `apps/api/src/todos/todo.service.ts`_
- [ ] T036 [P] Wire CORS properly — confirm Hono CORS middleware allows `http://localhost:3000` origin for all methods. _Files: `apps/api/src/index.ts`_
- [ ] T037 [P] Add `npm run dev` and `npm test` scripts to root `package.json` that run both workspaces concurrently. _Files: `package.json`_
- [ ] T038 [P] Add `apps/api/data/` to `.gitignore`; add `README.md` at repo root with brief setup instructions. _Files: `.gitignore`, `README.md`_
- [ ] T039 Run `tsc --noEmit` across both workspaces and fix any type errors. _Files: (all TypeScript files as needed)_
- [ ] T040 Run `npm test` in `apps/api` and confirm all tests pass; verify coverage ≥ 80% on business logic. _Files: (no source changes; test runner only)_

---

## Dependencies & Execution Order

```
Phase 1 (T001–T006)
  └─► Phase 2 (T007–T012)   [T007–T010 can be parallel after T001–T002]
        └─► Phase 3 (T013–T017)  [US1 — after foundational]
              └─► Phase 4 (T018–T022)  [US2]
                    └─► Phase 5 (T023–T026)  [US3]
                          └─► Phase 6 (T027–T030)  [US4]
                                └─► Phase 7 (T031–T034)  [US5]
                                      └─► Final Phase (T035–T040)
```

**Parallel opportunities**:
- T001, T002, T003 can all run in parallel (different workspaces).
- T013 (write tests) and T015 (API client) can run in parallel within Phase 3.
- Within each phase, frontend tasks (API client + component) can be done in parallel after the route handler is implemented.
- T035–T038 in the Final Phase are all independent and parallelisable.

**Within-story ordering** (example for US2):
1. T018 — write failing tests
2. T019 — implement route (makes backend tests pass)
3. T020 — API client function
4. T021 — UI component
5. T022 — wire into page
