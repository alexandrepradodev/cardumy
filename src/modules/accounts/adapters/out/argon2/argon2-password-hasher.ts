import { hash, verify } from '@node-rs/argon2';

import type { PasswordHasher } from '../../../application/ports/password-hasher.js';

// OWASP's minimum for Argon2id: 19 MiB of memory, 2 passes, 1 thread
// (about 20-50 ms per hash). The algorithm is the library default, Argon2id.
const OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 };

// Adapter: the real PasswordHasher. Each hash gets a random salt, and the
// result is one self-describing string ("$argon2id$v=19$m=19456,t=2,p=1$salt$hash"),
// so verify() knows which settings to reuse even after we raise them.
export class Argon2PasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return hash(password, OPTIONS);
  }

  verify(passwordHash: string, password: string): Promise<boolean> {
    return verify(passwordHash, password);
  }
}
