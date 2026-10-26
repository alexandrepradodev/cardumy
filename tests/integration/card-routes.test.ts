import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { asUser, makeHttpKit } from '../support/http-test-kit.js';
import { START } from '../support/study-test-kit.js';

const DAY_MS = 24 * 60 * 60 * 1000;

interface CardJson {
  id: string;
  deckId: string;
  front: string;
  back: string;
  dueAt: string;
  reviewCount: number;
}

describe('card routes', () => {
  let kit: ReturnType<typeof makeHttpKit>;
  let deckId: string;

  beforeEach(async () => {
    kit = makeHttpKit();
    const response = await kit.app.inject({
      method: 'POST',
      url: '/decks',
      headers: asUser('alexandre'),
      payload: { name: 'English' },
    });
    deckId = response.json<{ id: string }>().id;
  });

  afterEach(async () => {
    await kit.app.close();
  });

  async function addCard(front: string, back = 'answer'): Promise<CardJson> {
    const response = await kit.app.inject({
      method: 'POST',
      url: `/decks/${deckId}/cards`,
      headers: asUser('alexandre'),
      payload: { front, back },
    });
    return response.json<CardJson>();
  }

  function review(cardId: string, rating: string, user = 'alexandre') {
    return kit.app.inject({
      method: 'POST',
      url: `/cards/${cardId}/reviews`,
      headers: asUser(user),
      payload: { rating },
    });
  }

  describe('POST /decks/:deckId/cards', () => {
    it('adds a card due right away', async () => {
      const response = await kit.app.inject({
        method: 'POST',
        url: `/decks/${deckId}/cards`,
        headers: asUser('alexandre'),
        payload: { front: 'to be', back: 'ser / estar' },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual({
        id: 'id-2',
        deckId,
        front: 'to be',
        back: 'ser / estar',
        dueAt: START.toISOString(),
        reviewCount: 0,
      });
    });

    it('answers 404 for a deck of someone else', async () => {
      const response = await kit.app.inject({
        method: 'POST',
        url: `/decks/${deckId}/cards`,
        headers: asUser('intruder'),
        payload: { front: 'a', back: 'b' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /decks/:deckId/cards', () => {
    it('lists every card of the deck', async () => {
      await addCard('a');
      await addCard('b');

      const response = await kit.app.inject({
        method: 'GET',
        url: `/decks/${deckId}/cards`,
        headers: asUser('alexandre'),
      });

      expect(response.json<CardJson[]>().map((card) => card.front)).toEqual(['a', 'b']);
    });
  });

  describe('POST /cards/:cardId/reviews', () => {
    it('schedules the next review', async () => {
      const card = await addCard('to be');

      const response = await review(card.id, 'good');

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        id: card.id,
        reviewCount: 1,
        dueAt: new Date(START.getTime() + 3 * DAY_MS).toISOString(),
      });
    });

    it('answers 400 for a rating outside the allowed list', async () => {
      const card = await addCard('to be');

      const response = await review(card.id, 'perfect');

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ code: 'VALIDATION_FAILED' });
    });

    it('answers 404 for a card of someone else', async () => {
      const card = await addCard('to be');

      const response = await review(card.id, 'good', 'intruder');

      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({ code: 'CardNotFoundError' });
    });
  });

  describe('GET /decks/:deckId/cards/due', () => {
    it('lists only cards due now, respecting the limit', async () => {
      const reviewed = await addCard('reviewed');
      await addCard('due 1');
      await addCard('due 2');
      await review(reviewed.id, 'good');

      const all = await kit.app.inject({
        method: 'GET',
        url: `/decks/${deckId}/cards/due`,
        headers: asUser('alexandre'),
      });
      const limited = await kit.app.inject({
        method: 'GET',
        url: `/decks/${deckId}/cards/due?limit=1`,
        headers: asUser('alexandre'),
      });

      expect(all.json<CardJson[]>().map((card) => card.front)).toEqual(['due 1', 'due 2']);
      expect(limited.json<CardJson[]>()).toHaveLength(1);
    });

    it('brings a reviewed card back when its day comes', async () => {
      const card = await addCard('to be');
      await review(card.id, 'good');

      kit.clock.advanceDays(3);
      const response = await kit.app.inject({
        method: 'GET',
        url: `/decks/${deckId}/cards/due`,
        headers: asUser('alexandre'),
      });

      expect(response.json<CardJson[]>().map((due) => due.id)).toEqual([card.id]);
    });

    it('answers 400 for a limit above 100', async () => {
      const response = await kit.app.inject({
        method: 'GET',
        url: `/decks/${deckId}/cards/due?limit=500`,
        headers: asUser('alexandre'),
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PATCH /cards/:cardId', () => {
    it('edits the card and keeps its history', async () => {
      const card = await addCard('to bee');
      await review(card.id, 'good');

      const response = await kit.app.inject({
        method: 'PATCH',
        url: `/cards/${card.id}`,
        headers: asUser('alexandre'),
        payload: { front: 'to be', back: 'ser' },
      });

      expect(response.json()).toMatchObject({ front: 'to be', back: 'ser', reviewCount: 1 });
    });
  });

  describe('DELETE /cards/:cardId', () => {
    it('deletes the card', async () => {
      const card = await addCard('to be');

      const response = await kit.app.inject({
        method: 'DELETE',
        url: `/cards/${card.id}`,
        headers: asUser('alexandre'),
      });
      const list = await kit.app.inject({
        method: 'GET',
        url: `/decks/${deckId}/cards`,
        headers: asUser('alexandre'),
      });

      expect(response.statusCode).toBe(204);
      expect(list.json()).toEqual([]);
    });
  });
});
