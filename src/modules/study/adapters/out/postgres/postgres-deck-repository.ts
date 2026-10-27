import { asc, eq } from 'drizzle-orm';

import { type DbExecutor, isUuid } from '../../../../../shared/postgres.js';
import type { DeckRepository } from '../../../application/ports/deck-repository.js';
import type { Deck } from '../../../domain/deck.js';
import { toDeck, toDeckRow } from './mappers.js';
import { decks } from './schema.js';

// Adapter: the same DeckRepository port as the in-memory one, now backed by
// Postgres. Use cases cannot tell the difference.
export class PostgresDeckRepository implements DeckRepository {
  constructor(private readonly db: DbExecutor) {}

  async save(deck: Deck): Promise<void> {
    const row = toDeckRow(deck);
    // Upsert: insert a new deck, or update the existing one (a rename).
    await this.db
      .insert(decks)
      .values(row)
      .onConflictDoUpdate({ target: decks.id, set: { name: row.name } });
  }

  async findById(id: string): Promise<Deck | null> {
    if (!isUuid(id)) {
      return null;
    }
    const [row] = await this.db.select().from(decks).where(eq(decks.id, id));
    return row ? toDeck(row) : null;
  }

  async findByOwner(ownerId: string): Promise<Deck[]> {
    const rows = await this.db
      .select()
      .from(decks)
      .where(eq(decks.ownerId, ownerId))
      .orderBy(asc(decks.createdAt));
    return rows.map(toDeck);
  }

  async delete(id: string): Promise<void> {
    if (isUuid(id)) {
      await this.db.delete(decks).where(eq(decks.id, id));
    }
  }
}
