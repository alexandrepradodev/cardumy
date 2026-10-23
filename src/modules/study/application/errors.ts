// Something the use case looked for does not exist (or belongs to someone
// else, which we report the same way so ids of other users never leak).
// Adapters translate it later (for example, HTTP turns it into a 404).
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class DeckNotFoundError extends NotFoundError {
  constructor(deckId: string) {
    super(`Deck ${deckId} not found`);
  }
}

export class CardNotFoundError extends NotFoundError {
  constructor(cardId: string) {
    super(`Card ${cardId} not found`);
  }
}
