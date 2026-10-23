import { describe, expect, it } from 'vitest';

import { DeckName } from '../../../../src/modules/study/domain/deck-name.js';
import { Deck } from '../../../../src/modules/study/domain/deck.js';

const now = new Date('2026-10-23T10:00:00Z');

function makeDeck(id = 'deck-1'): Deck {
  return Deck.create({ id, ownerId: 'user-1', name: DeckName.create('English'), now });
}

describe('Deck', () => {
  it('is created with its id, owner, name and creation date', () => {
    const deck = makeDeck();

    expect(deck.id).toBe('deck-1');
    expect(deck.ownerId).toBe('user-1');
    expect(deck.name.value).toBe('English');
    expect(deck.createdAt).toEqual(now);
  });

  it('keeps its identity after being renamed', () => {
    const deck = makeDeck();
    const before = makeDeck();

    deck.rename(DeckName.create('English verbs'));

    expect(deck.name.value).toBe('English verbs');
    expect(deck.equals(before)).toBe(true);
  });

  it('is different from a deck with another id, even with the same name', () => {
    expect(makeDeck('deck-1').equals(makeDeck('deck-2'))).toBe(false);
  });

  it('knows who owns it', () => {
    const deck = makeDeck();

    expect(deck.isOwnedBy('user-1')).toBe(true);
    expect(deck.isOwnedBy('user-2')).toBe(false);
  });
});
