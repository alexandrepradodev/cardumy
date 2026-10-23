import { describe, expect, it } from 'vitest';

import { InvalidRatingError } from '../../../../src/modules/study/domain/errors.js';
import { parseRating } from '../../../../src/modules/study/domain/rating.js';

describe('parseRating', () => {
  it.each(['again', 'hard', 'good', 'easy'])('accepts "%s"', (raw) => {
    expect(parseRating(raw)).toBe(raw);
  });

  it('rejects an unknown rating', () => {
    expect(() => parseRating('perfect')).toThrow(InvalidRatingError);
  });
});
