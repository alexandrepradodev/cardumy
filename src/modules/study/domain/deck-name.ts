import { InvalidDeckNameError } from './errors.js';

const MAX_LENGTH = 100;

// Value object: a deck name that is always valid. The private constructor
// forces everyone through create(), so an invalid name can never exist.
export class DeckName {
  private constructor(readonly value: string) {}

  static create(raw: string): DeckName {
    const value = raw.trim();

    if (value.length === 0) {
      throw new InvalidDeckNameError('Deck name cannot be empty');
    }
    if (value.length > MAX_LENGTH) {
      throw new InvalidDeckNameError(`Deck name cannot exceed ${String(MAX_LENGTH)} characters`);
    }

    return new DeckName(value);
  }

  equals(other: DeckName): boolean {
    return this.value === other.value;
  }
}
