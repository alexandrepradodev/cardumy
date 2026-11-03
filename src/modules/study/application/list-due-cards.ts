import { findOwnedDeck } from './ownership.js';
import type { CardRepository } from './ports/card-repository.js';
import type { Clock } from '../../../shared/ports/clock.js';
import type { DeckRepository } from './ports/deck-repository.js';
import type { CardPresenter } from './card-presenter.js';
import type { CardView } from './views.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface ListDueCardsInput {
  userId: string;
  deckId: string;
  limit?: number;
}

export class ListDueCards {
  constructor(
    private readonly decks: DeckRepository,
    private readonly cards: CardRepository,
    private readonly clock: Clock,
    private readonly presenter: CardPresenter,
  ) {}

  async execute(input: ListDueCardsInput): Promise<CardView[]> {
    const deck = await findOwnedDeck(this.decks, input.deckId, input.userId);

    const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const due = await this.cards.findDueByDeck(deck.id, this.clock.now(), limit);

    return this.presenter.presentAll(due);
  }
}
