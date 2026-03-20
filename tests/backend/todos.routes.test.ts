import { describe, it, expect } from 'vitest';
import { createApp } from '../../src/backend/app.js';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../src/backend/db/schema.js';

function makeTestApp() {
  const sqlite = new Database(':memory:');
  sqlite.exec(`
    CREATE TABLE todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const db = drizzle(sqlite, { schema });
  const app = createApp(db);
  return app;
}

describe('GET /api/todos', () => {
  it('returns empty array when DB is empty', async () => {
    const app = makeTestApp();
    const res = await app.request('/api/todos');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it('returns seeded todos', async () => {
    const sqlite = new Database(':memory:');
    sqlite.exec(`
      CREATE TABLE todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    sqlite.exec(`INSERT INTO todos (title) VALUES ('Test todo')`);
    const db = drizzle(sqlite, { schema });
    const app = createApp(db);

    const res = await app.request('/api/todos');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe('Test todo');
    expect(body[0].completed).toBe(false);
  });

  it('returns only active todos when status=active', async () => {
    const sqlite = new Database(':memory:');
    sqlite.exec(`
      CREATE TABLE todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    sqlite.exec(`INSERT INTO todos (title, completed) VALUES ('Active', 0), ('Done', 1)`);
    const db = drizzle(sqlite, { schema });
    const app = createApp(db);

    const res = await app.request('/api/todos?status=active');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe('Active');
  });

  it('returns only completed todos when status=completed', async () => {
    const sqlite = new Database(':memory:');
    sqlite.exec(`
      CREATE TABLE todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    sqlite.exec(`INSERT INTO todos (title, completed) VALUES ('Active', 0), ('Done', 1)`);
    const db = drizzle(sqlite, { schema });
    const app = createApp(db);

    const res = await app.request('/api/todos?status=completed');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe('Done');
  });
});

describe('GET /api/todos/:id', () => {
  it('returns a todo by id', async () => {
    const sqlite = new Database(':memory:');
    sqlite.exec(`
      CREATE TABLE todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    sqlite.exec(`INSERT INTO todos (title) VALUES ('Test todo')`);
    const db = drizzle(sqlite, { schema });
    const app = createApp(db);

    const res = await app.request('/api/todos/1');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(1);
    expect(body.title).toBe('Test todo');
  });

  it('returns 404 for missing todo', async () => {
    const app = makeTestApp();
    const res = await app.request('/api/todos/999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/todos', () => {
  it('creates a todo with valid body and returns 201', async () => {
    const app = makeTestApp();
    const res = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Buy milk' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe('Buy milk');
    expect(body.completed).toBe(false);
    expect(body.id).toBeDefined();
  });

  it('returns 422 for empty title', async () => {
    const app = makeTestApp();
    const res = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });
    expect(res.status).toBe(422);
  });

  it('returns 422 for missing title', async () => {
    const app = makeTestApp();
    const res = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
  });
});

describe('PATCH /api/todos/:id', () => {
  it('marks a todo as completed', async () => {
    const sqlite = new Database(':memory:');
    sqlite.exec(`
      CREATE TABLE todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    sqlite.exec(`INSERT INTO todos (title) VALUES ('Buy milk')`);
    const db = drizzle(sqlite, { schema });
    const app = createApp(db);

    const res = await app.request('/api/todos/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.completed).toBe(true);
  });

  it('returns 404 for non-existent todo', async () => {
    const app = makeTestApp();
    const res = await app.request('/api/todos/999', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    expect(res.status).toBe(404);
  });

  it('updates the title of a todo', async () => {
    const sqlite = new Database(':memory:');
    sqlite.exec(`
      CREATE TABLE todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    sqlite.exec(`INSERT INTO todos (title) VALUES ('Old title')`);
    const db = drizzle(sqlite, { schema });
    const app = createApp(db);

    const res = await app.request('/api/todos/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated title' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Updated title');
  });
});

describe('DELETE /api/todos/:id', () => {
  it('deletes a todo and returns 204', async () => {
    const sqlite = new Database(':memory:');
    sqlite.exec(`
      CREATE TABLE todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    sqlite.exec(`INSERT INTO todos (title) VALUES ('To delete')`);
    const db = drizzle(sqlite, { schema });
    const app = createApp(db);

    const deleteRes = await app.request('/api/todos/1', { method: 'DELETE' });
    expect(deleteRes.status).toBe(204);

    // Verify it no longer exists
    const getRes = await app.request('/api/todos/1');
    expect(getRes.status).toBe(404);
  });

  it('returns 404 for non-existent todo', async () => {
    const app = makeTestApp();
    const res = await app.request('/api/todos/999', { method: 'DELETE' });
    expect(res.status).toBe(404);
  });
});
