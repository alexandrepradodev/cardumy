import type {
  TransactionalRepositories,
  TransactionRunner,
} from '../../../application/ports/transaction-runner.js';

// Memory has no real transactions: it just runs the work. Good enough for
// unit tests of use cases; atomicity itself is tested against Postgres.
export class InMemoryTransactionRunner implements TransactionRunner {
  constructor(private readonly repositories: TransactionalRepositories) {}

  run<T>(work: (repositories: TransactionalRepositories) => Promise<T>): Promise<T> {
    return work(this.repositories);
  }
}
