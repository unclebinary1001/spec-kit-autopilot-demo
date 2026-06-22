import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { todos } from '../db/schema.js';
import { createTodoSchema, updateTodoSchema } from '../validators/todo.js';
import type * as schema from '../db/schema.js';

type Db = BetterSQLite3Database<typeof schema>;

export function createTodosRouter(db: Db) {
  const router = new Hono();

  const validationHook: Parameters<typeof zValidator>[2] = (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation error', issues: result.error.issues }, 422);
    }
  };

  // GET /api/todos — list all todos, optional ?status filter
  router.get('/', zValidator('query', z.object({ status: z.enum(['all', 'active', 'completed']).optional() }), validationHook), (c) => {
    const { status } = c.req.valid('query');
    let result;
    if (status === 'active') {
      result = db.select().from(todos).where(eq(todos.completed, false)).all();
    } else if (status === 'completed') {
      result = db.select().from(todos).where(eq(todos.completed, true)).all();
    } else {
      result = db.select().from(todos).all();
    }
    return c.json(result);
  });

  // GET /api/todos/:id — get a single todo
  router.get('/:id', (c) => {
    const id = Number(c.req.param('id'));
    const todo = db.select().from(todos).where(eq(todos.id, id)).get();
    if (!todo) {
      return c.json({ error: 'Todo not found' }, 404);
    }
    return c.json(todo);
  });

  // POST /api/todos — create a new todo
  router.post('/', zValidator('json', createTodoSchema, validationHook), (c) => {
    const { title } = c.req.valid('json');
    const result = db.insert(todos).values({ title }).returning().get();
    return c.json(result, 201);
  });

  // PATCH /api/todos/:id — update a todo (title and/or completed)
  router.patch('/:id', zValidator('json', updateTodoSchema, validationHook), (c) => {
    const id = Number(c.req.param('id'));
    const updates = c.req.valid('json');

    const existing = db.select().from(todos).where(eq(todos.id, id)).get();
    if (!existing) {
      return c.json({ error: 'Todo not found' }, 404);
    }

    const updated = db
      .update(todos)
      .set({ ...updates })
      .where(eq(todos.id, id))
      .returning()
      .get();

    return c.json(updated);
  });

  // DELETE /api/todos/:id — delete a todo
  router.delete('/:id', (c) => {
    const id = Number(c.req.param('id'));
    const existing = db.select().from(todos).where(eq(todos.id, id)).get();
    if (!existing) {
      return c.json({ error: 'Todo not found' }, 404);
    }
    db.delete(todos).where(eq(todos.id, id)).run();
    return new Response(null, { status: 204 });
  });

  return router;
}
