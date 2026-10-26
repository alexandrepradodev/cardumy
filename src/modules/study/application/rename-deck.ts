import { DeckName } from '../domain/deck-name.js';
import { findOwnedDeck } from './ownership.js';
import type { DeckRepository } from './ports/deck-repository.js';
import { type DeckView, toDeckView } from './views.js';

export interface RenameDeckInput {
  userId: string;
  deckId: string;
  name: string;
}

export class RenameDeck {
  constructor(private readonly decks: DeckRepository) {}

  async execute(input: RenameDeckInput): Promise<DeckView> {
    const deck = await findOwnedDeck(this.decks, input.deckId, input.userId);

    deck.rename(DeckName.create(input.name));
    await this.decks.save(deck);

    return toDeckView(deck);
  }
}
