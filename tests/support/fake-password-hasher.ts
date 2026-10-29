import type { PasswordHasher } from '../../src/modules/accounts/application/ports/password-hasher.js';

// Test double: instant and readable. NEVER use outside tests: it is not a hash.
export class FakePasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return Promise.resolve(`fake-hash:${password}`);
  }

  verify(passwordHash: string, password: string): Promise<boolean> {
    return Promise.resolve(passwordHash === `fake-hash:${password}`);
  }
}
