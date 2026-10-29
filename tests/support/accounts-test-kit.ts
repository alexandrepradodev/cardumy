import { InMemoryUserRepository } from '../../src/modules/accounts/adapters/out/in-memory/in-memory-user-repository.js';
import { createAccountsUseCases } from '../../src/modules/accounts/accounts-module.js';
import { FakePasswordHasher } from './fake-password-hasher.js';
import { FixedClock } from './fixed-clock.js';
import { SequentialIdGenerator } from './sequential-id-generator.js';

export const START = new Date('2026-10-23T10:00:00Z');

// Same idea as makeStudyKit: the accounts use cases on in-memory adapters.
export function makeAccountsKit() {
  const users = new InMemoryUserRepository();
  const hasher = new FakePasswordHasher();

  return {
    users,
    hasher,
    ...createAccountsUseCases({
      users,
      hasher,
      clock: new FixedClock(START),
      ids: new SequentialIdGenerator(),
    }),
  };
}
