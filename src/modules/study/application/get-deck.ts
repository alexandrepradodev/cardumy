import { findOwnedDeck } from './ownership.js';
import type { DeckRepository } from './ports/deck-repository.js';
import { type DeckView, toDeckView } from './views.js';

export interface GetDeckInput {
  userId: string;
  deckId: string;
}

export class GetDeck {
  constructor(private readonly decks: DeckRepository) {}

  async execute(input: GetDeckInput): Promise<DeckView> {
    return toDeckView(await findOwnedDeck(this.decks, input.deckId, input.userId));
  }
}
