import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

// Types shared by every module's Postgres adapters.
export type Database = NodePgDatabase;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
// Repositories accept either, so the same code runs inside or outside a transaction.
export type DbExecutor = Database | Transaction;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ids arrive from URLs as free text. Postgres rejects a malformed uuid with an
// error (a 500 for the client); checking first turns it into a plain "not found".
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
