# Quickstart: Todo List App

## Prerequisites

- Node.js ≥ 20.x (`node --version`)
- npm ≥ 10.x (`npm --version`)

---

## Setup

```bash
# 1. Clone (if not already) and navigate to repo root
cd spec-kit-autopilot-demo

# 2. Install all workspace dependencies
npm install

# 3. Build shared types (if workspace build step exists)
npm run build --workspace=apps/api
```

---

## Running the Application

Open **two terminal windows**.

### Terminal 1 — Start the Hono API server

```bash
cd apps/api
npm run dev
# Expected output:
# 🔥 Todo API running on http://localhost:3001
```

### Terminal 2 — Start the Next.js frontend

```bash
cd apps/web
npm run dev
# Expected output:
# ▲ Next.js 14.x
# - Local: http://localhost:3000
```

---

## Manual Verification

Open your browser to **http://localhost:3000**.

### US1 — View all todos

1. With a fresh database, the page shows: *"No todos yet"*
2. ✅ Acceptance: empty state message is displayed

### US2 — Create a todo

1. Type `"Buy groceries"` into the input field and press **Add** (or Enter)
2. The todo appears in the list with an unchecked checkbox
3. ✅ Acceptance: todo is visible with title and incomplete status

**Verify empty title is rejected**:
```bash
curl -s -X POST http://localhost:3001/todos \
  -H "Content-Type: application/json" \
  -d '{"title": ""}' | jq
# Expected: {"error":"BAD_REQUEST","message":"title must not be empty"}
```

### US3 — Mark todo as complete

1. Click the checkbox next to *"Buy groceries"*
2. The todo is visually marked as completed (strikethrough or tick)
3. Click again — it returns to incomplete
4. ✅ Acceptance: completion status toggles on each click

### US4 — Delete a todo

1. Click the **Delete** button next to any todo
2. The todo disappears from the list immediately
3. ✅ Acceptance: todo is removed

**Verify 404 for missing ID**:
```bash
curl -s -X DELETE http://localhost:3001/todos/nonexistent-id | jq
# Expected: {"error":"NOT_FOUND","message":"Todo not found"}
```

### US5 — Edit a todo's title

1. Click the **Edit** button (pencil icon) next to a todo
2. Update the title to `"Buy groceries and cook dinner"` and confirm
3. The updated title is shown in the list
4. ✅ Acceptance: title is updated

---

## Running Tests

```bash
# Run all backend unit + integration tests
cd apps/api
npm test

# Expected:
# ✓ todo.routes.test.ts (5 tests)
# ✓ todo.repository.test.ts (4 tests)
# Test Files  2 passed (2)
# Tests  9 passed (9)
```

---

## Health Check

```bash
curl -s http://localhost:3001/health | jq
# Expected: {"status":"ok"}
```

---

## Persistence Check

1. Add a few todos via the UI
2. Stop both servers (Ctrl+C in each terminal)
3. Restart only the API: `npm run dev` in `apps/api`
4. Restart the frontend: `npm run dev` in `apps/web`
5. Navigate to http://localhost:3000 — your todos are still there
6. ✅ Acceptance: SC-003 confirmed — todos persist across restarts
