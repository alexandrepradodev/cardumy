import { describe, expect, it } from 'vitest';

import { EmailAlreadyInUseError } from '../../../../src/modules/accounts/application/errors.js';
import { Email } from '../../../../src/modules/accounts/domain/email.js';
import {
  InvalidEmailError,
  WeakPasswordError,
} from '../../../../src/modules/accounts/domain/errors.js';
import { makeAccountsKit, START } from '../../../support/accounts-test-kit.js';

describe('RegisterUser', () => {
  it('stores the user with the password hash, never the password', async () => {
    const { registerUser, users } = makeAccountsKit();

    const view = await registerUser.execute({ email: ' Ana@Example.com ', password: 'secret-123' });

    expect(view).toEqual({ id: 'id-1', email: 'ana@example.com', createdAt: START });
    const user = await users.findById('id-1');
    expect(user?.passwordHash).toBe('fake-hash:secret-123');
  });

  it('never returns the password hash', async () => {
    const { registerUser } = makeAccountsKit();

    const view = await registerUser.execute({ email: 'ana@example.com', password: 'secret-123' });

    expect(view).not.toHaveProperty('passwordHash');
  });

  it('refuses an email that is already in use, whatever the letter case', async () => {
    const { registerUser } = makeAccountsKit();
    await registerUser.execute({ email: 'ana@example.com', password: 'secret-123' });

    await expect(
      registerUser.execute({ email: 'ANA@example.com', password: 'other-pass' }),
    ).rejects.toThrow(EmailAlreadyInUseError);
  });

  it('stores nothing when the email or the password is invalid', async () => {
    const { registerUser, users } = makeAccountsKit();

    await expect(
      registerUser.execute({ email: 'not-an-email', password: 'secret-123' }),
    ).rejects.toThrow(InvalidEmailError);
    await expect(
      registerUser.execute({ email: 'ana@example.com', password: 'short' }),
    ).rejects.toThrow(WeakPasswordError);
    expect(await users.findByEmail(Email.create('ana@example.com'))).toBeNull();
  });
});
