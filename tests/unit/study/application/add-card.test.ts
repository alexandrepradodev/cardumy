import { describe, expect, it } from 'vitest';

import { DeckNotFoundError } from '../../../../src/modules/study/application/errors.js';
import { InvalidCardTextError } from '../../../../src/modules/study/domain/errors.js';
import { makeStudyKit } from '../../../support/study-test-kit.js';

describe('AddCard', () => {
  it('adds a card to a deck of the user', async () => {
    const { createDeck, addCard, cards } = makeStudyKit();
    const { deckId } = await createDeck.execute({ ownerId: 'user-1', name: 'English' });

    const { cardId } = await addCard.execute({
      userId: 'user-1',
      deckId,
      front: 'to be',
      back: 'ser / estar',
    });

    const card = await cards.findById(cardId);
    expect(card?.deckId).toBe(deckId);
    expect(card?.front.value).toBe('to be');
  });

  it('fails when the deck does not exist', async () => {
    const { addCard } = makeStudyKit();

    await expect(
      addCard.execute({ userId: 'user-1', deckId: 'nope', front: 'a', back: 'b' }),
    ).rejects.toThrow(DeckNotFoundError);
  });

  it('fails as not found when the deck belongs to someone else', async () => {
    const { createDeck, addCard } = makeStudyKit();
    const { deckId } = await createDeck.execute({ ownerId: 'user-1', name: 'English' });

    await expect(
      addCard.execute({ userId: 'intruder', deckId, front: 'a', back: 'b' }),
    ).rejects.toThrow(DeckNotFoundError);
  });

  it('rejects an empty side', async () => {
    const { createDeck, addCard } = makeStudyKit();
    const { deckId } = await createDeck.execute({ ownerId: 'user-1', name: 'English' });

    await expect(
      addCard.execute({ userId: 'user-1', deckId, front: '  ', back: 'b' }),
    ).rejects.toThrow(InvalidCardTextError);
  });
});
