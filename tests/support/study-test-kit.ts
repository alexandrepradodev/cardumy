import { InMemoryCardRepository } from '../../src/modules/study/adapters/out/in-memory/in-memory-card-repository.js';
import { InMemoryDeckRepository } from '../../src/modules/study/adapters/out/in-memory/in-memory-deck-repository.js';
import { createStudyUseCases } from '../../src/modules/study/study-module.js';
import { FixedClock } from './fixed-clock.js';
import { SequentialIdGenerator } from './sequential-id-generator.js';

export const START = new Date('2026-10-23T10:00:00Z');

// Wires the use cases to in-memory adapters, like infra/ does in the app.
// Each test gets a fresh, isolated world with a frozen clock.
export function makeStudyKit() {
  const decks = new InMemoryDeckRepository();
  const cards = new InMemoryCardRepository();
  const clock = new FixedClock(START);
  const ids = new SequentialIdGenerator();

  return { decks, cards, clock, ...createStudyUseCases({ decks, cards, clock, ids }) };
}
