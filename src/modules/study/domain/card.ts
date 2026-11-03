import type { CardImage } from './card-image.js';
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
    private _image: CardImage | null,
  ) {}

  static create({ id, deckId, front, back, now }: CreateCardProps): Card {
    return new Card(id, deckId, front, back, ReviewSchedule.forNewCard(now), now, null);
  }

  // Rebuilds a card saved earlier, with its review history.
  static restore(props: {
    id: string;
    deckId: string;
    front: CardText;
    back: CardText;
    schedule: ReviewSchedule;
    createdAt: Date;
    image?: CardImage | null;
  }): Card {
    return new Card(
      props.id,
      props.deckId,
      props.front,
      props.back,
      props.schedule,
      props.createdAt,
      props.image ?? null,
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

  get image(): CardImage | null {
    return this._image;
  }

  // Replaces any previous image. Only an image uploaded for this very card is
  // accepted, so a user cannot point their card at someone else's file.
  attachImage(image: CardImage): void {
    image.assertBelongsTo(this.id);
    this._image = image;
  }

  removeImage(): void {
    this._image = null;
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
