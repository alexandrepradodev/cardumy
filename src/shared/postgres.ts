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

const UNIQUE_VIOLATION = '23505';

// True when Postgres refused a write because it would break the given unique
// index. Drizzle wraps the driver error, so the Postgres one is in `cause`.
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  const pgError: unknown = error instanceof Error && error.cause ? error.cause : error;
  return (
    typeof pgError === 'object' &&
    pgError !== null &&
    'code' in pgError &&
    pgError.code === UNIQUE_VIOLATION &&
    'constraint' in pgError &&
    pgError.constraint === constraint
  );
}
