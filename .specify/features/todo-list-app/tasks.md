# Tasks: Todo-List App

**Input**: Design documents from `.specify/features/todo-list-app/`
**Prerequisites**: `plan.md` ✅ | `spec.md` ✅

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, directory structure, and tooling configuration

- [ ] T001 Initialize Node.js project — create `package.json` with `name`, `version`, `scripts` (`start`, `dev`, `test`, `migrate`), and `type: "module"` at repository root
- [ ] T002 Install runtime dependencies: `hono`, `@hono/node-server`, `@hono/zod-validator`, `drizzle-orm`, `better-sqlite3`, `zod`
- [ ] T003 [P] Install dev dependencies: `typescript`, `tsx`, `vitest`, `drizzle-kit`, `@types/better-sqlite3`, `@types/node`
- [ ] T004 [P] Create `tsconfig.json` with `strict: true`, `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`
- [ ] T005 [P] Create directory structure: `src/db/`, `src/routes/`, `src/validators/`, `tests/contract/`, `tests/integration/`, `data/`, `drizzle/migrations/`
- [ ] T006 [P] Create `drizzle.config.ts` pointing to `src/db/schema.ts` and `drizzle/migrations/` output directory
- [ ] T007 [P] Add `data/` and `data/todos.db` to `.gitignore`

**Checkpoint**: Project installs cleanly (`npm install`), TypeScript compiles without errors, `npm test` runs (zero tests, zero failures)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Create `src/db/schema.ts` — define `todos` table with Drizzle: columns `id` (integer PK autoincrement), `title` (text not null), `completed` (integer/boolean default 0), `createdAt` (text not null, default `CURRENT_TIMESTAMP`)
- [ ] T009 Run `drizzle-kit generate` to produce the initial SQL migration in `drizzle/migrations/`
- [ ] T010 Create `src/db/client.ts` — open `better-sqlite3` connection to `data/todos.db`, run Drizzle migrations on startup, export typed `db` instance
- [ ] T011 Create `src/validators/todo.ts` — define Zod schemas: `createTodoSchema` (`{ title: string (min 1, max 255) }`), `updateTodoSchema` (`{ completed?: boolean, title?: string (min 1, max 255) }`)
- [ ] T012 Create `src/index.ts` — instantiate Hono app, apply logger middleware, mount `/todos` router (stub), start `@hono/node-server` on `PORT` env var (default `3000`)

**Checkpoint**: Server starts with `npm start`, GET to any route returns Hono's default 404, DB file is created at `data/todos.db`

---

## Phase 3: User Story 1 — Create and View Todos (Priority: P1) 🎯 MVP

**Goal**: Clients can create todo items and retrieve the full list.

**Independent Test**: `POST /todos` with a valid title returns `201` with the new todo object; `GET /todos` returns an array containing it.

### Tests for User Story 1 ⚠️ Write first — ensure they FAIL before implementing

- [ ] T013 [P] [US1] Write contract tests in `tests/contract/todos.test.ts` covering:
  - `POST /todos` with valid body → 201 + todo object shape
  - `POST /todos` with missing title → 400 + error field
  - `POST /todos` with title > 255 chars → 400 + error field
  - `GET /todos` with no todos → 200 + empty array
  - `GET /todos` after creating a todo → 200 + array with that todo

### Implementation for User Story 1

- [ ] T014 [US1] Create `src/routes/todos.ts` — initialize Hono router, implement `POST /` endpoint: validate body with `createTodoSchema`, insert into DB via Drizzle, return `201` with the inserted row
- [ ] T015 [US1] Implement `GET /` endpoint in `src/routes/todos.ts`: query all rows from `todos` table ordered by `createdAt` descending, return `200` with array
- [ ] T016 [US1] Mount `todos` router at `/todos` in `src/index.ts`
- [ ] T017 [US1] Add global error handler in `src/index.ts` to catch unhandled errors and return `500` with `{ error: "Internal server error" }`

**Checkpoint**: Run `npm test` — all US1 contract tests pass. `POST /todos` + `GET /todos` work end-to-end.

---

## Phase 4: User Story 2 — Mark a Todo as Complete (Priority: P2)

**Goal**: Clients can update the `completed` status (and optionally `title`) of an existing todo.

**Independent Test**: Create a todo, PATCH it with `{ "completed": true }`, verify response has `completed: true`; PATCH non-existent id returns 404.

### Tests for User Story 2 ⚠️ Write first — ensure they FAIL before implementing

- [ ] T018 [P] [US2] Add contract tests to `tests/contract/todos.test.ts` covering:
  - `GET /todos/:id` for existing todo → 200 + todo object
  - `GET /todos/:id` for non-existent id → 404 + error field
  - `PATCH /todos/:id` with `{ completed: true }` → 200 + updated todo
  - `PATCH /todos/:id` with `{ completed: false }` → 200 + updated todo
  - `PATCH /todos/:id` for non-existent id → 404 + error field

### Implementation for User Story 2

- [ ] T019 [US2] Implement `GET /:id` endpoint in `src/routes/todos.ts`: query single row by `id`, return `200` with todo or `404` with `{ error: "Todo not found" }`
- [ ] T020 [US2] Implement `PATCH /:id` endpoint in `src/routes/todos.ts`: validate body with `updateTodoSchema`, look up existing todo (return `404` if missing), update changed fields via Drizzle, return `200` with updated row

**Checkpoint**: Run `npm test` — all US1 + US2 contract tests pass. `GET /todos/:id` and `PATCH /todos/:id` work end-to-end.

---

## Phase 5: User Story 3 — Delete a Todo (Priority: P3)

**Goal**: Clients can delete a todo item by id.

**Independent Test**: Create a todo, DELETE it, verify `204 No Content`; subsequent GET by id returns 404; DELETE on non-existent id returns 404.

### Tests for User Story 3 ⚠️ Write first — ensure they FAIL before implementing

- [ ] T021 [P] [US3] Add contract tests to `tests/contract/todos.test.ts` covering:
  - `DELETE /todos/:id` for existing todo → 204 (no body)
  - `DELETE /todos/:id` for non-existent id → 404 + error field
  - After deletion, `GET /todos/:id` → 404

### Implementation for User Story 3

- [ ] T022 [US3] Implement `DELETE /:id` endpoint in `src/routes/todos.ts`: look up existing todo (return `404` if missing), delete from DB via Drizzle, return `204` with no body

**Checkpoint**: Run `npm test` — all US1 + US2 + US3 contract tests pass. Full CRUD lifecycle operational.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Lifecycle integration test, documentation, and final cleanup

- [ ] T023 Write `tests/integration/todos-lifecycle.test.ts` — end-to-end test covering the full create → get-by-id → mark-complete → delete → verify-gone lifecycle in a single test
- [ ] T024 [P] Add `README.md` at repository root with: project description, prerequisites, `npm install` + `npm run migrate` + `npm start` instructions, and example `curl` commands for each endpoint
- [ ] T025 [P] Verify `drizzle/migrations/` is git-tracked and `data/todos.db` is git-ignored
- [ ] T026 [P] Confirm `tsconfig.json` has `strict: true` and no TypeScript errors (`tsc --noEmit`)
- [ ] T027 Run full test suite (`npm test`) — all tests pass with zero failures

**Checkpoint**: Repository is in a clean, documented, fully tested state ready for review.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — blocks all user stories
- **Phase 3 (US1 — P1)**: Depends on Phase 2 — can start as soon as foundation is ready
- **Phase 4 (US2 — P2)**: Depends on Phase 2 — can start in parallel with Phase 3 if staffed
- **Phase 5 (US3 — P3)**: Depends on Phase 2 — can start in parallel with Phases 3 & 4 if staffed
- **Phase 6 (Polish)**: Depends on Phases 3, 4, and 5 all being complete

### Within Each User Story

1. Write tests first — verify they FAIL
2. Implement endpoints
3. Run tests — verify they PASS
4. Commit

### Parallel Opportunities

- T003, T004, T005, T006, T007 (Phase 1 setup tasks marked [P]) can all run simultaneously
- T013, T018, T021 (test-writing tasks) are independent by file section and can be parallelized across developers
- T024, T025, T026 (Phase 6 polish tasks marked [P]) can run simultaneously
- Phases 3, 4, and 5 can be worked in parallel by different developers once Phase 2 is complete

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Write US1 tests (T013) → verify they fail
4. Complete Phase 3: US1 implementation (T014–T017)
5. **STOP AND VALIDATE**: All US1 tests pass — working todo create+list API
6. Continue to Phase 4+ as capacity allows

### Incremental Delivery

- Phase 3 → MVP: create + list todos
- Phase 4 → get-by-id + mark complete
- Phase 5 → delete
- Phase 6 → integration test + docs
