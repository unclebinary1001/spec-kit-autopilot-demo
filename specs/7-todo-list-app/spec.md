# Feature Specification: Todo List App

**Feature ID**: 7  
**Feature Slug**: todo-list-app  
**Issue**: #7 — Simple Todo List App  
**Status**: Draft  
**Date**: 2026-03-20

---

## Clarifications

The following ambiguities were identified in the issue and resolved as explicit decisions:

1. **Authentication**: The issue does not mention user authentication. **Decision**: No authentication required; the app is single-user and stateless (no login/session).
2. **Persistence**: The issue does not specify a database. **Decision**: Use SQLite for simplicity, matching the constitution's tech constraints.
3. **Todo fields**: The issue does not specify fields beyond a title. **Decision**: Each todo has `id`, `title`, `completed` (boolean), and `created_at` timestamp.
4. **Edit functionality**: Not mentioned in issue. **Decision**: Include inline editing of todo title as it is a standard expectation of a todo list.
5. **Filtering/Sorting**: Not mentioned. **Decision**: Include a filter for All/Active/Completed items only — this is a minimal, expected affordance.
6. **Pagination**: Not mentioned. **Decision**: No pagination — render all todos (suitable for a simple demo app).

---

## User Scenarios & Testing

### US1 — View Todo List (P1)

**Description**: As a user, I want to see all my todos when I open the app, so I know what tasks I have.

**Priority Justification**: Core functionality — without it the app is non-functional.

**Independent Test**: Can be tested with a seeded database and a GET `/api/todos` request returning the list.

**Acceptance Scenarios**:

- **Given** the app is open and the database contains todos  
  **When** the page loads  
  **Then** all todos are displayed in a list with their title and completion status

- **Given** the database is empty  
  **When** the page loads  
  **Then** an empty state message is shown (e.g., "No todos yet!")

---

### US2 — Create a Todo (P1)

**Description**: As a user, I want to add a new todo item so I can track a new task.

**Priority Justification**: Core create functionality — without it the app cannot be populated.

**Independent Test**: POST `/api/todos` with `{ title: "Buy milk" }` returns a 201 with the created todo.

**Acceptance Scenarios**:

- **Given** the user types a title in the input field and submits  
  **When** the form is submitted  
  **Then** a new todo appears in the list with `completed: false`

- **Given** the user submits an empty title  
  **When** the form is submitted  
  **Then** an error message is shown and no todo is created

---

### US3 — Complete/Uncomplete a Todo (P1)

**Description**: As a user, I want to mark a todo as completed or uncompleted so I can track progress.

**Priority Justification**: Core interaction — completing todos is the primary action of a todo app.

**Independent Test**: PATCH `/api/todos/:id` with `{ completed: true }` returns the updated todo.

**Acceptance Scenarios**:

- **Given** an incomplete todo is displayed  
  **When** the user clicks the checkbox  
  **Then** the todo is marked as completed and visually distinguished (strikethrough)

- **Given** a completed todo is displayed  
  **When** the user clicks the checkbox again  
  **Then** the todo is marked as incomplete

---

### US4 — Delete a Todo (P2)

**Description**: As a user, I want to delete a todo so I can remove tasks I no longer need.

**Priority Justification**: Important for list management; secondary to creation and completion.

**Independent Test**: DELETE `/api/todos/:id` returns 204 and the item no longer appears in subsequent GET responses.

**Acceptance Scenarios**:

- **Given** a todo is displayed  
  **When** the user clicks the delete button  
  **Then** the todo is removed from the list

---

### US5 — Edit a Todo (P2)

**Description**: As a user, I want to edit the title of an existing todo so I can correct or update it.

**Priority Justification**: Useful quality-of-life feature; not blocking core functionality.

**Independent Test**: PATCH `/api/todos/:id` with `{ title: "Updated title" }` returns the updated todo with new title.

**Acceptance Scenarios**:

- **Given** a todo is displayed  
  **When** the user double-clicks the title  
  **Then** an editable input appears pre-filled with the current title

- **Given** the edit input is active  
  **When** the user changes the text and presses Enter  
  **Then** the todo title is updated

- **Given** the edit input is active  
  **When** the user presses Escape  
  **Then** the edit is cancelled and the original title is restored

---

### US6 — Filter Todos (P3)

**Description**: As a user, I want to filter todos by All / Active / Completed so I can focus on what matters.

**Priority Justification**: Convenience feature; app is fully functional without it.

**Independent Test**: GET `/api/todos?status=active` returns only incomplete todos; GET `/api/todos?status=completed` returns only completed todos.

**Acceptance Scenarios**:

- **Given** the user selects the "Active" filter  
  **When** the filter is applied  
  **Then** only incomplete todos are shown

- **Given** the user selects the "Completed" filter  
  **When** the filter is applied  
  **Then** only completed todos are shown

- **Given** the user selects the "All" filter  
  **When** the filter is applied  
  **Then** all todos are shown regardless of status

---

## Requirements

### Functional Requirements

| ID     | Requirement                                                                 |
|--------|-----------------------------------------------------------------------------|
| FR-001 | The system shall provide an HTTP API for CRUD operations on todos           |
| FR-002 | The system shall persist todos to a SQLite database                         |
| FR-003 | The frontend shall display the current list of todos on load                |
| FR-004 | The frontend shall allow creating a new todo via a form input               |
| FR-005 | The frontend shall allow marking a todo as complete/incomplete              |
| FR-006 | The frontend shall allow deleting a todo                                    |
| FR-007 | The frontend shall allow inline editing of a todo title                     |
| FR-008 | The API shall support filtering todos by status (all, active, completed)    |
| FR-009 | The API shall validate inputs and return structured error responses         |
| FR-010 | The frontend shall display loading and error states                         |

### Key Entities

- **Todo**: `id` (integer PK), `title` (text, required), `completed` (boolean, default false), `created_at` (datetime)

---

## Success Criteria

| ID     | Criterion                                                                              |
|--------|----------------------------------------------------------------------------------------|
| SC-001 | All 6 API endpoints respond correctly with valid inputs (verified by integration tests) |
| SC-002 | Creating a todo with a blank title returns HTTP 422 with an error message               |
| SC-003 | The frontend renders todos from the API without manual page refreshes                   |
| SC-004 | Marking a todo complete persists across page reload                                     |
| SC-005 | Filtering by "Active" shows only incomplete todos                                       |
| SC-006 | All unit and integration tests pass in CI                                               |

---

## Edge Cases

| Scenario                                      | Expected Behaviour                                              |
|-----------------------------------------------|-----------------------------------------------------------------|
| Empty todo title submitted                    | API returns 422 Unprocessable Entity with `{ error: "Title is required" }` |
| Delete non-existent todo (invalid ID)         | API returns 404 Not Found                                       |
| Update non-existent todo                      | API returns 404 Not Found                                       |
| Very long todo title (>500 chars)             | API returns 422 with validation error                           |
| Concurrent updates (same todo)                | Last write wins; no optimistic locking required for this scope  |
| Database unavailable on startup               | Server exits with a meaningful error message                    |
| Frontend API call fails (network error)       | Frontend shows an error banner; does not crash                  |
