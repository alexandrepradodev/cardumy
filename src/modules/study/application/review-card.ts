import { parseRating } from '../domain/rating.js';
import { CardNotFoundError } from './errors.js';
import type { CardRepository } from './ports/card-repository.js';
import type { Clock } from './ports/clock.js';
import type { DeckRepository } from './ports/deck-repository.js';

export interface ReviewCardInput {
  userId: string;
  cardId: string;
  rating: string;
}

export interface ReviewCardOutput {
  nextReviewAt: Date;
}

export class ReviewCard {
  constructor(
    private readonly decks: DeckRepository,
    private readonly cards: CardRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ReviewCardInput): Promise<ReviewCardOutput> {
    const rating = parseRating(input.rating);

    const card = await this.cards.findById(input.cardId);
    const deck = card === null ? null : await this.decks.findById(card.deckId);
    if (card === null || !deck?.isOwnedBy(input.userId)) {
      throw new CardNotFoundError(input.cardId);
    }

    // The rule lives in the card; the use case only orchestrates.
    card.review(rating, this.clock.now());
    await this.cards.save(card);

    return { nextReviewAt: card.schedule.dueAt };
  }
}
