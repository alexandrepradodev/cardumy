import { InMemoryCardRepository } from '../../../../src/modules/study/adapters/out/in-memory/in-memory-card-repository.js';
import { InMemoryDeckRepository } from '../../../../src/modules/study/adapters/out/in-memory/in-memory-deck-repository.js';
import { studyRepositoriesContract } from '../../../support/contracts/study-repositories-contract.js';

studyRepositoriesContract('in-memory', () =>
  Promise.resolve({ decks: new InMemoryDeckRepository(), cards: new InMemoryCardRepository() }),
);
