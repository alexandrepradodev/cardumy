import type { FileStorage } from '../../../shared/ports/file-storage.js';
import { findOwnedDeck } from './ownership.js';
import type { CardRepository } from './ports/card-repository.js';
import type { DeckRepository } from './ports/deck-repository.js';
import type { TransactionRunner } from './ports/transaction-runner.js';

export interface DeleteDeckInput {
  userId: string;
  deckId: string;
}

export class DeleteDeck {
  constructor(
    private readonly decks: DeckRepository,
    private readonly cards: CardRepository,
    private readonly transactions: TransactionRunner,
    private readonly files: FileStorage,
  ) {}

  async execute(input: DeleteDeckInput): Promise<void> {
    const deck = await findOwnedDeck(this.decks, input.deckId, input.userId);
    // Read before deleting: afterwards nothing says which files were theirs.
    const imageKeys = (await this.cards.findByDeck(deck.id)).flatMap((card) =>
      card.image === null ? [] : [card.image.key],
    );

    // Cards are separate aggregates, so removing them is an explicit step.
    // Both deletes happen together or not at all: never a deck half deleted.
    await this.transactions.run(async ({ decks, cards }) => {
      await cards.deleteByDeck(deck.id);
      await decks.delete(deck.id);
    });

    // Storage is not part of the database transaction, so files go after the
    // commit: a failure here leaves orphan files, never broken cards.
    await Promise.all(imageKeys.map((key) => this.files.delete(key)));
  }
}
