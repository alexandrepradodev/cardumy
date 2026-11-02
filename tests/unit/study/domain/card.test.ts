import { describe, expect, it } from 'vitest';

import { CardImage } from '../../../../src/modules/study/domain/card-image.js';
import { CardText } from '../../../../src/modules/study/domain/card-text.js';
import { Card } from '../../../../src/modules/study/domain/card.js';
import { ImageOfAnotherCardError } from '../../../../src/modules/study/domain/errors.js';
import { ImageFile } from '../../../../src/modules/study/domain/image-file.js';
import { ReviewSchedule } from '../../../../src/modules/study/domain/review-schedule.js';

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

describe('Card.restore', () => {
  it('rebuilds a stored card with its review history, ready to be reviewed again', () => {
    const reviewed = makeCard();
    reviewed.review('good', now);

    const restored = Card.restore({
      id: reviewed.id,
      deckId: reviewed.deckId,
      front: reviewed.front,
      back: reviewed.back,
      schedule: ReviewSchedule.restore({
        stabilityDays: reviewed.schedule.stabilityDays,
        difficulty: reviewed.schedule.difficulty,
        dueAt: reviewed.schedule.dueAt,
        lastReviewedAt: reviewed.schedule.lastReviewedAt,
        reviewCount: reviewed.schedule.reviewCount,
        lapseCount: reviewed.schedule.lapseCount,
      }),
      createdAt: reviewed.createdAt,
    });
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    restored.review('good', threeDaysLater);

    expect(restored.schedule.reviewCount).toBe(2);
    expect(restored.schedule.stabilityDays).toBeGreaterThan(reviewed.schedule.stabilityDays);
  });
});

describe('Card image', () => {
  const png = ImageFile.create({ contentType: 'image/png', sizeBytes: 1024 });

  it('starts without an image', () => {
    expect(makeCard().image).toBeNull();
  });

  it('attaches an image uploaded for this card, replacing the previous one', () => {
    const card = makeCard('card-1');

    card.attachImage(CardImage.forCard('card-1', 'img-1', png));
    card.attachImage(CardImage.forCard('card-1', 'img-2', png));

    expect(card.image?.key).toBe('cards/card-1/img-2.png');
  });

  it('refuses an image uploaded for another card and keeps the current one', () => {
    const card = makeCard('card-1');
    card.attachImage(CardImage.forCard('card-1', 'img-1', png));

    expect(() => {
      card.attachImage(CardImage.forCard('card-2', 'img-9', png));
    }).toThrow(ImageOfAnotherCardError);
    expect(card.image?.key).toBe('cards/card-1/img-1.png');
  });

  it('removes its image', () => {
    const card = makeCard('card-1');
    card.attachImage(CardImage.forCard('card-1', 'img-1', png));

    card.removeImage();

    expect(card.image).toBeNull();
  });

  it('is restored with the image it had', () => {
    const original = makeCard('card-1');

    const restored = Card.restore({
      id: original.id,
      deckId: original.deckId,
      front: original.front,
      back: original.back,
      schedule: original.schedule,
      createdAt: original.createdAt,
      image: CardImage.restore('cards/card-1/img-1.png'),
    });

    expect(restored.image?.key).toBe('cards/card-1/img-1.png');
  });
});
