import { AddCard } from './application/add-card.js';
import { AttachCardImage } from './application/attach-card-image.js';
import { CardPresenter } from './application/card-presenter.js';
import { CreateDeck } from './application/create-deck.js';
import { DeleteCard } from './application/delete-card.js';
import { DeleteDeck } from './application/delete-deck.js';
import { EditCard } from './application/edit-card.js';
import { GetDeck } from './application/get-deck.js';
import { ListCards } from './application/list-cards.js';
import { ListDecks } from './application/list-decks.js';
import { ListDueCards } from './application/list-due-cards.js';
import type { CardRepository } from './application/ports/card-repository.js';
import type { Clock } from '../../shared/ports/clock.js';
import type { DeckRepository } from './application/ports/deck-repository.js';
import type { IdGenerator } from '../../shared/ports/id-generator.js';
import type { TransactionRunner } from './application/ports/transaction-runner.js';
import { RenameDeck } from './application/rename-deck.js';
import { RemoveCardImage } from './application/remove-card-image.js';
import { RequestCardImageUpload } from './application/request-card-image-upload.js';
import { ReviewCard } from './application/review-card.js';
import type { FileStorage } from '../../shared/ports/file-storage.js';

export interface StudyPorts {
  decks: DeckRepository;
  cards: CardRepository;
  clock: Clock;
  ids: IdGenerator;
  transactions: TransactionRunner;
  files: FileStorage;
}

// Public face of the study module: plug in adapters for the ports and get
// every use case back. infra/ decides which adapters; this file only wires.
export function createStudyUseCases({ decks, cards, clock, ids, transactions, files }: StudyPorts) {
  const presenter = new CardPresenter(files);

  return {
    createDeck: new CreateDeck(decks, clock, ids),
    listDecks: new ListDecks(decks),
    getDeck: new GetDeck(decks),
    renameDeck: new RenameDeck(decks),
    deleteDeck: new DeleteDeck(decks, cards, transactions, files),
    addCard: new AddCard(decks, cards, clock, ids, presenter),
    listCards: new ListCards(decks, cards, presenter),
    editCard: new EditCard(decks, cards, presenter),
    deleteCard: new DeleteCard(decks, cards, files),
    reviewCard: new ReviewCard(decks, cards, clock, presenter),
    listDueCards: new ListDueCards(decks, cards, clock, presenter),
    requestCardImageUpload: new RequestCardImageUpload(decks, cards, files, clock, ids),
    attachCardImage: new AttachCardImage(decks, cards, files, presenter),
    removeCardImage: new RemoveCardImage(decks, cards, files, presenter),
  };
}

export type StudyUseCases = ReturnType<typeof createStudyUseCases>;
