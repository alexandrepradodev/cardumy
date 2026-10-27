import type { CardRepository } from './card-repository.js';
import type { DeckRepository } from './deck-repository.js';

export interface TransactionalRepositories {
  decks: DeckRepository;
  cards: CardRepository;
}

// Port for "all or nothing": everything done with the repositories handed to
// `work` is kept together, or undone together if `work` throws.
// The use case decides WHAT must be atomic; the adapter decides HOW.
export interface TransactionRunner {
  run<T>(work: (repositories: TransactionalRepositories) => Promise<T>): Promise<T>;
}
