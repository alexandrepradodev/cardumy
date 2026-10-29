import type { Clock } from '../../shared/ports/clock.js';
import type { IdGenerator } from '../../shared/ports/id-generator.js';
import { AuthenticateUser } from './application/authenticate-user.js';
import type { PasswordHasher } from './application/ports/password-hasher.js';
import type { UserRepository } from './application/ports/user-repository.js';
import { RegisterUser } from './application/register-user.js';

export interface AccountsPorts {
  users: UserRepository;
  hasher: PasswordHasher;
  clock: Clock;
  ids: IdGenerator;
}

// Public face of the accounts module, same shape as study-module.ts.
export function createAccountsUseCases({ users, hasher, clock, ids }: AccountsPorts) {
  return {
    registerUser: new RegisterUser(users, hasher, clock, ids),
    authenticateUser: new AuthenticateUser(users, hasher),
  };
}

export type AccountsUseCases = ReturnType<typeof createAccountsUseCases>;
