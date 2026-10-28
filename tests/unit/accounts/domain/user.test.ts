import { describe, expect, it } from 'vitest';

import { Email } from '../../../../src/modules/accounts/domain/email.js';
import { User } from '../../../../src/modules/accounts/domain/user.js';

const now = new Date('2026-10-28T10:00:00Z');

describe('User', () => {
  it('is created with an email and a password hash, never the password', () => {
    const user = User.create({
      id: 'user-1',
      email: Email.create('ana@x.com'),
      passwordHash: 'some-hash',
      now,
    });

    expect(user.email.value).toBe('ana@x.com');
    expect(user.passwordHash).toBe('some-hash');
    expect(user.createdAt).toEqual(now);
  });

  it('is identified by its id', () => {
    const make = (id: string) =>
      User.create({ id, email: Email.create('ana@x.com'), passwordHash: 'h', now });

    expect(make('user-1').equals(make('user-1'))).toBe(true);
    expect(make('user-1').equals(make('user-2'))).toBe(false);
  });
});
