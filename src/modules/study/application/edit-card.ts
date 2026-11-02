import { CardText } from '../domain/card-text.js';
import { findOwnedCard } from './ownership.js';
import type { CardRepository } from './ports/card-repository.js';
import type { DeckRepository } from './ports/deck-repository.js';
import type { CardPresenter } from './card-presenter.js';
import type { CardView } from './views.js';

export interface EditCardInput {
  userId: string;
  cardId: string;
  front: string;
  back: string;
}

export class EditCard {
  constructor(
    private readonly decks: DeckRepository,
    private readonly cards: CardRepository,
    private readonly presenter: CardPresenter,
  ) {}

  async execute(input: EditCardInput): Promise<CardView> {
    const card = await findOwnedCard(this.decks, this.cards, input.cardId, input.userId);

    card.edit(CardText.create(input.front), CardText.create(input.back));
    await this.cards.save(card);

    return this.presenter.present(card);
  }
}
