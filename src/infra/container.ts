import {
  createAccountsUseCases,
  type AccountsUseCases,
} from '../modules/accounts/accounts-module.js';
import { Argon2PasswordHasher } from '../modules/accounts/adapters/out/argon2/argon2-password-hasher.js';
import { InMemoryUserRepository } from '../modules/accounts/adapters/out/in-memory/in-memory-user-repository.js';
import { PostgresUserRepository } from '../modules/accounts/adapters/out/postgres/postgres-user-repository.js';
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
  accounts: AccountsUseCases;
  // Releases what the adapters hold open (database connections).
  close(): Promise<void>;
}

// Composition root: the one place that decides which adapter plugs into
// which port. Swapping memory for Postgres happens here and nowhere else.

export function createPostgresContainer(databaseUrl: string): Container {
  const connection = connectDatabase(databaseUrl);
  const { db } = connection;
  const clock = new SystemClock();
  const ids = new UuidIdGenerator();

  return {
    study: createStudyUseCases({
      decks: new PostgresDeckRepository(db),
      cards: new PostgresCardRepository(db),
      transactions: new PostgresTransactionRunner(db),
      clock,
      ids,
    }),
    accounts: createAccountsUseCases({
      users: new PostgresUserRepository(db),
      hasher: new Argon2PasswordHasher(),
      clock,
      ids,
    }),
    close: () => connection.close(),
  };
}

// Same use cases, data in memory: for tests that do not need a database.
export function createInMemoryContainer(): Container {
  const decks = new InMemoryDeckRepository();
  const cards = new InMemoryCardRepository();
  const clock = new SystemClock();
  const ids = new UuidIdGenerator();

  return {
    study: createStudyUseCases({
      decks,
      cards,
      transactions: new InMemoryTransactionRunner({ decks, cards }),
      clock,
      ids,
    }),
    accounts: createAccountsUseCases({
      users: new InMemoryUserRepository(),
      hasher: new Argon2PasswordHasher(),
      clock,
      ids,
    }),
    close: () => Promise.resolve(),
  };
}
