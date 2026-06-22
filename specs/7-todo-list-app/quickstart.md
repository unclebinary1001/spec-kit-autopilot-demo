# Quickstart: Todo List App

**Feature**: 7-todo-list-app  
**Date**: 2026-03-20

This guide walks you through running and manually verifying the todo list application end-to-end.

---

## Prerequisites

- Node.js 18+
- npm 8+

---

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Database Migrations

```bash
npm run db:migrate
```

Expected output:
```
Migrations applied successfully.
```

---

## Running the Application

### 3. Start the Hono Backend API

```bash
npm run dev:backend
```

Expected output:
```
Hono API running on http://localhost:3001
```

### 4. Start the Next.js Frontend (in a new terminal)

```bash
npm run dev:frontend
```

Expected output:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

---

## Manual Verification

Open [http://localhost:3000](http://localhost:3000) in your browser.

### ✅ US1 — View Todo List

1. Open the app with an empty database → you should see **"No todos yet!"**
2. Seed a todo via the API:
   ```bash
   curl -X POST http://localhost:3001/api/todos \
     -H "Content-Type: application/json" \
     -d '{"title": "Buy groceries"}'
   ```
3. Refresh the page → the todo **"Buy groceries"** appears in the list.

---

### ✅ US2 — Create a Todo

1. Type **"Learn Hono"** in the input box and press Enter (or click Add).
2. The todo appears immediately in the list with an unchecked checkbox.
3. Try submitting an **empty title** → an error message appears; no todo is added.

---

### ✅ US3 — Complete/Uncomplete a Todo

1. Click the checkbox next to **"Buy groceries"**.
2. The title renders with a ~~strikethrough~~ and the checkbox is checked.
3. Click the checkbox again → the strikethrough is removed.
4. Reload the page → the completion state is preserved.

---

### ✅ US4 — Delete a Todo

1. Hover over **"Buy groceries"** → a delete (🗑) button appears.
2. Click delete → the todo disappears from the list immediately.
3. Verify via API:
   ```bash
   curl http://localhost:3001/api/todos
   ```
   The deleted todo is no longer in the response.

---

### ✅ US5 — Edit a Todo

1. Double-click on **"Learn Hono"** → the title becomes an editable input.
2. Change to **"Learn Hono API"** and press Enter → the title updates in the list.
3. Double-click again, make a change, then press **Escape** → original title is restored.

---

### ✅ US6 — Filter Todos

1. Create two todos: **"Task A"** (incomplete) and **"Task B"** (mark as complete).
2. Click **"Active"** filter → only **"Task A"** is shown.
3. Click **"Completed"** filter → only **"Task B"** is shown.
4. Click **"All"** filter → both todos are shown.

---

## Running Tests

```bash
npm test
```

Expected output:
```
✓ tests/backend/todos.routes.test.ts (12 tests)
✓ tests/backend/validators.test.ts (6 tests)
Test Files  2 passed (2)
Tests  18 passed (18)
```

---

## API Smoke Tests (curl)

```bash
# List all todos
curl http://localhost:3001/api/todos

# Create a todo
curl -X POST http://localhost:3001/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Test todo"}'

# Update completion
curl -X PATCH http://localhost:3001/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Filter active todos
curl "http://localhost:3001/api/todos?status=active"

# Delete a todo
curl -X DELETE http://localhost:3001/api/todos/1

# Attempt invalid create (expect 422)
curl -X POST http://localhost:3001/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": ""}'
```
