import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Each test starts from a clean slate: no mock leaks between tests.
    restoreMocks: true,
    projects: [
      {
        // Unit and HTTP tests: in memory, no Docker, run in milliseconds.
        extends: true,
        test: {
          name: 'fast',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/integration/postgres/**'],
        },
      },
      {
        // Postgres adapters against a real database started by Testcontainers.
        extends: true,
        test: {
          name: 'postgres',
          include: ['tests/integration/postgres/**/*.test.ts'],
          globalSetup: ['tests/support/postgres-global-setup.ts'],
          // Files share one database, so they run one after the other.
          fileParallelism: false,
          // Pulling the image and starting Postgres can take a while the first time.
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
