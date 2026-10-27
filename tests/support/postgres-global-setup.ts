import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { TestProject } from 'vitest/node';

import { connectDatabase, runMigrations } from '../../src/infra/database.js';

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

// Runs once before the Postgres test project: starts a brand-new Postgres in
// Docker (same image as compose.yaml), applies the real migrations and hands
// the URL to the tests. The returned function throws the container away.
export default async function setup(project: TestProject) {
  const container = await new PostgreSqlContainer('postgres:18-alpine').start();
  const databaseUrl = container.getConnectionUri();

  const connection = connectDatabase(databaseUrl);
  await runMigrations(connection.db);
  await connection.close();

  project.provide('databaseUrl', databaseUrl);

  return async () => {
    await container.stop();
  };
}
