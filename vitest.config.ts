import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // Each test starts from a clean slate: no mock leaks between tests.
    restoreMocks: true,
  },
});
