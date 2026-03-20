# Feature Specification: Todo List App

## Clarifications

> Decisions made before planning to resolve ambiguities in the original issue.

1. **Persistence**: The issue does not specify a database. Decision: use SQLite (via `better-sqlite3`) for local development, with the data layer abstracted behind a repository interface so a production database (e.g., PostgreSQL) can be swapped in later.

2. **Authentication**: The issue does not mention user accounts. Decision: the app is single-user with no authentication. All todos belong to a shared list.

3. **Todo fields**: The issue says "todo list" without specifying fields. Decision: a todo has `id`, `title` (required), `completed` (boolean, default false), and `createdAt` timestamp. No due dates or priority fields — keep it simple.

4. **API vs. full-stack**: The issue explicitly calls for a Hono backend API and a Next.js frontend. Decision: Hono runs as a standalone API server (port 3001); Next.js frontend calls it via REST. They are separate processes for clean separation of concerns.

5. **Editing todos**: The issue does not mention editing. Decision: include the ability to edit a todo's title so the app is minimally useful, but treat it as P2.

6. **Filtering**: No filtering or search is mentioned. Decision: out of scope for this feature.

---

## User Scenarios & Testing

### US1 (P1) — View all todos
**Description**: As a user, I want to see a list of all my todos so I know what I need to do.

**Priority justification**: Foundation of the app — without listing, no other story is meaningful.

**Independent test**: Seed the database with 3 todos; visit the home page; verify all 3 appear in the list.

**Acceptance scenarios**:
- *Given* the database contains todos, *When* the user navigates to the home page, *Then* all todos are displayed with their titles and completion status.
- *Given* the database is empty, *When* the user navigates to the home page, *Then* an empty-state message ("No todos yet") is displayed.

---

### US2 (P1) — Create a todo
**Description**: As a user, I want to add a new todo so I can track a new task.

**Priority justification**: Core create operation — the list is useless without the ability to add items.

**Independent test**: Submit the create form with a title; verify the todo appears in the list and is persisted in the database.

**Acceptance scenarios**:
- *Given* the user enters a non-empty title and submits the form, *When* the API receives `POST /todos`, *Then* the todo is saved with `completed: false` and returned with a 201 status.
- *Given* the user submits the form with an empty title, *When* the API receives `POST /todos`, *Then* a 400 error is returned and no todo is created.

---

### US3 (P1) — Mark a todo as complete / incomplete
**Description**: As a user, I want to toggle a todo's completion status so I can track my progress.

**Priority justification**: Core update operation — completing tasks is the central value of a todo list.

**Independent test**: Seed a todo with `completed: false`; toggle it via the UI; verify the API returns `completed: true` and the UI reflects the change.

**Acceptance scenarios**:
- *Given* a todo with `completed: false`, *When* the user clicks the checkbox, *Then* `PATCH /todos/:id` is called and the todo's `completed` becomes `true`.
- *Given* a todo with `completed: true`, *When* the user clicks the checkbox, *Then* `PATCH /todos/:id` is called and the todo's `completed` becomes `false`.

---

### US4 (P1) — Delete a todo
**Description**: As a user, I want to delete a todo so I can remove items I no longer need.

**Priority justification**: Core delete operation — without deletion the list grows unboundedly.

**Independent test**: Seed a todo; click delete; verify the API returns 200 and the todo no longer appears in the list or database.

**Acceptance scenarios**:
- *Given* a todo exists, *When* the user clicks the delete button, *Then* `DELETE /todos/:id` is called and the todo is removed from the list.
- *Given* a todo ID that does not exist, *When* `DELETE /todos/:id` is called, *Then* a 404 error is returned.

---

### US5 (P2) — Edit a todo's title
**Description**: As a user, I want to edit a todo's title so I can correct mistakes or refine a task description.

**Priority justification**: Quality-of-life improvement; the app is functional without it but noticeably incomplete.

**Independent test**: Seed a todo; edit its title via the UI; verify the API returns the updated title and it is reflected in the list.

**Acceptance scenarios**:
- *Given* a todo exists, *When* the user edits the title and confirms, *Then* `PUT /todos/:id` is called and the todo's title is updated.
- *Given* the user clears the title and tries to save, *When* `PUT /todos/:id` is called with an empty title, *Then* a 400 error is returned and the original title is preserved.

---

## Requirements

### Functional Requirements

| ID | Requirement |
|---|---|
| FR-001 | The system shall expose a RESTful API via Hono that supports CRUD operations on todos. |
| FR-002 | The system shall persist todos in SQLite (local dev). |
| FR-003 | The system shall serve a Next.js frontend that displays the todo list and allows user interaction. |
| FR-004 | The API shall return todos sorted by `createdAt` ascending. |
| FR-005 | The API shall validate that `title` is a non-empty string for create and update operations. |
| FR-006 | The API shall return structured JSON errors with `error` and `message` fields. |
| FR-007 | The frontend shall reflect API state without requiring a full page reload (client-side fetching). |

### Key Entities

| Entity | Description |
|---|---|
| `Todo` | Represents a single task with id, title, completed flag, and creation timestamp. |

---

## Success Criteria

| ID | Criterion |
|---|---|
| SC-001 | A user can add, view, complete, delete, and edit todos through the UI with no errors. |
| SC-002 | All API endpoints return correct HTTP status codes (200/201/400/404/500). |
| SC-003 | The database persists todos across server restarts. |
| SC-004 | All Vitest unit and integration tests pass (`npm test` exits 0). |
| SC-005 | `tsc --noEmit` exits with zero errors across the entire repository. |
| SC-006 | The UI renders a meaningful empty state when no todos exist. |

---

## Edge Cases

| Scenario | Expected Behaviour |
|---|---|
| Create with empty/whitespace-only title | API returns 400; no todo created |
| Update with empty/whitespace-only title | API returns 400; existing title unchanged |
| Delete non-existent todo ID | API returns 404 |
| Get non-existent todo ID | API returns 404 |
| Database file missing at startup | API creates a new database file and initialises schema |
| Concurrent UI updates (optimistic update race) | Last write wins; UI re-fetches after each mutation |
| Very long title (> 500 chars) | API returns 400 with a descriptive validation message |
