import type { DeckRepository } from './ports/deck-repository.js';
import { type DeckView, toDeckView } from './views.js';

export interface ListDecksInput {
  userId: string;
}

export class ListDecks {
  constructor(private readonly decks: DeckRepository) {}

  async execute(input: ListDecksInput): Promise<DeckView[]> {
    const decks = await this.decks.findByOwner(input.userId);
    return decks.map(toDeckView);
  }
}
