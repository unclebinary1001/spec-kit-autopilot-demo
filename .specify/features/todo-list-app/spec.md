# Feature Specification: Todo-List App

**Feature Branch**: `1-todo-list-app`
**Created**: 2026-03-19
**Status**: Draft
**Input**: User description: "Build a Todo-List App — I want a web application with a Hono backend api that is a todo list application."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create and View Todos (Priority: P1)

A user can create new todo items and view the full list of existing todos. This is the core loop of any todo application: adding work and seeing what needs to be done.

**Why this priority**: Without the ability to create and list todos, no other feature has value. This is the foundational MVP interaction.

**Independent Test**: Can be fully tested by sending a `POST /todos` request to create a todo, then a `GET /todos` request to retrieve the list, and verifying the new item appears. Delivers complete standalone value as a simple task-capture API.

**Acceptance Scenarios**:

1. **Given** the API is running, **When** a `POST /todos` request is sent with a `title` field, **Then** the API responds with `201 Created` and the created todo object including an `id`, `title`, `completed: false`, and `createdAt` timestamp.
2. **Given** one or more todos exist, **When** a `GET /todos` request is sent, **Then** the API responds with `200 OK` and a JSON array of all todos.
3. **Given** no todos exist, **When** a `GET /todos` request is sent, **Then** the API responds with `200 OK` and an empty array `[]`.
4. **Given** the API is running, **When** a `POST /todos` request is sent with a missing or empty `title`, **Then** the API responds with `400 Bad Request` and a descriptive error message.

---

### User Story 2 — Mark a Todo as Complete (Priority: P2)

A user can mark an existing todo item as complete (or toggle it back to incomplete), allowing them to track progress through their task list.

**Why this priority**: Completion state is the primary signal of progress in a todo app. Without it, the app is only a note-taking tool.

**Independent Test**: Can be fully tested by creating a todo via `POST /todos`, then sending `PATCH /todos/:id` with `{ "completed": true }`, and verifying the response reflects the updated state and a subsequent `GET /todos/:id` returns the same.

**Acceptance Scenarios**:

1. **Given** a todo exists with `completed: false`, **When** a `PATCH /todos/:id` request is sent with `{ "completed": true }`, **Then** the API responds with `200 OK` and the todo object with `completed: true`.
2. **Given** a todo exists with `completed: true`, **When** a `PATCH /todos/:id` request is sent with `{ "completed": false }`, **Then** the API responds with `200 OK` and the todo object with `completed: false`.
3. **Given** no todo with the given `id` exists, **When** a `PATCH /todos/:id` request is sent, **Then** the API responds with `404 Not Found`.

---

### User Story 3 — Delete a Todo (Priority: P3)

A user can delete a todo item that is no longer relevant, keeping the list clean and manageable.

**Why this priority**: Deletion is a housekeeping concern. The app delivers full value through creation, viewing, and completion; deletion is a quality-of-life enhancement.

**Independent Test**: Can be fully tested by creating a todo via `POST /todos`, then sending `DELETE /todos/:id`, verifying `204 No Content` is returned, and confirming the item no longer appears in `GET /todos`.

**Acceptance Scenarios**:

1. **Given** a todo exists, **When** a `DELETE /todos/:id` request is sent, **Then** the API responds with `204 No Content` and the todo is removed from the store.
2. **Given** no todo with the given `id` exists, **When** a `DELETE /todos/:id` request is sent, **Then** the API responds with `404 Not Found`.

---

### Edge Cases

- What happens when a `POST /todos` body is not valid JSON? → API must return `400 Bad Request` with a parse-error message.
- What happens when the `:id` path parameter is not a valid format (e.g., not a UUID or integer)? → API must return `400 Bad Request`.
- What happens if the SQLite database file is locked or unavailable at startup? → Application must fail fast with a descriptive error log and non-zero exit code.
- What happens when `PATCH /todos/:id` is sent with unexpected fields? → Unexpected fields are ignored; only `completed` and `title` are honoured.
- What happens when a very long title is submitted? → API must enforce a maximum title length (255 characters) and return `400 Bad Request` if exceeded.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow clients to create a new todo item via HTTP POST with a required `title` field.
- **FR-002**: System MUST allow clients to retrieve all todo items via HTTP GET.
- **FR-003**: System MUST allow clients to retrieve a single todo item by its `id` via HTTP GET.
- **FR-004**: System MUST allow clients to update the `completed` status (and optionally `title`) of an existing todo via HTTP PATCH.
- **FR-005**: System MUST allow clients to delete a todo item by its `id` via HTTP DELETE.
- **FR-006**: System MUST persist todo items across server restarts using SQLite.
- **FR-007**: System MUST validate all incoming request payloads and return structured `400 Bad Request` errors for invalid input.
- **FR-008**: System MUST return `404 Not Found` when an operation targets a non-existent todo `id`.
- **FR-009**: System MUST assign each todo a unique identifier at creation time.
- **FR-010**: System MUST record a `createdAt` timestamp for each todo at creation time.

### Key Entities

- **Todo**: Represents a single task item.
  - `id`: Unique identifier (integer auto-increment or UUID string)
  - `title`: Non-empty string, max 255 characters
  - `completed`: Boolean, defaults to `false`
  - `createdAt`: ISO 8601 timestamp set at creation

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All five CRUD operations (create, list, get-by-id, update, delete) return correct HTTP status codes and JSON bodies as defined in acceptance scenarios.
- **SC-002**: Todo data persists across server restarts — verified by stopping and restarting the server and confirming previously created todos are still retrievable.
- **SC-003**: Invalid requests (missing title, non-existent id, malformed JSON) consistently return `400` or `404` with a descriptive `error` field in the response body.
- **SC-004**: The API starts successfully with `npm start` (or `bun run start`) and is accessible on a configurable port (default `3000`).
- **SC-005**: All contract and integration tests pass in CI with zero failures.
