import type { Clock } from '../../src/modules/study/application/ports/clock.js';

// Test double: a clock that only moves when the test says so.
export class FixedClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return this.current;
  }

  advanceDays(days: number): void {
    this.current = new Date(this.current.getTime() + days * 24 * 60 * 60 * 1000);
  }
}
