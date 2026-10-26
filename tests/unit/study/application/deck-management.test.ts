import { describe, expect, it } from 'vitest';

import { DeckNotFoundError } from '../../../../src/modules/study/application/errors.js';
import { InvalidDeckNameError } from '../../../../src/modules/study/domain/errors.js';
import { makeStudyKit, START } from '../../../support/study-test-kit.js';

describe('ListDecks', () => {
  it('lists only the decks of the user, oldest first', async () => {
    const { createDeck, listDecks, clock } = makeStudyKit();
    const first = await createDeck.execute({ ownerId: 'user-1', name: 'English' });
    await createDeck.execute({ ownerId: 'user-2', name: 'Not mine' });
    clock.advanceDays(1);
    const second = await createDeck.execute({ ownerId: 'user-1', name: 'Math' });

    const decks = await listDecks.execute({ userId: 'user-1' });

    expect(decks.map((deck) => deck.id)).toEqual([first.id, second.id]);
  });
});

describe('GetDeck', () => {
  it('returns a deck of the user', async () => {
    const { createDeck, getDeck } = makeStudyKit();
    const { id } = await createDeck.execute({ ownerId: 'user-1', name: 'English' });

    expect(await getDeck.execute({ userId: 'user-1', deckId: id })).toEqual({
      id,
      name: 'English',
      createdAt: START,
    });
  });

  it('fails as not found for a deck of someone else', async () => {
    const { createDeck, getDeck } = makeStudyKit();
    const { id } = await createDeck.execute({ ownerId: 'user-1', name: 'English' });

    await expect(getDeck.execute({ userId: 'intruder', deckId: id })).rejects.toThrow(
      DeckNotFoundError,
    );
  });
});

describe('RenameDeck', () => {
  it('renames and saves the deck', async () => {
    const { createDeck, renameDeck, getDeck } = makeStudyKit();
    const { id } = await createDeck.execute({ ownerId: 'user-1', name: 'English' });

    const renamed = await renameDeck.execute({ userId: 'user-1', deckId: id, name: 'Verbs' });

    expect(renamed.name).toBe('Verbs');
    expect((await getDeck.execute({ userId: 'user-1', deckId: id })).name).toBe('Verbs');
  });

  it('rejects an invalid name', async () => {
    const { createDeck, renameDeck } = makeStudyKit();
    const { id } = await createDeck.execute({ ownerId: 'user-1', name: 'English' });

    await expect(renameDeck.execute({ userId: 'user-1', deckId: id, name: '' })).rejects.toThrow(
      InvalidDeckNameError,
    );
  });
});

describe('DeleteDeck', () => {
  it('removes the deck and its cards', async () => {
    const { createDeck, addCard, deleteDeck, decks, cards } = makeStudyKit();
    const { id: deckId } = await createDeck.execute({ ownerId: 'user-1', name: 'English' });
    const card = await addCard.execute({ userId: 'user-1', deckId, front: 'a', back: 'b' });

    await deleteDeck.execute({ userId: 'user-1', deckId });

    expect(await decks.findById(deckId)).toBeNull();
    expect(await cards.findById(card.id)).toBeNull();
  });

  it('does not let someone else delete the deck', async () => {
    const { createDeck, deleteDeck, decks } = makeStudyKit();
    const { id } = await createDeck.execute({ ownerId: 'user-1', name: 'English' });

    await expect(deleteDeck.execute({ userId: 'intruder', deckId: id })).rejects.toThrow(
      DeckNotFoundError,
    );
    expect(await decks.findById(id)).not.toBeNull();
  });
});
