import { CardText } from '../domain/card-text.js';
import { Card } from '../domain/card.js';
import { DeckNotFoundError } from './errors.js';
import type { CardRepository } from './ports/card-repository.js';
import type { Clock } from './ports/clock.js';
import type { DeckRepository } from './ports/deck-repository.js';
import type { IdGenerator } from './ports/id-generator.js';

export interface AddCardInput {
  userId: string;
  deckId: string;
  front: string;
  back: string;
}

export interface AddCardOutput {
  cardId: string;
}

export class AddCard {
  constructor(
    private readonly decks: DeckRepository,
    private readonly cards: CardRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: AddCardInput): Promise<AddCardOutput> {
    const deck = await this.decks.findById(input.deckId);
    if (!deck?.isOwnedBy(input.userId)) {
      throw new DeckNotFoundError(input.deckId);
    }

    const card = Card.create({
      id: this.ids.next(),
      deckId: deck.id,
      front: CardText.create(input.front),
      back: CardText.create(input.back),
      now: this.clock.now(),
    });

    await this.cards.save(card);

    return { cardId: card.id };
  }
}
