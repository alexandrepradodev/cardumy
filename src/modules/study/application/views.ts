import type { Card } from '../domain/card.js';
import type { Deck } from '../domain/deck.js';

// Plain data, not entities: callers (HTTP, MCP...) get a read-only copy
// and can never call card.review() behind the use case's back.

export interface DeckView {
  id: string;
  name: string;
  createdAt: Date;
}

export interface CardView {
  id: string;
  deckId: string;
  front: string;
  back: string;
  dueAt: Date;
  reviewCount: number;
}

export function toDeckView(deck: Deck): DeckView {
  return { id: deck.id, name: deck.name.value, createdAt: deck.createdAt };
}

export function toCardView(card: Card): CardView {
  return {
    id: card.id,
    deckId: card.deckId,
    front: card.front.value,
    back: card.back.value,
    dueAt: card.schedule.dueAt,
    reviewCount: card.schedule.reviewCount,
  };
}
