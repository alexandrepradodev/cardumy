import type { CardText } from './card-text.js';

interface CreateCardProps {
  id: string;
  deckId: string;
  front: CardText;
  back: CardText;
  now: Date;
}

// Entity and aggregate root: a card is its own aggregate (decision B),
// so it only references its deck by id instead of living inside it.
export class Card {
  private constructor(
    readonly id: string,
    readonly deckId: string,
    private _front: CardText,
    private _back: CardText,
    readonly createdAt: Date,
  ) {}

  static create({ id, deckId, front, back, now }: CreateCardProps): Card {
    return new Card(id, deckId, front, back, now);
  }

  get front(): CardText {
    return this._front;
  }

  get back(): CardText {
    return this._back;
  }

  edit(front: CardText, back: CardText): void {
    this._front = front;
    this._back = back;
  }

  equals(other: Card): boolean {
    return this.id === other.id;
  }
}
