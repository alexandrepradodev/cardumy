import type { IdGenerator } from '../../src/shared/ports/id-generator.js';

// Test double: predictable ids ("id-1", "id-2", ...) so assertions are easy to read.
export class SequentialIdGenerator implements IdGenerator {
  private count = 0;

  next(): string {
    this.count += 1;
    return `id-${String(this.count)}`;
  }
}
