import type { CardRepository } from '../../../application/ports/card-repository.js';
import type { Card } from '../../../domain/card.js';

export class InMemoryCardRepository implements CardRepository {
  private readonly cards = new Map<string, Card>();

  save(card: Card): Promise<void> {
    this.cards.set(card.id, card);
    return Promise.resolve();
  }

  findById(id: string): Promise<Card | null> {
    return Promise.resolve(this.cards.get(id) ?? null);
  }

  findDueByDeck(deckId: string, now: Date, limit: number): Promise<Card[]> {
    const due = [...this.cards.values()]
      .filter((card) => card.deckId === deckId && card.isDue(now))
      .sort((a, b) => a.schedule.dueAt.getTime() - b.schedule.dueAt.getTime())
      .slice(0, limit);

    return Promise.resolve(due);
  }
}
