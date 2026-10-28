import { describe, expect, it } from 'vitest';

import { WeakPasswordError } from '../../../../src/modules/accounts/domain/errors.js';
import { Password } from '../../../../src/modules/accounts/domain/password.js';

describe('Password', () => {
  it('accepts 8 characters or more, keeping spaces', () => {
    expect(Password.create(' my pass ').value).toBe(' my pass ');
  });

  it('rejects fewer than 8 characters', () => {
    expect(() => Password.create('1234567')).toThrow(WeakPasswordError);
  });

  it('rejects more than 128 characters', () => {
    expect(() => Password.create('a'.repeat(129))).toThrow(WeakPasswordError);
  });
});
