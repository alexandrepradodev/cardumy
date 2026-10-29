import { buildApp } from '../../src/infra/http/app.js';
import { makeAccountsKit } from './accounts-test-kit.js';
import { makeStudyKit } from './study-test-kit.js';

// Any 32+ characters work: tests sign and verify with the same secret.
export const TEST_JWT_SECRET = 'test-only-jwt-secret-with-32-chars!';

// The real Fastify app wired to in-memory adapters and a frozen clock.
export function makeHttpKit() {
  const study = makeStudyKit();
  const accounts = makeAccountsKit();
  const app = buildApp({
    container: { study, accounts, close: () => Promise.resolve() },
    jwtSecret: TEST_JWT_SECRET,
  });

  return { ...study, users: accounts.users, app };
}

export function asUser(userId: string): { 'x-user-id': string } {
  return { 'x-user-id': userId };
}
