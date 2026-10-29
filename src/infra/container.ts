import { InMemoryCardRepository } from '../modules/study/adapters/out/in-memory/in-memory-card-repository.js';
import { InMemoryDeckRepository } from '../modules/study/adapters/out/in-memory/in-memory-deck-repository.js';
import { InMemoryTransactionRunner } from '../modules/study/adapters/out/in-memory/in-memory-transaction-runner.js';
import { PostgresCardRepository } from '../modules/study/adapters/out/postgres/postgres-card-repository.js';
import { PostgresDeckRepository } from '../modules/study/adapters/out/postgres/postgres-deck-repository.js';
import { PostgresTransactionRunner } from '../modules/study/adapters/out/postgres/postgres-transaction-runner.js';
import { SystemClock } from '../shared/adapters/system-clock.js';
import { UuidIdGenerator } from '../shared/adapters/uuid-id-generator.js';
import { createStudyUseCases, type StudyUseCases } from '../modules/study/study-module.js';
import { connectDatabase } from './database.js';

export interface Container {
  study: StudyUseCases;
  // Releases what the adapters hold open (database connections).
  close(): Promise<void>;
}

// Composition root: the one place that decides which adapter plugs into
// which port. Swapping memory for Postgres happens here and nowhere else.

export function createPostgresContainer(databaseUrl: string): Container {
  const connection = connectDatabase(databaseUrl);
  const { db } = connection;

  return {
    study: createStudyUseCases({
      decks: new PostgresDeckRepository(db),
      cards: new PostgresCardRepository(db),
      transactions: new PostgresTransactionRunner(db),
      clock: new SystemClock(),
      ids: new UuidIdGenerator(),
    }),
    close: () => connection.close(),
  };
}

// Same use cases, data in memory: for tests that do not need a database.
export function createInMemoryContainer(): Container {
  const decks = new InMemoryDeckRepository();
  const cards = new InMemoryCardRepository();

  return {
    study: createStudyUseCases({
      decks,
      cards,
      transactions: new InMemoryTransactionRunner({ decks, cards }),
      clock: new SystemClock(),
      ids: new UuidIdGenerator(),
    }),
    close: () => Promise.resolve(),
  };
}
