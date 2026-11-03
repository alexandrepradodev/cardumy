import { ConflictError, NotFoundError } from '../../../shared/errors.js';

export { NotFoundError };

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

export class ImageNotUploadedError extends ConflictError {
  constructor(key: string) {
    super(`No file was uploaded to ${key} yet`);
  }
}
