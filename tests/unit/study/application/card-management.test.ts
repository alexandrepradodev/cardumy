import { describe, expect, it } from 'vitest';

import { CardNotFoundError } from '../../../../src/modules/study/application/errors.js';
import { InvalidCardTextError } from '../../../../src/modules/study/domain/errors.js';
import { makeStudyKit } from '../../../support/study-test-kit.js';

async function kitWithDeck() {
  const kit = makeStudyKit();
  const { id: deckId } = await kit.createDeck.execute({ ownerId: 'user-1', name: 'English' });
  return { ...kit, deckId };
}

describe('ListCards', () => {
  it('lists every card of the deck, due or not', async () => {
    const { addCard, reviewCard, listCards, deckId } = await kitWithDeck();
    const first = await addCard.execute({ userId: 'user-1', deckId, front: 'a', back: 'a' });
    const second = await addCard.execute({ userId: 'user-1', deckId, front: 'b', back: 'b' });
    await reviewCard.execute({ userId: 'user-1', cardId: first.id, rating: 'good' });

    const cards = await listCards.execute({ userId: 'user-1', deckId });

    expect(cards.map((card) => card.id)).toEqual([first.id, second.id]);
    expect(cards[0]?.reviewCount).toBe(1);
  });
});

describe('EditCard', () => {
  it('changes front and back and keeps the review history', async () => {
    const { addCard, reviewCard, editCard, deckId } = await kitWithDeck();
    const card = await addCard.execute({ userId: 'user-1', deckId, front: 'a', back: 'b' });
    await reviewCard.execute({ userId: 'user-1', cardId: card.id, rating: 'good' });

    const edited = await editCard.execute({
      userId: 'user-1',
      cardId: card.id,
      front: 'to be',
      back: 'ser',
    });

    expect(edited).toMatchObject({ id: card.id, front: 'to be', back: 'ser', reviewCount: 1 });
  });

  it('rejects an empty side', async () => {
    const { addCard, editCard, deckId } = await kitWithDeck();
    const card = await addCard.execute({ userId: 'user-1', deckId, front: 'a', back: 'b' });

    await expect(
      editCard.execute({ userId: 'user-1', cardId: card.id, front: '', back: 'b' }),
    ).rejects.toThrow(InvalidCardTextError);
  });

  it('fails as not found for a card of someone else', async () => {
    const { addCard, editCard, deckId } = await kitWithDeck();
    const card = await addCard.execute({ userId: 'user-1', deckId, front: 'a', back: 'b' });

    await expect(
      editCard.execute({ userId: 'intruder', cardId: card.id, front: 'x', back: 'y' }),
    ).rejects.toThrow(CardNotFoundError);
  });
});

describe('DeleteCard', () => {
  it('removes only that card', async () => {
    const { addCard, deleteCard, cards, deckId } = await kitWithDeck();
    const kept = await addCard.execute({ userId: 'user-1', deckId, front: 'a', back: 'a' });
    const removed = await addCard.execute({ userId: 'user-1', deckId, front: 'b', back: 'b' });

    await deleteCard.execute({ userId: 'user-1', cardId: removed.id });

    expect(await cards.findById(removed.id)).toBeNull();
    expect(await cards.findById(kept.id)).not.toBeNull();
  });

  it('fails as not found for a card of someone else', async () => {
    const { addCard, deleteCard, deckId } = await kitWithDeck();
    const card = await addCard.execute({ userId: 'user-1', deckId, front: 'a', back: 'b' });

    await expect(deleteCard.execute({ userId: 'intruder', cardId: card.id })).rejects.toThrow(
      CardNotFoundError,
    );
  });
});
