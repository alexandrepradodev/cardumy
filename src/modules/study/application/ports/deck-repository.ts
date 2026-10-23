import type { Deck } from '../../domain/deck.js';

// Port: what the use cases need to store decks. It says nothing about
// how. Postgres, memory or a file all fit, as long as they keep this promise.
// Methods return Promise because real storage (a database) is asynchronous.
export interface DeckRepository {
  save(deck: Deck): Promise<void>;
  findById(id: string): Promise<Deck | null>;
}
