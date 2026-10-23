import type { DeckRepository } from '../../../application/ports/deck-repository.js';
import type { Deck } from '../../../domain/deck.js';

// Adapter: keeps decks in a Map. Used by unit tests now; in stage 3 a
// Postgres adapter implements the same port and the use cases do not change.
export class InMemoryDeckRepository implements DeckRepository {
  private readonly decks = new Map<string, Deck>();

  save(deck: Deck): Promise<void> {
    this.decks.set(deck.id, deck);
    return Promise.resolve();
  }

  findById(id: string): Promise<Deck | null> {
    return Promise.resolve(this.decks.get(id) ?? null);
  }
}
