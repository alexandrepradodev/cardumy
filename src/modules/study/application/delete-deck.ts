import { findOwnedDeck } from './ownership.js';
import type { CardRepository } from './ports/card-repository.js';
import type { DeckRepository } from './ports/deck-repository.js';

export interface DeleteDeckInput {
  userId: string;
  deckId: string;
}

export class DeleteDeck {
  constructor(
    private readonly decks: DeckRepository,
    private readonly cards: CardRepository,
  ) {}

  async execute(input: DeleteDeckInput): Promise<void> {
    const deck = await findOwnedDeck(this.decks, input.deckId, input.userId);

    // Cards are separate aggregates, so the use case removes them too.
    // In stage 3 both deletes run inside one database transaction.
    await this.cards.deleteByDeck(deck.id);
    await this.decks.delete(deck.id);
  }
}
