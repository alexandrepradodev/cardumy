import { describe, expect, it } from 'vitest';

import { makeStudyKit } from '../../../support/study-test-kit.js';

// The whole flow of the product, with no HTTP and no database:
// proof that the core works on its own.
describe('a study session', () => {
  it('brings each card back on the day its memory needs it', async () => {
    const { createDeck, addCard, reviewCard, listDueCards, clock } = makeStudyKit();
    const user = 'user-1';
    const { deckId } = await createDeck.execute({ ownerId: user, name: 'English verbs' });
    const toBe = await addCard.execute({ userId: user, deckId, front: 'to be', back: 'ser' });
    const toHave = await addCard.execute({ userId: user, deckId, front: 'to have', back: 'ter' });
    const dueIds = async () =>
      (await listDueCards.execute({ userId: user, deckId })).map((card) => card.id);

    // Day 0: both new cards are due. One is easy, the other is forgotten.
    expect(await dueIds()).toEqual([toBe.cardId, toHave.cardId]);
    await reviewCard.execute({ userId: user, cardId: toBe.cardId, rating: 'good' });
    await reviewCard.execute({ userId: user, cardId: toHave.cardId, rating: 'again' });
    expect(await dueIds()).toEqual([]);

    // 10 minutes later only the forgotten card is back.
    clock.advanceDays(10 / (24 * 60));
    expect(await dueIds()).toEqual([toHave.cardId]);
    await reviewCard.execute({ userId: user, cardId: toHave.cardId, rating: 'good' });

    // Day 1: the card that was forgotten comes back first (its memory is weak).
    clock.advanceDays(1);
    expect(await dueIds()).toEqual([toHave.cardId]);
    await reviewCard.execute({ userId: user, cardId: toHave.cardId, rating: 'good' });

    // Day 3: both are due. "to be" waited 3 days after one good review;
    // "to have" needed two extra reviews to reach the same point.
    clock.advanceDays(2);
    expect(await dueIds()).toEqual([toBe.cardId, toHave.cardId]);
  });
});
