import { defineConfig } from 'drizzle-kit';

// Local default matches compose.yaml; CI and production set DATABASE_URL.
const LOCAL_DATABASE_URL = 'postgres://cardumy:cardumy@localhost:5433/cardumy';

export default defineConfig({
  dialect: 'postgresql',
  // Every module keeps its tables next to its own Postgres adapters.
  schema: './src/modules/*/adapters/out/postgres/schema.ts',
  out: './migrations',
  dbCredentials: { url: process.env.DATABASE_URL ?? LOCAL_DATABASE_URL },
});
