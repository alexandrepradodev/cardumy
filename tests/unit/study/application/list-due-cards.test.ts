import { describe, expect, it } from 'vitest';

import { DeckNotFoundError } from '../../../../src/modules/study/application/errors.js';
import { makeStudyKit, START } from '../../../support/study-test-kit.js';

describe('ListDueCards', () => {
  it('returns due cards as plain data', async () => {
    const { createDeck, addCard, listDueCards } = makeStudyKit();
    const { id: deckId } = await createDeck.execute({ ownerId: 'user-1', name: 'English' });
    const { id: cardId } = await addCard.execute({
      userId: 'user-1',
      deckId,
      front: 'to be',
      back: 'ser',
    });

    const due = await listDueCards.execute({ userId: 'user-1', deckId });

    expect(due).toEqual([
      { id: cardId, deckId, front: 'to be', back: 'ser', dueAt: START, reviewCount: 0 },
    ]);
  });

  it('respects the limit', async () => {
    const { createDeck, addCard, listDueCards } = makeStudyKit();
    const { id: deckId } = await createDeck.execute({ ownerId: 'user-1', name: 'English' });
    for (const word of ['a', 'b', 'c']) {
      await addCard.execute({ userId: 'user-1', deckId, front: word, back: word });
    }

    const due = await listDueCards.execute({ userId: 'user-1', deckId, limit: 2 });

    expect(due).toHaveLength(2);
  });

  it('fails as not found for a deck of someone else', async () => {
    const { createDeck, listDueCards } = makeStudyKit();
    const { id: deckId } = await createDeck.execute({ ownerId: 'user-1', name: 'English' });

    await expect(listDueCards.execute({ userId: 'intruder', deckId })).rejects.toThrow(
      DeckNotFoundError,
    );
  });
});
