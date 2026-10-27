import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

import type { Database } from '../shared/postgres.js';

export interface DatabaseConnection {
  db: Database;
  close(): Promise<void>;
}

// One connection pool per process: opening a connection is slow, so the pool
// keeps a few open and lends them to each query.
export function connectDatabase(url: string): DatabaseConnection {
  const pool = new pg.Pool({ connectionString: url });
  return { db: drizzle({ client: pool }), close: () => pool.end() };
}

export async function runMigrations(db: Database): Promise<void> {
  await migrate(db, { migrationsFolder: 'migrations' });
}
