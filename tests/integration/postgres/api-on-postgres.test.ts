import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, inject, it } from 'vitest';

import { createPostgresContainer } from '../../../src/infra/container.js';
import { connectDatabase } from '../../../src/infra/database.js';
import { buildApp } from '../../../src/infra/http/app.js';
import { asUser } from '../../support/http-test-kit.js';

// The real app, wired exactly like main-api.ts: HTTP + use cases + Postgres.
function startApi() {
  return buildApp({ container: createPostgresContainer(inject('databaseUrl')) });
}

beforeEach(async () => {
  const connection = connectDatabase(inject('databaseUrl'));
  await connection.db.execute(sql`TRUNCATE cards, decks`);
  await connection.close();
});

describe('the API on Postgres', () => {
  it('keeps decks, cards and reviews after the API restarts', async () => {
    const before = startApi();
    const deck = (
      await before.inject({
        method: 'POST',
        url: '/decks',
        headers: asUser('alexandre'),
        payload: { name: 'English' },
      })
    ).json<{ id: string }>();
    const card = (
      await before.inject({
        method: 'POST',
        url: `/decks/${deck.id}/cards`,
        headers: asUser('alexandre'),
        payload: { front: 'to be', back: 'ser' },
      })
    ).json<{ id: string }>();
    await before.inject({
      method: 'POST',
      url: `/cards/${card.id}/reviews`,
      headers: asUser('alexandre'),
      payload: { rating: 'good' },
    });
    await before.close();

    const after = startApi();
    const cards = await after.inject({
      method: 'GET',
      url: `/decks/${deck.id}/cards`,
      headers: asUser('alexandre'),
    });
    await after.close();

    expect(cards.json()).toEqual([
      expect.objectContaining({ id: card.id, front: 'to be', reviewCount: 1 }),
    ]);
  });

  it('answers 404, not 500, for an id that is not a uuid', async () => {
    const api = startApi();

    const response = await api.inject({
      method: 'GET',
      url: '/decks/not-a-uuid',
      headers: asUser('alexandre'),
    });
    await api.close();

    expect(response.statusCode).toBe(404);
  });
});
