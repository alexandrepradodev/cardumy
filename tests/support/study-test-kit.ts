import { InMemoryCardRepository } from '../../src/modules/study/adapters/out/in-memory/in-memory-card-repository.js';
import { InMemoryDeckRepository } from '../../src/modules/study/adapters/out/in-memory/in-memory-deck-repository.js';
import { AddCard } from '../../src/modules/study/application/add-card.js';
import { CreateDeck } from '../../src/modules/study/application/create-deck.js';
import { ListDueCards } from '../../src/modules/study/application/list-due-cards.js';
import { ReviewCard } from '../../src/modules/study/application/review-card.js';
import { FixedClock } from './fixed-clock.js';
import { SequentialIdGenerator } from './sequential-id-generator.js';

export const START = new Date('2026-10-23T10:00:00Z');

// Wires the use cases to in-memory adapters, like infra/ will wire them
// to Postgres in production. Each test gets a fresh, isolated world.
export function makeStudyKit() {
  const decks = new InMemoryDeckRepository();
  const cards = new InMemoryCardRepository();
  const clock = new FixedClock(START);
  const ids = new SequentialIdGenerator();

  return {
    decks,
    cards,
    clock,
    createDeck: new CreateDeck(decks, clock, ids),
    addCard: new AddCard(decks, cards, clock, ids),
    reviewCard: new ReviewCard(decks, cards, clock),
    listDueCards: new ListDueCards(decks, cards, clock),
  };
}
