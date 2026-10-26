import { findOwnedDeck } from './ownership.js';
import type { CardRepository } from './ports/card-repository.js';
import type { DeckRepository } from './ports/deck-repository.js';
import { type CardView, toCardView } from './views.js';

export interface ListCardsInput {
  userId: string;
  deckId: string;
}

export class ListCards {
  constructor(
    private readonly decks: DeckRepository,
    private readonly cards: CardRepository,
  ) {}

  async execute(input: ListCardsInput): Promise<CardView[]> {
    const deck = await findOwnedDeck(this.decks, input.deckId, input.userId);
    const cards = await this.cards.findByDeck(deck.id);
    return cards.map(toCardView);
  }
}
