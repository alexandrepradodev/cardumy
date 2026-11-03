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
          exclude: ['tests/integration/postgres/**', 'tests/integration/storage/**'],
        },
      },
      {
        // Adapters against real Postgres and RustFS started by Testcontainers.
        extends: true,
        test: {
          name: 'containers',
          include: [
            'tests/integration/postgres/**/*.test.ts',
            'tests/integration/storage/**/*.test.ts',
          ],
          globalSetup: [
            'tests/support/postgres-global-setup.ts',
            'tests/support/storage-global-setup.ts',
          ],
          // Files share one database and one bucket, so they run one after the other.
          fileParallelism: false,
          // Pulling the images and starting them can take a while the first time.
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
