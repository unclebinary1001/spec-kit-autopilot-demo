# Data Model: Todo List App

**Feature**: 7-todo-list-app  
**Date**: 2026-03-20

---

## Entities

### Todo

The single core entity of this feature.

| Field        | Type         | Constraints                        | Description                              |
|--------------|--------------|------------------------------------|------------------------------------------|
| `id`         | INTEGER      | PRIMARY KEY, AUTOINCREMENT         | Unique identifier for the todo           |
| `title`      | TEXT         | NOT NULL, length 1–500 chars       | The todo item description                |
| `completed`  | INTEGER      | NOT NULL, DEFAULT 0                | Boolean flag (0 = false, 1 = true)       |
| `created_at` | TEXT         | NOT NULL, DEFAULT CURRENT_TIMESTAMP| ISO 8601 datetime string (UTC)           |

> Note: SQLite uses INTEGER for booleans (0/1). Drizzle ORM maps this to a TypeScript `boolean`.

### Drizzle Schema (TypeScript)

```typescript
// src/backend/db/schema.ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const todos = sqliteTable('todos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
```

---

## Indexing Strategy

| Index              | Column(s)   | Reason                                               |
|--------------------|-------------|------------------------------------------------------|
| Primary Key Index  | `id`        | Auto-created by SQLite; used for O(1) lookups by ID  |
| Optional: Status   | `completed` | If filtering becomes a hot path; not required at MVP |

For the initial scope (simple local app, small dataset), only the primary key index is needed.

---

## Migration Considerations

- **Migration Tool**: Drizzle Kit (`drizzle-kit generate` / `drizzle-kit migrate`)
- **Migration Location**: `src/backend/db/migrations/`
- **Initial Migration**: Creates the `todos` table
- **Strategy**: Run migrations on server startup before accepting requests

```bash
# Generate migration from schema
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate
```

---

## ASCII ERD

```
+------------------+
|      todos       |
+------------------+
| id         (PK)  |
| title            |
| completed        |
| created_at       |
+------------------+
```

This is a single-entity data model with no relationships. Future extensions (tags, users) would introduce foreign keys, but these are out of scope per the feature spec clarifications.

---

## TypeScript Types

```typescript
// Inferred from Drizzle schema
export type Todo = typeof todos.$inferSelect;
// { id: number; title: string; completed: boolean; createdAt: string }

export type NewTodo = typeof todos.$inferInsert;
// { title: string; completed?: boolean; createdAt?: string }
```
