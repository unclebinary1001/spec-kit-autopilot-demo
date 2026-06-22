import { serve } from '@hono/node-server';
import { createDbWithMigrations } from './db/client.js';
import { createApp } from './app.js';

const PORT = Number(process.env.PORT ?? 3001);

const { db } = createDbWithMigrations();
const app = createApp(db);

console.log(`Backend server starting on port ${PORT}`);

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
