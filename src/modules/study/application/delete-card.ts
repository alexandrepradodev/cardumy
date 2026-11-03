import type { FileStorage } from '../../../shared/ports/file-storage.js';
import { findOwnedCard } from './ownership.js';
import type { CardRepository } from './ports/card-repository.js';
import type { DeckRepository } from './ports/deck-repository.js';

export interface DeleteCardInput {
  userId: string;
  cardId: string;
}

export class DeleteCard {
  constructor(
    private readonly decks: DeckRepository,
    private readonly cards: CardRepository,
    private readonly files: FileStorage,
  ) {}

  async execute(input: DeleteCardInput): Promise<void> {
    const card = await findOwnedCard(this.decks, this.cards, input.cardId, input.userId);
    await this.cards.delete(card.id);
    // The file goes after the card: at worst an orphan file, never a card
    // pointing at a file that is gone.
    if (card.image !== null) {
      await this.files.delete(card.image.key);
    }
  }
}
