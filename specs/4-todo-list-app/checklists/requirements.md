# Requirements Checklist: Todo List App

> This checklist acts as "unit tests for English" on the full artifact set.
> All items should be ✅ before implementation begins.

---

## Specification Quality

- [x] No `[NEEDS CLARIFICATION]` markers remain anywhere — all ambiguities resolved in `spec.md` Clarifications section
- [x] Every user story has at least one Given/When/Then acceptance scenario (US1–US5 each have 2 scenarios)
- [x] All success criteria (SC-001–SC-006) are measurable and verifiable
- [x] No speculative or "might need" features included — scope is strictly CRUD todo list

---

## Plan Completeness

- [x] FR-001 (RESTful Hono API, CRUD) — addressed in plan: `apps/api/src/todos/todo.routes.ts`
- [x] FR-002 (SQLite persistence) — addressed in plan: `apps/api/src/db.ts` using `better-sqlite3`
- [x] FR-003 (Next.js frontend) — addressed in plan: `apps/web/` workspace
- [x] FR-004 (sorted by `createdAt` ASC) — addressed in `data-model.md` index and repository `findAll()`
- [x] FR-005 (title validation) — addressed via Zod `CreateTodoSchema` / `UpdateTodoSchema`
- [x] FR-006 (structured JSON errors) — addressed via `apps/api/src/middleware/error-handler.ts`
- [x] FR-007 (client-side fetch without full reload) — addressed in `apps/web/src/app/page.tsx` with `useEffect`/`useState`
- [x] All constitution principles listed with explicit compliance notes in `plan.md` Constitution Check table
- [x] `research.md` provides a clear final recommendation for every decision (5 decisions, all resolved)
- [x] `data-model.md` covers the `Todo` entity with all fields, types, constraints, indexes
- [x] `contracts/api.yaml` covers all API surfaces: `GET /todos`, `POST /todos`, `GET /todos/:id`, `PUT /todos/:id`, `PATCH /todos/:id`, `DELETE /todos/:id`, `GET /health`

---

## Tasks Readiness

- [x] `GET /todos` — T013 (test), T014 (handler)
- [x] `POST /todos` — T018 (test), T019 (handler)
- [x] `GET /todos/:id` — T013 (test), T014 (handler)
- [x] `PUT /todos/:id` — T031 (test), T032 (handler)
- [x] `PATCH /todos/:id` — T023 (test), T024 (handler)
- [x] `DELETE /todos/:id` — T027 (test), T028 (handler)
- [x] `GET /health` — T012 (implemented in index.ts)
- [x] `todos` table — T007 (schema init in `db.ts`), T009/T010 (repository)
- [x] US1 (View todos) — Phase 3: T013–T017
- [x] US2 (Create todo) — Phase 4: T018–T022
- [x] US3 (Toggle completion) — Phase 5: T023–T026
- [x] US4 (Delete todo) — Phase 6: T027–T030
- [x] US5 (Edit title) — Phase 7: T031–T034
- [x] Phase ordering respects dependencies — Phase 2 before Phase 3+; each user story phase follows the previous
- [x] All tasks have exact file paths

---

## Cross-Artifact Consistency

- [x] User story IDs consistent: spec (P1/P2) → tasks (US1/US2/US3/US4/US5) — P1 stories = US1–US4, P2 story = US5
- [x] Requirement IDs consistent: FR-001–FR-007 appear in both `spec.md` and `plan.md` Constitution Check
- [x] Technology choices in `plan.md` match recommendations in `research.md`:
  - Backend: Hono ✅
  - Frontend: Next.js 14 App Router ✅
  - Database: better-sqlite3 ✅
  - Validation: Zod ✅
  - Testing: Vitest ✅
- [x] `data-model.md` SQL schema consistent with `contracts/api.yaml` `Todo` schema (id, title, completed, createdAt)
- [x] `quickstart.md` acceptance verification steps map 1:1 to `spec.md` acceptance scenarios (US1–US5)
