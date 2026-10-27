import { buildApp } from '../../src/infra/http/app.js';
import { makeStudyKit } from './study-test-kit.js';

// The real Fastify app wired to in-memory adapters and a frozen clock.
export function makeHttpKit() {
  const kit = makeStudyKit();
  const app = buildApp({ container: { study: kit, close: () => Promise.resolve() } });

  return { ...kit, app };
}

export function asUser(userId: string): { 'x-user-id': string } {
  return { 'x-user-id': userId };
}
