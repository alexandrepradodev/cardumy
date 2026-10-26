import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { asUser, makeHttpKit } from '../support/http-test-kit.js';
import { START } from '../support/study-test-kit.js';

describe('deck routes', () => {
  let kit: ReturnType<typeof makeHttpKit>;

  beforeEach(() => {
    kit = makeHttpKit();
  });

  afterEach(async () => {
    await kit.app.close();
  });

  async function createDeck(name: string, user = 'alexandre') {
    const response = await kit.app.inject({
      method: 'POST',
      url: '/decks',
      headers: asUser(user),
      payload: { name },
    });
    return response.json<{ id: string }>();
  }

  describe('POST /decks', () => {
    it('creates a deck and answers 201 with it', async () => {
      const response = await kit.app.inject({
        method: 'POST',
        url: '/decks',
        headers: asUser('alexandre'),
        payload: { name: ' English ' },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual({
        id: 'id-1',
        name: 'English',
        createdAt: START.toISOString(),
      });
    });

    it('answers 400 when the body has no name', async () => {
      const response = await kit.app.inject({
        method: 'POST',
        url: '/decks',
        headers: asUser('alexandre'),
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ code: 'VALIDATION_FAILED' });
    });

    it('answers 400 when the name breaks a business rule', async () => {
      const response = await kit.app.inject({
        method: 'POST',
        url: '/decks',
        headers: asUser('alexandre'),
        payload: { name: '   ' },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ code: 'InvalidDeckNameError' });
    });

    it('answers 401 without a user', async () => {
      const response = await kit.app.inject({
        method: 'POST',
        url: '/decks',
        payload: { name: 'English' },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /decks', () => {
    it('lists only the decks of the user', async () => {
      await createDeck('English');
      await createDeck('Not mine', 'someone-else');

      const response = await kit.app.inject({
        method: 'GET',
        url: '/decks',
        headers: asUser('alexandre'),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json<{ name: string }[]>().map((deck) => deck.name)).toEqual(['English']);
    });
  });

  describe('GET /decks/:deckId', () => {
    it('returns the deck', async () => {
      const { id } = await createDeck('English');

      const response = await kit.app.inject({
        method: 'GET',
        url: `/decks/${id}`,
        headers: asUser('alexandre'),
      });

      expect(response.json()).toMatchObject({ id, name: 'English' });
    });

    it('answers 404 for a deck of someone else', async () => {
      const { id } = await createDeck('English');

      const response = await kit.app.inject({
        method: 'GET',
        url: `/decks/${id}`,
        headers: asUser('intruder'),
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({ code: 'DeckNotFoundError' });
    });
  });

  describe('PATCH /decks/:deckId', () => {
    it('renames the deck', async () => {
      const { id } = await createDeck('English');

      const response = await kit.app.inject({
        method: 'PATCH',
        url: `/decks/${id}`,
        headers: asUser('alexandre'),
        payload: { name: 'English verbs' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ id, name: 'English verbs' });
    });
  });

  describe('DELETE /decks/:deckId', () => {
    it('deletes the deck and answers 204 with no body', async () => {
      const { id } = await createDeck('English');

      const response = await kit.app.inject({
        method: 'DELETE',
        url: `/decks/${id}`,
        headers: asUser('alexandre'),
      });
      const after = await kit.app.inject({
        method: 'GET',
        url: `/decks/${id}`,
        headers: asUser('alexandre'),
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
      expect(after.statusCode).toBe(404);
    });
  });
});
