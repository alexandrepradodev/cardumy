import { InvalidCardTextError } from './errors.js';

const MAX_LENGTH = 2000;

// Value object for the text on one side of a card (front or back).
export class CardText {
  private constructor(readonly value: string) {}

  static create(raw: string): CardText {
    const value = raw.trim();

    if (value.length === 0) {
      throw new InvalidCardTextError('Card text cannot be empty');
    }
    if (value.length > MAX_LENGTH) {
      throw new InvalidCardTextError(`Card text cannot exceed ${String(MAX_LENGTH)} characters`);
    }

    return new CardText(value);
  }

  equals(other: CardText): boolean {
    return this.value === other.value;
  }
}
