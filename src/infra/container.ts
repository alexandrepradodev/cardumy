import { InMemoryCardRepository } from '../modules/study/adapters/out/in-memory/in-memory-card-repository.js';
import { InMemoryDeckRepository } from '../modules/study/adapters/out/in-memory/in-memory-deck-repository.js';
import { SystemClock } from '../modules/study/adapters/out/system/system-clock.js';
import { UuidIdGenerator } from '../modules/study/adapters/out/system/uuid-id-generator.js';
import { createStudyUseCases, type StudyUseCases } from '../modules/study/study-module.js';

export interface Container {
  study: StudyUseCases;
}

// Composition root: the one place that decides which adapter plugs into
// which port. Data lives in memory until stage 3 swaps in Postgres here.
export function createContainer(): Container {
  return {
    study: createStudyUseCases({
      decks: new InMemoryDeckRepository(),
      cards: new InMemoryCardRepository(),
      clock: new SystemClock(),
      ids: new UuidIdGenerator(),
    }),
  };
}
