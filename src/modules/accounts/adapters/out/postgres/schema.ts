import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

// Tables of the accounts module. Only this module's Postgres adapters read them
// (CLAUDE.md rule 5).

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    // Already lower case: the Email value object normalizes it before saving.
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  // The final guard against duplicates: the database itself refuses a second
  // row with the same email, even when two sign ups arrive at the same instant.
  (table) => [uniqueIndex('users_email_unique').on(table.email)],
);
