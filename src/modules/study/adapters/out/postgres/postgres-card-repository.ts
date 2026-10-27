import { and, asc, eq, lte } from 'drizzle-orm';

import { type DbExecutor, isUuid } from '../../../../../shared/postgres.js';
import type { CardRepository } from '../../../application/ports/card-repository.js';
import type { Card } from '../../../domain/card.js';
import { toCard, toCardRow } from './mappers.js';
import { cards } from './schema.js';

export class PostgresCardRepository implements CardRepository {
  constructor(private readonly db: DbExecutor) {}

  async save(card: Card): Promise<void> {
    const { id, deckId, createdAt, ...changes } = toCardRow(card);
    // Upsert: everything but the identity and creation date can change
    // (an edit changes the text, a review changes the schedule).
    await this.db
      .insert(cards)
      .values({ id, deckId, createdAt, ...changes })
      .onConflictDoUpdate({ target: cards.id, set: changes });
  }

  async findById(id: string): Promise<Card | null> {
    if (!isUuid(id)) {
      return null;
    }
    const [row] = await this.db.select().from(cards).where(eq(cards.id, id));
    return row ? toCard(row) : null;
  }

  async findByDeck(deckId: string): Promise<Card[]> {
    if (!isUuid(deckId)) {
      return [];
    }
    const rows = await this.db
      .select()
      .from(cards)
      .where(eq(cards.deckId, deckId))
      .orderBy(asc(cards.createdAt));
    return rows.map(toCard);
  }

  // The database does the filtering, ordering and limiting, using the
  // (deck_id, due_at) index: it never loads cards that are not due.
  async findDueByDeck(deckId: string, now: Date, limit: number): Promise<Card[]> {
    if (!isUuid(deckId)) {
      return [];
    }
    const rows = await this.db
      .select()
      .from(cards)
      .where(and(eq(cards.deckId, deckId), lte(cards.dueAt, now)))
      .orderBy(asc(cards.dueAt))
      .limit(limit);
    return rows.map(toCard);
  }

  async delete(id: string): Promise<void> {
    if (isUuid(id)) {
      await this.db.delete(cards).where(eq(cards.id, id));
    }
  }

  async deleteByDeck(deckId: string): Promise<void> {
    if (isUuid(deckId)) {
      await this.db.delete(cards).where(eq(cards.deckId, deckId));
    }
  }
}
