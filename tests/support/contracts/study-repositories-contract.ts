import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import type { CardRepository } from '../../../src/modules/study/application/ports/card-repository.js';
import type { DeckRepository } from '../../../src/modules/study/application/ports/deck-repository.js';
import { CardText } from '../../../src/modules/study/domain/card-text.js';
import { Card } from '../../../src/modules/study/domain/card.js';
import { DeckName } from '../../../src/modules/study/domain/deck-name.js';
import { Deck } from '../../../src/modules/study/domain/deck.js';

export interface StudyRepositories {
  decks: DeckRepository;
  cards: CardRepository;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const T0 = new Date('2026-10-23T10:00:00.000Z');
const at = (days: number) => new Date(T0.getTime() + days * DAY_MS);

function makeDeck(ownerId = 'user-1', createdAt = T0, name = 'English'): Deck {
  return Deck.create({ id: randomUUID(), ownerId, name: DeckName.create(name), now: createdAt });
}

function makeCard(deckId: string, front = 'to be', createdAt = T0): Card {
  return Card.create({
    id: randomUUID(),
    deckId,
    front: CardText.create(front),
    back: CardText.create('ser'),
    now: createdAt,
  });
}

// Contract test: the SAME expectations run against every adapter of the
// repository ports. If memory and Postgres both pass, they are interchangeable.
export function studyRepositoriesContract(
  adapterName: string,
  makeRepositories: () => Promise<StudyRepositories>,
): void {
  describe(`${adapterName} study repositories (contract)`, () => {
    let decks: DeckRepository;
    let cards: CardRepository;

    beforeEach(async () => {
      ({ decks, cards } = await makeRepositories());
    });

    async function savedDeck(...args: Parameters<typeof makeDeck>): Promise<Deck> {
      const deck = makeDeck(...args);
      await decks.save(deck);
      return deck;
    }

    describe('decks', () => {
      it('finds a saved deck with the same data', async () => {
        const deck = await savedDeck();

        const found = await decks.findById(deck.id);

        expect(found?.id).toBe(deck.id);
        expect(found?.ownerId).toBe('user-1');
        expect(found?.name.value).toBe('English');
        expect(found?.createdAt).toEqual(T0);
      });

      it('saving again updates the deck (rename)', async () => {
        const deck = await savedDeck();
        deck.rename(DeckName.create('English verbs'));

        await decks.save(deck);

        expect((await decks.findById(deck.id))?.name.value).toBe('English verbs');
      });

      it('returns null for an unknown or malformed id', async () => {
        expect(await decks.findById(randomUUID())).toBeNull();
        expect(await decks.findById('not-a-uuid')).toBeNull();
      });

      it('lists only the decks of the owner, oldest first', async () => {
        const newer = await savedDeck('user-1', at(1), 'Newer');
        const older = await savedDeck('user-1', at(0), 'Older');
        await savedDeck('user-2');

        const owned = await decks.findByOwner('user-1');

        expect(owned.map((deck) => deck.id)).toEqual([older.id, newer.id]);
      });

      it('deletes a deck', async () => {
        const deck = await savedDeck();

        await decks.delete(deck.id);

        expect(await decks.findById(deck.id)).toBeNull();
      });
    });

    describe('cards', () => {
      it('keeps the whole review schedule when saved and read back', async () => {
        const deck = await savedDeck();
        const card = makeCard(deck.id);
        card.review('good', T0);
        card.review('again', at(3));

        await cards.save(card);
        const found = await cards.findById(card.id);

        expect(found?.front.value).toBe('to be');
        expect(found?.schedule).toEqual(card.schedule);
      });

      it('saving again stores edits and new reviews', async () => {
        const deck = await savedDeck();
        const card = makeCard(deck.id);
        await cards.save(card);

        card.edit(CardText.create('to have'), CardText.create('ter'));
        card.review('easy', T0);
        await cards.save(card);
        const found = await cards.findById(card.id);

        expect(found?.front.value).toBe('to have');
        expect(found?.schedule.reviewCount).toBe(1);
      });

      it('lists the cards of a deck, oldest first', async () => {
        const deck = await savedDeck();
        const other = await savedDeck('user-1', T0, 'Other');
        const second = makeCard(deck.id, 'second', at(1));
        const first = makeCard(deck.id, 'first', at(0));
        for (const card of [second, first, makeCard(other.id)]) {
          await cards.save(card);
        }

        const inDeck = await cards.findByDeck(deck.id);

        expect(inDeck.map((card) => card.id)).toEqual([first.id, second.id]);
      });

      it('lists due cards of a deck, most overdue first, up to the limit', async () => {
        const deck = await savedDeck();
        const dueEarly = makeCard(deck.id, 'due early', at(-2));
        const dueLate = makeCard(deck.id, 'due late', at(-1));
        const notDue = makeCard(deck.id, 'not due', at(-1));
        notDue.review('good', at(-1));
        for (const card of [dueLate, notDue, dueEarly]) {
          await cards.save(card);
        }

        const due = await cards.findDueByDeck(deck.id, T0, 10);
        const limited = await cards.findDueByDeck(deck.id, T0, 1);

        expect(due.map((card) => card.id)).toEqual([dueEarly.id, dueLate.id]);
        expect(limited.map((card) => card.id)).toEqual([dueEarly.id]);
      });

      it('deletes one card, or every card of a deck', async () => {
        const deck = await savedDeck();
        const other = await savedDeck('user-1', T0, 'Other');
        const removed = makeCard(deck.id);
        const sibling = makeCard(deck.id);
        const elsewhere = makeCard(other.id);
        for (const card of [removed, sibling, elsewhere]) {
          await cards.save(card);
        }

        await cards.delete(removed.id);
        expect(await cards.findById(removed.id)).toBeNull();
        expect(await cards.findById(sibling.id)).not.toBeNull();

        await cards.deleteByDeck(deck.id);
        expect(await cards.findByDeck(deck.id)).toEqual([]);
        expect(await cards.findById(elsewhere.id)).not.toBeNull();
      });

      it('returns nothing for malformed ids', async () => {
        expect(await cards.findById('not-a-uuid')).toBeNull();
        expect(await cards.findByDeck('not-a-uuid')).toEqual([]);
        expect(await cards.findDueByDeck('not-a-uuid', T0, 10)).toEqual([]);
      });
    });
  });
}
