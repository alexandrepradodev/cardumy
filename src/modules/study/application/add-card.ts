import { CardText } from '../domain/card-text.js';
import { Card } from '../domain/card.js';
import { findOwnedDeck } from './ownership.js';
import type { CardRepository } from './ports/card-repository.js';
import type { Clock } from '../../../shared/ports/clock.js';
import type { DeckRepository } from './ports/deck-repository.js';
import type { IdGenerator } from '../../../shared/ports/id-generator.js';
import { type CardView, toCardView } from './views.js';

export interface AddCardInput {
  userId: string;
  deckId: string;
  front: string;
  back: string;
}

export class AddCard {
  constructor(
    private readonly decks: DeckRepository,
    private readonly cards: CardRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: AddCardInput): Promise<CardView> {
    const deck = await findOwnedDeck(this.decks, input.deckId, input.userId);

    const card = Card.create({
      id: this.ids.next(),
      deckId: deck.id,
      front: CardText.create(input.front),
      back: CardText.create(input.back),
      now: this.clock.now(),
    });

    await this.cards.save(card);

    return toCardView(card);
  }
}
