import { DeckNotFoundError } from './errors.js';
import type { CardRepository } from './ports/card-repository.js';
import type { Clock } from './ports/clock.js';
import type { DeckRepository } from './ports/deck-repository.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface ListDueCardsInput {
  userId: string;
  deckId: string;
  limit?: number;
}

// Plain data, not entities: callers (HTTP, MCP...) get a read-only copy
// and can never call card.review() behind the use case's back.
export interface DueCardView {
  id: string;
  front: string;
  back: string;
  dueAt: Date;
}

export class ListDueCards {
  constructor(
    private readonly decks: DeckRepository,
    private readonly cards: CardRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ListDueCardsInput): Promise<DueCardView[]> {
    const deck = await this.decks.findById(input.deckId);
    if (!deck?.isOwnedBy(input.userId)) {
      throw new DeckNotFoundError(input.deckId);
    }

    const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const due = await this.cards.findDueByDeck(deck.id, this.clock.now(), limit);

    return due.map((card) => ({
      id: card.id,
      front: card.front.value,
      back: card.back.value,
      dueAt: card.schedule.dueAt,
    }));
  }
}
