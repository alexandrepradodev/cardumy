import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

import { connectDatabase, type DatabaseConnection } from '../../../src/infra/database.js';
import { createAccountsUseCases } from '../../../src/modules/accounts/accounts-module.js';
import { PostgresUserRepository } from '../../../src/modules/accounts/adapters/out/postgres/postgres-user-repository.js';
import { EmailAlreadyInUseError } from '../../../src/modules/accounts/application/errors.js';
import { SystemClock } from '../../../src/shared/adapters/system-clock.js';
import { UuidIdGenerator } from '../../../src/shared/adapters/uuid-id-generator.js';
import { userRepositoryContract } from '../../support/contracts/user-repository-contract.js';
import { FakePasswordHasher } from '../../support/fake-password-hasher.js';

let connection: DatabaseConnection;

beforeAll(() => {
  connection = connectDatabase(inject('databaseUrl'));
});

afterAll(async () => {
  await connection.close();
});

async function freshRepository() {
  await connection.db.execute(sql`TRUNCATE users`);
  return new PostgresUserRepository(connection.db);
}

userRepositoryContract('Postgres', freshRepository);

describe('Postgres users table', () => {
  it('lets only one of two simultaneous sign ups with the same email through', async () => {
    const { registerUser } = createAccountsUseCases({
      users: await freshRepository(),
      hasher: new FakePasswordHasher(),
      clock: new SystemClock(),
      ids: new UuidIdGenerator(),
    });
    const signUp = () => registerUser.execute({ email: 'ana@example.com', password: 'secret-123' });

    // Both start before either finishes: the race of the "already in use?" check.
    const results = await Promise.allSettled([signUp(), signUp()]);

    const rejected = results.filter((result) => result.status === 'rejected');
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toBeInstanceOf(EmailAlreadyInUseError);
  });
});
