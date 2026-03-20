import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { createTodosRouter } from './routes/todos.js';
import type * as schema from './db/schema.js';

type Db = BetterSQLite3Database<typeof schema>;

export function createApp(db: Db) {
  const app = new Hono();

  app.use('*', logger());
  app.use('*', cors());

  const todosRouter = createTodosRouter(db);
  app.route('/api/todos', todosRouter);

  // Structured error handler
  app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return c.json({ error: 'Internal Server Error' }, 500);
  });

  return app;
}
