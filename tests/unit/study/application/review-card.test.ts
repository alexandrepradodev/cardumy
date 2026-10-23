import { describe, expect, it } from 'vitest';

import { CardNotFoundError } from '../../../../src/modules/study/application/errors.js';
import { InvalidRatingError } from '../../../../src/modules/study/domain/errors.js';
import { makeStudyKit, START } from '../../../support/study-test-kit.js';

const DAY_MS = 24 * 60 * 60 * 1000;

async function kitWithCard() {
  const kit = makeStudyKit();
  const { deckId } = await kit.createDeck.execute({ ownerId: 'user-1', name: 'English' });
  const { cardId } = await kit.addCard.execute({ userId: 'user-1', deckId, front: 'a', back: 'b' });
  return { ...kit, cardId };
}

describe('ReviewCard', () => {
  it('schedules the next review and saves the card', async () => {
    const { reviewCard, cards, cardId } = await kitWithCard();

    const { nextReviewAt } = await reviewCard.execute({ userId: 'user-1', cardId, rating: 'good' });

    expect(nextReviewAt).toEqual(new Date(START.getTime() + 3 * DAY_MS));
    expect((await cards.findById(cardId))?.schedule.reviewCount).toBe(1);
  });

  it('rejects an unknown rating', async () => {
    const { reviewCard, cardId } = await kitWithCard();

    await expect(
      reviewCard.execute({ userId: 'user-1', cardId, rating: 'perfect' }),
    ).rejects.toThrow(InvalidRatingError);
  });

  it('fails when the card does not exist', async () => {
    const { reviewCard } = await kitWithCard();

    await expect(
      reviewCard.execute({ userId: 'user-1', cardId: 'nope', rating: 'good' }),
    ).rejects.toThrow(CardNotFoundError);
  });

  it('fails as not found when the card is in a deck of someone else', async () => {
    const { reviewCard, cardId } = await kitWithCard();

    await expect(
      reviewCard.execute({ userId: 'intruder', cardId, rating: 'good' }),
    ).rejects.toThrow(CardNotFoundError);
  });
});
