import { describe, expect, it, vi } from 'vitest';

import { InvalidCredentialsError } from '../../../../src/modules/accounts/application/errors.js';
import { Email } from '../../../../src/modules/accounts/domain/email.js';
import { User } from '../../../../src/modules/accounts/domain/user.js';
import { makeAccountsKit } from '../../../support/accounts-test-kit.js';

async function kitWithAna() {
  const kit = makeAccountsKit();
  await kit.registerUser.execute({ email: 'ana@example.com', password: 'secret-123' });
  return kit;
}

describe('AuthenticateUser', () => {
  it('returns the user id when email and password match', async () => {
    const { authenticateUser } = await kitWithAna();

    const result = await authenticateUser.execute({
      email: 'Ana@Example.com',
      password: 'secret-123',
    });

    expect(result).toEqual({ userId: 'id-1' });
  });

  it('refuses a wrong password', async () => {
    const { authenticateUser } = await kitWithAna();

    await expect(
      authenticateUser.execute({ email: 'ana@example.com', password: 'wrong-pass' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('gives the same answer for an unknown email, so emails cannot be discovered', async () => {
    const { authenticateUser } = await kitWithAna();

    const wrongPassword = authenticateUser.execute({
      email: 'ana@example.com',
      password: 'wrong-pass',
    });
    const unknownEmail = authenticateUser.execute({
      email: 'bob@example.com',
      password: 'secret-123',
    });

    await expect(wrongPassword).rejects.toThrow('Email or password is incorrect');
    await expect(unknownEmail).rejects.toThrow('Email or password is incorrect');
  });

  it('still spends time hashing when the email is unknown (no timing hint)', async () => {
    const { authenticateUser, hasher } = await kitWithAna();
    const hash = vi.spyOn(hasher, 'hash');

    await expect(
      authenticateUser.execute({ email: 'bob@example.com', password: 'secret-123' }),
    ).rejects.toThrow(InvalidCredentialsError);
    expect(hash).toHaveBeenCalledOnce();
  });

  it('treats a malformed email as invalid credentials, not as a validation error', async () => {
    const { authenticateUser } = await kitWithAna();

    await expect(
      authenticateUser.execute({ email: 'not-an-email', password: 'secret-123' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('lets a user log in even if the password rules got stricter later', async () => {
    const { authenticateUser, users } = makeAccountsKit();
    await users.save(
      User.create({
        id: 'old-user',
        email: Email.create('old@example.com'),
        passwordHash: 'fake-hash:abc',
        now: new Date(),
      }),
    );

    const result = await authenticateUser.execute({ email: 'old@example.com', password: 'abc' });

    expect(result).toEqual({ userId: 'old-user' });
  });
});
