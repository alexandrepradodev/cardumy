import { Type, type Static } from 'typebox';

import type { DeckView } from '../../../application/views.js';

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
