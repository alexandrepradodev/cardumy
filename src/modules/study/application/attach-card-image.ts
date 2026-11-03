import type { FileStorage } from '../../../shared/ports/file-storage.js';
import { CardImage } from '../domain/card-image.js';
import { ImageFile } from '../domain/image-file.js';
import type { CardPresenter } from './card-presenter.js';
import { ImageNotUploadedError } from './errors.js';
import { findOwnedCard } from './ownership.js';
import type { CardRepository } from './ports/card-repository.js';
import type { DeckRepository } from './ports/deck-repository.js';
import type { CardView } from './views.js';

export interface AttachCardImageInput {
  userId: string;
  cardId: string;
  key: string;
}

// Step 2 of 2 of an image upload: the client says "done", and the card only
// takes the image after checking what really arrived in the storage.
export class AttachCardImage {
  constructor(
    private readonly decks: DeckRepository,
    private readonly cards: CardRepository,
    private readonly files: FileStorage,
    private readonly presenter: CardPresenter,
  ) {}

  async execute(input: AttachCardImageInput): Promise<CardView> {
    const card = await findOwnedCard(this.decks, this.cards, input.cardId, input.userId);
    const image = CardImage.restore(input.key);
    const previous = card.image;

    // Confirming the same upload twice changes nothing (safe to retry).
    if (previous?.equals(image)) {
      return this.presenter.present(card);
    }

    // First the rule (is this key for this card?), before asking the storage
    // anything, or deleting anything, under a key that may be someone else's.
    image.assertBelongsTo(card.id);

    const stored = await this.files.describe(image.key);
    if (stored === null) {
      throw new ImageNotUploadedError(image.key);
    }
    try {
      // Never trust what the client declared: check the file that arrived.
      ImageFile.create(stored);
    } catch (error) {
      await this.files.delete(image.key);
      throw error;
    }

    card.attachImage(image);
    await this.cards.save(card);
    // Only after the card points at the new image is the old file removed.
    if (previous !== null) {
      await this.files.delete(previous.key);
    }

    return this.presenter.present(card);
  }
}
