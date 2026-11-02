import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// Tables of the study module. Only this module's Postgres adapters read them
// (CLAUDE.md rule 5): other modules talk to study through its use cases.

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const decks = pgTable(
  'decks',
  {
    id: uuid('id').primaryKey(),
    // The accounts user id (the token's `sub`). No foreign key to users on
    // purpose: a module never reaches into another module's tables (rule 5).
    ownerId: text('owner_id').notNull(),
    name: text('name').notNull(),
    createdAt: timestamptz('created_at').notNull(),
  },
  (table) => [index('decks_owner_id_idx').on(table.ownerId)],
);

export const cards = pgTable(
  'cards',
  {
    id: uuid('id').primaryKey(),
    // No ON DELETE CASCADE: deleting a deck's cards is an explicit step of the
    // DeleteDeck use case, run in a transaction (decision of stage 3).
    deckId: uuid('deck_id')
      .notNull()
      .references(() => decks.id),
    front: text('front').notNull(),
    back: text('back').notNull(),
    createdAt: timestamptz('created_at').notNull(),
    // ReviewSchedule, one column per field so the database can search by date.
    stabilityDays: doublePrecision('stability_days').notNull(),
    difficulty: doublePrecision('difficulty').notNull(),
    dueAt: timestamptz('due_at').notNull(),
    lastReviewedAt: timestamptz('last_reviewed_at'),
    reviewCount: integer('review_count').notNull(),
    lapseCount: integer('lapse_count').notNull(),
  },
  // "Cards of this deck due before now, oldest first" reads this index in order.
  (table) => [index('cards_deck_id_due_at_idx').on(table.deckId, table.dueAt)],
);
