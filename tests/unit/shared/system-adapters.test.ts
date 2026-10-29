import { describe, expect, it } from 'vitest';

import { SystemClock } from '../../../src/shared/adapters/system-clock.js';
import { UuidIdGenerator } from '../../../src/shared/adapters/uuid-id-generator.js';

describe('SystemClock', () => {
  it('returns the current time', () => {
    const before = Date.now();

    const now = new SystemClock().now().getTime();

    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });
});

describe('UuidIdGenerator', () => {
  it('creates unique UUIDs', () => {
    const generator = new UuidIdGenerator();

    const first = generator.next();
    const second = generator.next();

    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(first).not.toBe(second);
  });
});
