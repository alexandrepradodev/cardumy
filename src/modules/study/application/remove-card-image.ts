import type { FileStorage } from '../../../shared/ports/file-storage.js';
import type { CardPresenter } from './card-presenter.js';
import { findOwnedCard } from './ownership.js';
import type { CardRepository } from './ports/card-repository.js';
import type { DeckRepository } from './ports/deck-repository.js';
import type { CardView } from './views.js';

export interface RemoveCardImageInput {
  userId: string;
  cardId: string;
}

export class RemoveCardImage {
  constructor(
    private readonly decks: DeckRepository,
    private readonly cards: CardRepository,
    private readonly files: FileStorage,
    private readonly presenter: CardPresenter,
  ) {}

  async execute(input: RemoveCardImageInput): Promise<CardView> {
    const card = await findOwnedCard(this.decks, this.cards, input.cardId, input.userId);
    const previous = card.image;

    if (previous !== null) {
      card.removeImage();
      await this.cards.save(card);
      await this.files.delete(previous.key);
    }

    return this.presenter.present(card);
  }
}
