import { describe, expect, it } from 'vitest';

import { Argon2PasswordHasher } from '../../../../src/modules/accounts/adapters/out/argon2/argon2-password-hasher.js';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('produces an Argon2id hash that does not contain the password', async () => {
    const passwordHash = await hasher.hash('secret-123');

    expect(passwordHash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(passwordHash).not.toContain('secret-123');
  });

  it('accepts the right password and refuses a wrong one', async () => {
    const passwordHash = await hasher.hash('secret-123');

    expect(await hasher.verify(passwordHash, 'secret-123')).toBe(true);
    expect(await hasher.verify(passwordHash, 'secret-124')).toBe(false);
  });

  it('gives a different hash each time for the same password (random salt)', async () => {
    const first = await hasher.hash('secret-123');
    const second = await hasher.hash('secret-123');

    expect(first).not.toBe(second);
    expect(await hasher.verify(second, 'secret-123')).toBe(true);
  });
});
