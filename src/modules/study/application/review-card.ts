import { parseRating } from '../domain/rating.js';
import { findOwnedCard } from './ownership.js';
import type { CardRepository } from './ports/card-repository.js';
import type { Clock } from '../../../shared/ports/clock.js';
import type { DeckRepository } from './ports/deck-repository.js';
import { type CardView, toCardView } from './views.js';

export interface ReviewCardInput {
  userId: string;
  cardId: string;
  rating: string;
}

export class ReviewCard {
  constructor(
    private readonly decks: DeckRepository,
    private readonly cards: CardRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ReviewCardInput): Promise<CardView> {
    const rating = parseRating(input.rating);
    const card = await findOwnedCard(this.decks, this.cards, input.cardId, input.userId);

    // The rule lives in the card; the use case only orchestrates.
    card.review(rating, this.clock.now());
    await this.cards.save(card);

    return toCardView(card);
  }
}
