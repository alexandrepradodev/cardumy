import { CardText } from '../../../domain/card-text.js';
import { Card } from '../../../domain/card.js';
import { DeckName } from '../../../domain/deck-name.js';
import { Deck } from '../../../domain/deck.js';
import { ReviewSchedule } from '../../../domain/review-schedule.js';
import type { cards, decks } from './schema.js';

// Translators between a table row (flat columns) and a domain object.
// The domain never sees a row; the database never sees an entity.

type DeckRow = typeof decks.$inferSelect;
type CardRow = typeof cards.$inferSelect;

export function toDeckRow(deck: Deck): DeckRow {
  return { id: deck.id, ownerId: deck.ownerId, name: deck.name.value, createdAt: deck.createdAt };
}

export function toDeck(row: DeckRow): Deck {
  return Deck.restore({
    id: row.id,
    ownerId: row.ownerId,
    name: DeckName.create(row.name),
    createdAt: row.createdAt,
  });
}

export function toCardRow(card: Card): CardRow {
  const { schedule } = card;
  return {
    id: card.id,
    deckId: card.deckId,
    front: card.front.value,
    back: card.back.value,
    createdAt: card.createdAt,
    stabilityDays: schedule.stabilityDays,
    difficulty: schedule.difficulty,
    dueAt: schedule.dueAt,
    lastReviewedAt: schedule.lastReviewedAt,
    reviewCount: schedule.reviewCount,
    lapseCount: schedule.lapseCount,
  };
}

export function toCard(row: CardRow): Card {
  return Card.restore({
    id: row.id,
    deckId: row.deckId,
    front: CardText.create(row.front),
    back: CardText.create(row.back),
    createdAt: row.createdAt,
    schedule: ReviewSchedule.restore({
      stabilityDays: row.stabilityDays,
      difficulty: row.difficulty,
      dueAt: row.dueAt,
      lastReviewedAt: row.lastReviewedAt,
      reviewCount: row.reviewCount,
      lapseCount: row.lapseCount,
    }),
  });
}
