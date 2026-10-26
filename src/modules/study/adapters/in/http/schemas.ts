import { Type, type Static } from 'typebox';

import type { CardView, DeckView } from '../../../application/views.js';
import { RATINGS } from '../../../domain/rating.js';

// HTTP schemas check the FORMAT of a request (is `name` a string?).
// Business rules (a name cannot be empty) stay in the domain, in DeckName.
// The same schemas feed validation, TypeScript types and the Swagger docs.

export const DeckParams = Type.Object({
  deckId: Type.String({ description: 'Deck id' }),
});

export const DeckBody = Type.Object({
  name: Type.String({ description: 'Deck name, 1 to 100 characters', examples: ['English verbs'] }),
});

export const DeckResponse = Type.Object({
  id: Type.String(),
  name: Type.String(),
  createdAt: Type.String({ format: 'date-time' }),
});

export type DeckResponse = Static<typeof DeckResponse>;

export function toDeckResponse(deck: DeckView): DeckResponse {
  return { ...deck, createdAt: deck.createdAt.toISOString() };
}

export const CardParams = Type.Object({
  cardId: Type.String({ description: 'Card id' }),
});

export const CardBody = Type.Object({
  front: Type.String({ description: 'Question side, 1 to 2000 characters', examples: ['to be'] }),
  back: Type.String({
    description: 'Answer side, 1 to 2000 characters',
    examples: ['ser / estar'],
  }),
});

export const ReviewBody = Type.Object({
  rating: Type.Enum([...RATINGS], {
    description: 'How well you remembered: again (forgot), hard, good or easy',
  }),
});

// Pagination limits are an HTTP concern, so they live in the schema.
export const DueCardsQuery = Type.Object({
  limit: Type.Optional(
    Type.Integer({ minimum: 1, maximum: 100, default: 20, description: 'Max cards to return' }),
  ),
});

export const CardResponse = Type.Object({
  id: Type.String(),
  deckId: Type.String(),
  front: Type.String(),
  back: Type.String(),
  dueAt: Type.String({ format: 'date-time', description: 'When the card should be reviewed' }),
  reviewCount: Type.Integer(),
});

export type CardResponse = Static<typeof CardResponse>;

export function toCardResponse(card: CardView): CardResponse {
  return { ...card, dueAt: card.dueAt.toISOString() };
}
