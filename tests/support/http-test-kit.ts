import { createHmac } from 'node:crypto';

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

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

// Builds an HS256 JWT by hand, to show there is no magic in it:
// base64url(header) + "." + base64url(payload) + "." + HMAC of both with the secret.
export function tokenFor(
  userId: string,
  { expiresInSeconds = 3600, secret = TEST_JWT_SECRET } = {},
): string {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url({
    sub: userId,
    iat: now,
    exp: now + expiresInSeconds,
  })}`;
  const signature = createHmac('sha256', secret).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

// Headers of a request made by this user, with a valid access token.
export function asUser(userId: string): { authorization: string } {
  return { authorization: `Bearer ${tokenFor(userId)}` };
}
