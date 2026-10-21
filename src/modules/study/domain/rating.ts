import { InvalidRatingError } from './errors.js';

// How well the student remembered a card, from worst to best.
export const RATINGS = ['again', 'hard', 'good', 'easy'] as const;

export type Rating = (typeof RATINGS)[number];

export function parseRating(raw: string): Rating {
  const rating = RATINGS.find((candidate) => candidate === raw);

  if (rating === undefined) {
    throw new InvalidRatingError(`Rating must be one of: ${RATINGS.join(', ')}`);
  }

  return rating;
}
