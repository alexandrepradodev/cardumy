import { ReviewInThePastError } from './errors.js';
import type { Rating } from './rating.js';

// Simplified version of FSRS (Free Spaced Repetition Scheduler).
// It keeps the two ideas that matter, with fewer and hand-picked constants:
// - stability: how many days the memory lasts with ~90% chance of recall;
// - difficulty (1 to 10): how hard this card is for this student.
// Real FSRS trains 19+ parameters from review history; we use fixed ones.

const DAY_MS = 24 * 60 * 60 * 1000;
const RELEARN_DELAY_MS = 10 * 60 * 1000;

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;
const MIN_STABILITY_DAYS = 0.5;

// First review: how long the memory lasts and how hard the card feels.
const INITIAL_STABILITY_DAYS: Record<Rating, number> = { again: 0.5, hard: 1.5, good: 3, easy: 8 };
const INITIAL_DIFFICULTY: Record<Rating, number> = { again: 7, hard: 6, good: 5, easy: 3 };

// Later reviews: how much stability grows and how difficulty moves.
const STABILITY_GROWTH: Record<Rating, number> = { again: 0, hard: 0.6, good: 2, easy: 3.5 };
const DIFFICULTY_CHANGE: Record<Rating, number> = { again: 2, hard: 1, good: 0, easy: -1 };
const LAPSE_STABILITY_FACTOR = 0.2;

// Forgetting curve from FSRS: chance of remembering after `elapsedDays`.
// It is exactly 90% when elapsedDays equals stability.
function retrievability(elapsedDays: number, stabilityDays: number): number {
  return (1 + (19 / 81) * (elapsedDays / stabilityDays)) ** -0.5;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface ReviewScheduleProps {
  stabilityDays: number;
  difficulty: number;
  dueAt: Date;
  lastReviewedAt: Date | null;
  reviewCount: number;
  lapseCount: number;
}

// Value object: an immutable snapshot of a card's memory state.
// Reviewing never changes it; it returns a new schedule.
export class ReviewSchedule {
  readonly stabilityDays: number;
  readonly difficulty: number;
  readonly dueAt: Date;
  readonly lastReviewedAt: Date | null;
  readonly reviewCount: number;
  readonly lapseCount: number;

  private constructor(props: ReviewScheduleProps) {
    this.stabilityDays = props.stabilityDays;
    this.difficulty = props.difficulty;
    this.dueAt = props.dueAt;
    this.lastReviewedAt = props.lastReviewedAt;
    this.reviewCount = props.reviewCount;
    this.lapseCount = props.lapseCount;
  }

  // Rebuilds a schedule saved earlier (for example, read from the database).
  static restore(props: ReviewScheduleProps): ReviewSchedule {
    return new ReviewSchedule(props);
  }

  // A brand-new card is due right away.
  static forNewCard(now: Date): ReviewSchedule {
    return new ReviewSchedule({
      stabilityDays: 0,
      difficulty: 0,
      dueAt: now,
      lastReviewedAt: null,
      reviewCount: 0,
      lapseCount: 0,
    });
  }

  get isNew(): boolean {
    return this.reviewCount === 0;
  }

  isDue(now: Date): boolean {
    return this.dueAt.getTime() <= now.getTime();
  }

  next(rating: Rating, now: Date): ReviewSchedule {
    if (this.lastReviewedAt !== null && now < this.lastReviewedAt) {
      throw new ReviewInThePastError('A review cannot happen before the previous one');
    }

    const { stabilityDays, difficulty } = this.isNew
      ? { stabilityDays: INITIAL_STABILITY_DAYS[rating], difficulty: INITIAL_DIFFICULTY[rating] }
      : this.nextMemoryState(rating, now);

    const isLapse = rating === 'again' && !this.isNew;
    // Forgot it: see it again in a few minutes. Remembered: see it again
    // when the chance of recall drops to ~90%, which is `stability` days.
    const delayMs =
      rating === 'again' ? RELEARN_DELAY_MS : Math.max(1, Math.round(stabilityDays)) * DAY_MS;

    return new ReviewSchedule({
      stabilityDays,
      difficulty,
      dueAt: new Date(now.getTime() + delayMs),
      lastReviewedAt: now,
      reviewCount: this.reviewCount + 1,
      lapseCount: this.lapseCount + (isLapse ? 1 : 0),
    });
  }

  private nextMemoryState(
    rating: Rating,
    now: Date,
  ): { stabilityDays: number; difficulty: number } {
    const difficulty = clamp(
      this.difficulty + DIFFICULTY_CHANGE[rating],
      MIN_DIFFICULTY,
      MAX_DIFFICULTY,
    );

    if (rating === 'again') {
      return {
        stabilityDays: Math.max(MIN_STABILITY_DAYS, this.stabilityDays * LAPSE_STABILITY_FACTOR),
        difficulty,
      };
    }

    const lastReviewedAt = this.lastReviewedAt ?? now;
    const elapsedDays = (now.getTime() - lastReviewedAt.getTime()) / DAY_MS;
    const recall = retrievability(elapsedDays, this.stabilityDays);

    // Easy cards (low difficulty) grow faster, and remembering something you
    // were about to forget (low recall) strengthens the memory the most.
    const growth = STABILITY_GROWTH[rating] * ((11 - difficulty) / 10) * (1 + 2 * (1 - recall));

    return { stabilityDays: this.stabilityDays * (1 + growth), difficulty };
  }
}
