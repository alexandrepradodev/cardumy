import type { DeckName } from './deck-name.js';

interface CreateDeckProps {
  id: string;
  ownerId: string;
  name: DeckName;
  now: Date;
}

// Entity: a deck is identified by its id, not by its name.
// Renaming it keeps it the same deck.
export class Deck {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _name: DeckName,
    readonly createdAt: Date,
  ) {}

  static create({ id, ownerId, name, now }: CreateDeckProps): Deck {
    return new Deck(id, ownerId, name, now);
  }

  get name(): DeckName {
    return this._name;
  }

  rename(name: DeckName): void {
    this._name = name;
  }

  isOwnedBy(userId: string): boolean {
    return this.ownerId === userId;
  }

  equals(other: Deck): boolean {
    return this.id === other.id;
  }
}
