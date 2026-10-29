import { describe, expect, it } from 'vitest';

import { Email } from '../../../../src/modules/accounts/domain/email.js';
import { InvalidEmailError } from '../../../../src/modules/accounts/domain/errors.js';

describe('Email', () => {
  it('normalizes to lower case without surrounding spaces', () => {
    expect(Email.create('  Ana@Example.COM ').value).toBe('ana@example.com');
  });

  it('treats different capitalizations as the same email', () => {
    expect(Email.create('Ana@X.com').equals(Email.create('ana@x.com'))).toBe(true);
  });

  it.each(['', 'ana', 'ana@', '@x.com', 'ana@x', 'ana x@y.com'])('rejects "%s"', (raw) => {
    expect(() => Email.create(raw)).toThrow(InvalidEmailError);
  });

  it('rejects an email longer than 254 characters', () => {
    expect(() => Email.create(`${'a'.repeat(250)}@x.com`)).toThrow(InvalidEmailError);
  });
});
