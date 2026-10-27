import { findOwnedDeck } from './ownership.js';
import type { DeckRepository } from './ports/deck-repository.js';
import type { TransactionRunner } from './ports/transaction-runner.js';

export interface DeleteDeckInput {
  userId: string;
  deckId: string;
}

export class DeleteDeck {
  constructor(
    private readonly decks: DeckRepository,
    private readonly transactions: TransactionRunner,
  ) {}

  async execute(input: DeleteDeckInput): Promise<void> {
    const deck = await findOwnedDeck(this.decks, input.deckId, input.userId);

    // Cards are separate aggregates, so removing them is an explicit step.
    // Both deletes happen together or not at all: never a deck half deleted.
    await this.transactions.run(async ({ decks, cards }) => {
      await cards.deleteByDeck(deck.id);
      await decks.delete(deck.id);
    });
  }
}
