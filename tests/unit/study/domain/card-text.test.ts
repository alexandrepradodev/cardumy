import { describe, expect, it } from 'vitest';

import { CardText } from '../../../../src/modules/study/domain/card-text.js';
import { InvalidCardTextError } from '../../../../src/modules/study/domain/errors.js';

describe('CardText', () => {
  it('keeps a valid text without surrounding spaces', () => {
    expect(CardText.create(' to be ').value).toBe('to be');
  });

  it('rejects an empty text', () => {
    expect(() => CardText.create('')).toThrow(InvalidCardTextError);
  });

  it('rejects a text longer than 2000 characters', () => {
    expect(() => CardText.create('a'.repeat(2001))).toThrow(InvalidCardTextError);
  });
});
