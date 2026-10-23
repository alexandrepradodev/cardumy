import { describe, expect, it } from 'vitest';

import { CardText } from '../../../../src/modules/study/domain/card-text.js';
import { Card } from '../../../../src/modules/study/domain/card.js';

const now = new Date('2026-10-23T10:00:00Z');

function makeCard(id = 'card-1'): Card {
  return Card.create({
    id,
    deckId: 'deck-1',
    front: CardText.create('to be'),
    back: CardText.create('ser / estar'),
    now,
  });
}

describe('Card', () => {
  it('is created inside a deck with front and back', () => {
    const card = makeCard();

    expect(card.deckId).toBe('deck-1');
    expect(card.front.value).toBe('to be');
    expect(card.back.value).toBe('ser / estar');
  });

  it('keeps its identity after being edited', () => {
    const card = makeCard();

    card.edit(CardText.create('to have'), CardText.create('ter'));

    expect(card.front.value).toBe('to have');
    expect(card.back.value).toBe('ter');
    expect(card.equals(makeCard())).toBe(true);
  });

  it('is different from a card with another id', () => {
    expect(makeCard('card-1').equals(makeCard('card-2'))).toBe(false);
  });
});

describe('Card review', () => {
  it('starts due right away', () => {
    expect(makeCard().isDue(now)).toBe(true);
  });

  it('is not due anymore after a good review, until its next date', () => {
    const card = makeCard();

    card.review('good', now);

    expect(card.isDue(now)).toBe(false);
    expect(card.isDue(card.schedule.dueAt)).toBe(true);
    expect(card.schedule.reviewCount).toBe(1);
  });
});
