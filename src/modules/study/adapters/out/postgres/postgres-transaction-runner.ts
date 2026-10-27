import type { Database } from '../../../../../shared/postgres.js';
import type {
  TransactionalRepositories,
  TransactionRunner,
} from '../../../application/ports/transaction-runner.js';
import { PostgresCardRepository } from './postgres-card-repository.js';
import { PostgresDeckRepository } from './postgres-deck-repository.js';

export class PostgresTransactionRunner implements TransactionRunner {
  constructor(private readonly db: Database) {}

  // BEGIN ... COMMIT, or ROLLBACK if `work` throws. The repositories given to
  // `work` are bound to this transaction, so all their queries share it.
  run<T>(work: (repositories: TransactionalRepositories) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) =>
      work({ decks: new PostgresDeckRepository(tx), cards: new PostgresCardRepository(tx) }),
    );
  }
}
