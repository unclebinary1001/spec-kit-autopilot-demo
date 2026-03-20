# Data Model: Todo List App

## Entities

### Todo

Represents a single task in the todo list.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT (UUID v4) | PRIMARY KEY, NOT NULL | Unique identifier generated server-side |
| `title` | TEXT | NOT NULL, LENGTH 1–500 | Task description |
| `completed` | INTEGER (0/1) | NOT NULL, DEFAULT 0 | Boolean flag; SQLite stores booleans as integers |
| `created_at` | TEXT (ISO 8601) | NOT NULL, DEFAULT current_timestamp | Creation time; stored as UTC ISO string |

> **Note on types**: SQLite is loosely typed. `completed` is stored as `INTEGER` (0 = false, 1 = true) and converted to a boolean in the application layer. `created_at` is stored as `TEXT` in ISO 8601 format for simplicity and cross-platform compatibility.

---

## SQL Schema

```sql
CREATE TABLE IF NOT EXISTS todos (
  id         TEXT    PRIMARY KEY NOT NULL,
  title      TEXT    NOT NULL CHECK(length(title) >= 1 AND length(title) <= 500),
  completed  INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos (created_at ASC);
```

---

## TypeScript Type

```typescript
// apps/api/src/todos/todo.schema.ts
export interface Todo {
  id: string;           // UUID v4
  title: string;        // 1–500 characters
  completed: boolean;
  createdAt: string;    // ISO 8601 UTC
}
```

---

## Indexing Strategy

| Index | Column(s) | Rationale |
|---|---|---|
| Primary key (implicit) | `id` | Unique lookup for GET/PATCH/PUT/DELETE by ID |
| `idx_todos_created_at` | `created_at ASC` | Default sort order for `GET /todos` |

---

## Migration Considerations

- Schema is initialised on application startup via `CREATE TABLE IF NOT EXISTS` — no separate migration tool is required for this single-table, single-environment demo.
- If the project grows to require a production database (e.g., PostgreSQL), the repository pattern (`todo.repository.ts`) isolates the DB access layer, making an ORM + migration tool swap straightforward.
- The database file is stored at `apps/api/data/todos.db` and is excluded from version control via `.gitignore`.

---

## ASCII ERD

```
┌───────────────────────────────────┐
│               todos               │
├──────────────┬────────────────────┤
│ id (PK)      │ TEXT (UUID)        │
│ title        │ TEXT               │
│ completed    │ INTEGER (0/1)      │
│ created_at   │ TEXT (ISO 8601)    │
└──────────────┴────────────────────┘
```

> Single-entity model — no foreign keys or relationships needed for this feature scope.
