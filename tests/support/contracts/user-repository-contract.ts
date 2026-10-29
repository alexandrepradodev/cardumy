import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import { EmailAlreadyInUseError } from '../../../src/modules/accounts/application/errors.js';
import type { UserRepository } from '../../../src/modules/accounts/application/ports/user-repository.js';
import { Email } from '../../../src/modules/accounts/domain/email.js';
import { User } from '../../../src/modules/accounts/domain/user.js';

const T0 = new Date('2026-10-23T10:00:00.000Z');

function makeUser(email = 'ana@example.com', passwordHash = 'hash-1'): User {
  return User.create({ id: randomUUID(), email: Email.create(email), passwordHash, now: T0 });
}

// Contract test: the same expectations for every UserRepository adapter.
export function userRepositoryContract(
  adapterName: string,
  makeRepository: () => Promise<UserRepository>,
): void {
  describe(`${adapterName} user repository (contract)`, () => {
    let users: UserRepository;

    beforeEach(async () => {
      users = await makeRepository();
    });

    it('saves a user and finds it by id, with every field intact', async () => {
      const user = makeUser();
      await users.save(user);

      const found = await users.findById(user.id);

      expect(found?.id).toBe(user.id);
      expect(found?.email.value).toBe('ana@example.com');
      expect(found?.passwordHash).toBe('hash-1');
      expect(found?.createdAt).toEqual(T0);
    });

    it('finds a user by email', async () => {
      const user = makeUser();
      await users.save(user);

      expect((await users.findByEmail(Email.create('ANA@example.com')))?.id).toBe(user.id);
    });

    it('returns null for unknown ids and emails', async () => {
      expect(await users.findById(randomUUID())).toBeNull();
      expect(await users.findById('not-a-uuid')).toBeNull();
      expect(await users.findByEmail(Email.create('nobody@example.com'))).toBeNull();
    });

    it('updates an existing user when saved again', async () => {
      const user = makeUser();
      await users.save(user);

      await users.save(
        User.restore({ id: user.id, email: user.email, passwordHash: 'hash-2', createdAt: T0 }),
      );

      expect((await users.findById(user.id))?.passwordHash).toBe('hash-2');
    });

    it('refuses a second user with the same email', async () => {
      await users.save(makeUser('ana@example.com'));

      await expect(users.save(makeUser('ana@example.com'))).rejects.toThrow(EmailAlreadyInUseError);
    });
  });
}
