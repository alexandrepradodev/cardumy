import type { Card } from '../../domain/card.js';

export interface CardRepository {
  save(card: Card): Promise<void>;
  findById(id: string): Promise<Card | null>;
  // All cards of a deck, oldest first.
  findByDeck(deckId: string): Promise<Card[]>;
  // Cards of a deck that are due at `now`, the most overdue first.
  findDueByDeck(deckId: string, now: Date, limit: number): Promise<Card[]>;
  delete(id: string): Promise<void>;
  deleteByDeck(deckId: string): Promise<void>;
}
