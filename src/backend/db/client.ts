import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.js';

const DB_PATH = process.env.DB_PATH ?? './todos.db';

export function createDb(dbPath: string = DB_PATH) {
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}

export function createDbWithMigrations(dbPath: string = DB_PATH) {
  const { db, sqlite } = createDb(dbPath);
  try {
    migrate(db, { migrationsFolder: './src/backend/db/migrations' });
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
  return { db, sqlite };
}
