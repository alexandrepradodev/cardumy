import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { asUser, makeHttpKit, tokenFor } from '../support/http-test-kit.js';

// Any protected route works; GET /decks is the simplest.
describe('authentication on protected routes (Bearer JWT)', () => {
  let kit: ReturnType<typeof makeHttpKit>;

  beforeEach(() => {
    kit = makeHttpKit();
  });

  afterEach(async () => {
    await kit.app.close();
  });

  function listDecks(headers: Record<string, string>) {
    return kit.app.inject({ method: 'GET', url: '/decks', headers });
  }

  it('lets a request with a valid token through, as that user', async () => {
    await kit.app.inject({
      method: 'POST',
      url: '/decks',
      headers: asUser('user-a'),
      payload: { name: 'Mine' },
    });

    const mine = await listDecks(asUser('user-a'));
    const someoneElse = await listDecks(asUser('user-b'));

    expect(mine.statusCode).toBe(200);
    expect(mine.json()).toHaveLength(1);
    expect(someoneElse.json()).toEqual([]);
  });

  it.each([
    ['no token at all', {}, 'MissingTokenError'],
    [
      'an expired token',
      { authorization: `Bearer ${tokenFor('user-a', { expiresInSeconds: -60 })}` },
      'ExpiredTokenError',
    ],
    [
      'a token signed with another secret',
      {
        authorization: `Bearer ${tokenFor('user-a', { secret: 'someone-elses-secret-with-32-chars' })}`,
      },
      'InvalidTokenError',
    ],
    ['a malformed token', { authorization: 'Bearer not-a-jwt' }, 'InvalidTokenError'],
    ['the old x-user-id header', { 'x-user-id': 'user-a' }, 'MissingTokenError'],
  ])('answers 401 for %s', async (_case, headers, code) => {
    const response = await listDecks(headers);

    expect(response.statusCode).toBe(401);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toMatchObject({ status: 401, code });
  });

  it('refuses a token whose content was edited to impersonate another user', async () => {
    const [header, , signature] = tokenFor('user-a').split('.');
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: 'user-b', exp: Math.floor(Date.now() / 1000) + 3600 }),
    ).toString('base64url');

    const response = await listDecks({
      authorization: `Bearer ${String(header)}.${forgedPayload}.${String(signature)}`,
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'InvalidTokenError' });
  });
});
