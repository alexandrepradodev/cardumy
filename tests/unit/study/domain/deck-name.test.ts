import { describe, expect, it } from 'vitest';

import { DeckName } from '../../../../src/modules/study/domain/deck-name.js';
import { InvalidDeckNameError } from '../../../../src/modules/study/domain/errors.js';

describe('DeckName', () => {
  it('keeps a valid name without surrounding spaces', () => {
    const name = DeckName.create('  English verbs  ');

    expect(name.value).toBe('English verbs');
  });

  it('rejects an empty name', () => {
    expect(() => DeckName.create('   ')).toThrow(InvalidDeckNameError);
  });

  it('rejects a name longer than 100 characters', () => {
    expect(() => DeckName.create('a'.repeat(101))).toThrow(InvalidDeckNameError);
  });

  it('accepts a name with exactly 100 characters', () => {
    expect(DeckName.create('a'.repeat(100)).value).toHaveLength(100);
  });

  it('is equal to another name with the same value', () => {
    expect(DeckName.create('Math').equals(DeckName.create(' Math '))).toBe(true);
    expect(DeckName.create('Math').equals(DeckName.create('History'))).toBe(false);
  });
});
