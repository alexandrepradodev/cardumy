import { describe, expect, it } from 'vitest';

import { InMemoryCardRepository } from '../../../../src/modules/study/adapters/out/in-memory/in-memory-card-repository.js';
import { InMemoryDeckRepository } from '../../../../src/modules/study/adapters/out/in-memory/in-memory-deck-repository.js';
import { CardText } from '../../../../src/modules/study/domain/card-text.js';
import { Card } from '../../../../src/modules/study/domain/card.js';
import { DeckName } from '../../../../src/modules/study/domain/deck-name.js';
import { Deck } from '../../../../src/modules/study/domain/deck.js';

const now = new Date('2026-10-23T10:00:00Z');

function makeCard(id: string, deckId = 'deck-1'): Card {
  return Card.create({
    id,
    deckId,
    front: CardText.create(`front ${id}`),
    back: CardText.create(`back ${id}`),
    now,
  });
}

describe('InMemoryDeckRepository', () => {
  it('finds a saved deck by id', async () => {
    const repository = new InMemoryDeckRepository();
    const deck = Deck.create({ id: 'deck-1', ownerId: 'user-1', name: DeckName.create('A'), now });

    await repository.save(deck);

    expect(await repository.findById('deck-1')).toBe(deck);
  });

  it('returns null for an unknown id', async () => {
    expect(await new InMemoryDeckRepository().findById('nope')).toBeNull();
  });
});

describe('InMemoryCardRepository', () => {
  it('finds a saved card by id', async () => {
    const repository = new InMemoryCardRepository();
    const card = makeCard('card-1');

    await repository.save(card);

    expect(await repository.findById('card-1')).toBe(card);
  });

  it('lists only due cards of the deck, most overdue first, up to the limit', async () => {
    const repository = new InMemoryCardRepository();
    const reviewed = makeCard('reviewed');
    reviewed.review('good', now);
    const otherDeck = makeCard('other', 'deck-2');
    const olderDue = makeCard('older');
    const newerDue = Card.create({
      id: 'newer',
      deckId: 'deck-1',
      front: CardText.create('f'),
      back: CardText.create('b'),
      now: new Date(now.getTime() + 1000),
    });
    for (const card of [newerDue, reviewed, otherDeck, olderDue]) {
      await repository.save(card);
    }
    const later = new Date(now.getTime() + 60_000);

    const due = await repository.findDueByDeck('deck-1', later, 10);
    const limited = await repository.findDueByDeck('deck-1', later, 1);

    expect(due.map((card) => card.id)).toEqual(['older', 'newer']);
    expect(limited.map((card) => card.id)).toEqual(['older']);
  });
});
