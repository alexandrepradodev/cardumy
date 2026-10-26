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
  ) {}

  async execute(input: DeleteCardInput): Promise<void> {
    const card = await findOwnedCard(this.decks, this.cards, input.cardId, input.userId);
    await this.cards.delete(card.id);
  }
}
