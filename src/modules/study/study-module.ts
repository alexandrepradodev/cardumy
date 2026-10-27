import { AddCard } from './application/add-card.js';
import { CreateDeck } from './application/create-deck.js';
import { DeleteCard } from './application/delete-card.js';
import { DeleteDeck } from './application/delete-deck.js';
import { EditCard } from './application/edit-card.js';
import { GetDeck } from './application/get-deck.js';
import { ListCards } from './application/list-cards.js';
import { ListDecks } from './application/list-decks.js';
import { ListDueCards } from './application/list-due-cards.js';
import type { CardRepository } from './application/ports/card-repository.js';
import type { Clock } from './application/ports/clock.js';
import type { DeckRepository } from './application/ports/deck-repository.js';
import type { IdGenerator } from './application/ports/id-generator.js';
import type { TransactionRunner } from './application/ports/transaction-runner.js';
import { RenameDeck } from './application/rename-deck.js';
import { ReviewCard } from './application/review-card.js';

export interface StudyPorts {
  decks: DeckRepository;
  cards: CardRepository;
  clock: Clock;
  ids: IdGenerator;
  transactions: TransactionRunner;
}

// Public face of the study module: plug in adapters for the ports and get
// every use case back. infra/ decides which adapters; this file only wires.
export function createStudyUseCases({ decks, cards, clock, ids, transactions }: StudyPorts) {
  return {
    createDeck: new CreateDeck(decks, clock, ids),
    listDecks: new ListDecks(decks),
    getDeck: new GetDeck(decks),
    renameDeck: new RenameDeck(decks),
    deleteDeck: new DeleteDeck(decks, transactions),
    addCard: new AddCard(decks, cards, clock, ids),
    listCards: new ListCards(decks, cards),
    editCard: new EditCard(decks, cards),
    deleteCard: new DeleteCard(decks, cards),
    reviewCard: new ReviewCard(decks, cards, clock),
    listDueCards: new ListDueCards(decks, cards, clock),
  };
}

export type StudyUseCases = ReturnType<typeof createStudyUseCases>;
