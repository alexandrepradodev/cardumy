import type { CardText } from './card-text.js';
import type { Rating } from './rating.js';
import { ReviewSchedule } from './review-schedule.js';

interface CreateCardProps {
  id: string;
  deckId: string;
  front: CardText;
  back: CardText;
  now: Date;
}

// Entity and aggregate root: a card is its own aggregate (decision B),
// so it only references its deck by id instead of living inside it.
// Its schedule can only change through review(), never directly.
export class Card {
  private constructor(
    readonly id: string,
    readonly deckId: string,
    private _front: CardText,
    private _back: CardText,
    private _schedule: ReviewSchedule,
    readonly createdAt: Date,
  ) {}

  static create({ id, deckId, front, back, now }: CreateCardProps): Card {
    return new Card(id, deckId, front, back, ReviewSchedule.forNewCard(now), now);
  }

  // Rebuilds a card saved earlier, with its review history.
  static restore(props: {
    id: string;
    deckId: string;
    front: CardText;
    back: CardText;
    schedule: ReviewSchedule;
    createdAt: Date;
  }): Card {
    return new Card(
      props.id,
      props.deckId,
      props.front,
      props.back,
      props.schedule,
      props.createdAt,
    );
  }

  get front(): CardText {
    return this._front;
  }

  get back(): CardText {
    return this._back;
  }

  get schedule(): ReviewSchedule {
    return this._schedule;
  }

  edit(front: CardText, back: CardText): void {
    this._front = front;
    this._back = back;
  }

  isDue(now: Date): boolean {
    return this._schedule.isDue(now);
  }

  review(rating: Rating, now: Date): void {
    this._schedule = this._schedule.next(rating, now);
  }

  equals(other: Card): boolean {
    return this.id === other.id;
  }
}
