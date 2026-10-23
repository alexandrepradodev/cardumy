import { describe, expect, it } from 'vitest';

import { ReviewInThePastError } from '../../../../src/modules/study/domain/errors.js';
import type { Rating } from '../../../../src/modules/study/domain/rating.js';
import { ReviewSchedule } from '../../../../src/modules/study/domain/review-schedule.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const start = new Date('2026-10-23T10:00:00Z');

function daysLater(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function daysUntilDue(schedule: ReviewSchedule, from: Date): number {
  return (schedule.dueAt.getTime() - from.getTime()) / DAY_MS;
}

// A card already reviewed once with "good": stability 3 days, due in 3 days.
function learnedCard(): ReviewSchedule {
  return ReviewSchedule.forNewCard(start).next('good', start);
}

describe('ReviewSchedule', () => {
  describe('new card', () => {
    it('is due right away', () => {
      const schedule = ReviewSchedule.forNewCard(start);

      expect(schedule.isNew).toBe(true);
      expect(schedule.isDue(start)).toBe(true);
    });

    it.each<[Rating, number]>([
      ['hard', 2],
      ['good', 3],
      ['easy', 8],
    ])('after a first "%s" is due in %i days', (rating, days) => {
      const schedule = ReviewSchedule.forNewCard(start).next(rating, start);

      expect(daysUntilDue(schedule, start)).toBe(days);
      expect(schedule.isNew).toBe(false);
    });

    it('after a first "again" comes back in 10 minutes, without counting a lapse', () => {
      const schedule = ReviewSchedule.forNewCard(start).next('again', start);

      expect(schedule.dueAt.getTime() - start.getTime()).toBe(10 * 60 * 1000);
      expect(schedule.lapseCount).toBe(0);
    });
  });

  describe('learned card', () => {
    it('grows the interval when remembered on time', () => {
      const reviewDay = daysLater(start, 3);

      const schedule = learnedCard().next('good', reviewDay);

      expect(daysUntilDue(schedule, reviewDay)).toBeGreaterThan(3);
    });

    it('gives longer intervals for better ratings', () => {
      const reviewDay = daysLater(start, 3);
      const intervalFor = (rating: Rating) =>
        daysUntilDue(learnedCard().next(rating, reviewDay), reviewDay);

      expect(intervalFor('easy')).toBeGreaterThan(intervalFor('good'));
      expect(intervalFor('good')).toBeGreaterThan(intervalFor('hard'));
    });

    it('grows more when remembered after being almost forgotten', () => {
      const onTime = learnedCard().next('good', daysLater(start, 3));
      const late = learnedCard().next('good', daysLater(start, 30));

      expect(late.stabilityDays).toBeGreaterThan(onTime.stabilityDays);
    });

    it('counts a lapse, shrinks stability and gets harder when forgotten', () => {
      const before = learnedCard();
      const reviewDay = daysLater(start, 3);

      const after = before.next('again', reviewDay);

      expect(after.lapseCount).toBe(1);
      expect(after.stabilityDays).toBeLessThan(before.stabilityDays);
      expect(after.difficulty).toBeGreaterThan(before.difficulty);
      expect(after.isDue(new Date(reviewDay.getTime() + 10 * 60 * 1000))).toBe(true);
    });

    it('keeps difficulty between 1 and 10', () => {
      let schedule = learnedCard();
      let day = start;

      for (let i = 0; i < 10; i++) {
        day = daysLater(day, 1);
        schedule = schedule.next('again', day);
      }
      expect(schedule.difficulty).toBe(10);

      for (let i = 0; i < 15; i++) {
        day = daysLater(day, 1);
        schedule = schedule.next('easy', day);
      }
      expect(schedule.difficulty).toBe(1);
    });
  });

  it('never changes itself: reviewing returns a new schedule', () => {
    const before = ReviewSchedule.forNewCard(start);

    before.next('good', start);

    expect(before.isNew).toBe(true);
  });

  it('rejects a review dated before the previous one', () => {
    const schedule = learnedCard();

    expect(() => schedule.next('good', daysLater(start, -1))).toThrow(ReviewInThePastError);
  });
});
