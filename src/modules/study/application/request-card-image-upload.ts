import type { Clock } from '../../../shared/ports/clock.js';
import type { FileStorage } from '../../../shared/ports/file-storage.js';
import type { IdGenerator } from '../../../shared/ports/id-generator.js';
import { CardImage } from '../domain/card-image.js';
import { ImageFile } from '../domain/image-file.js';
import { findOwnedCard } from './ownership.js';
import type { CardRepository } from './ports/card-repository.js';
import type { DeckRepository } from './ports/deck-repository.js';
import type { ImageUploadView } from './views.js';

// Short on purpose: enough to start an upload, too short to be worth stealing.
export const IMAGE_UPLOAD_URL_TTL_SECONDS = 300;

export interface RequestCardImageUploadInput {
  userId: string;
  cardId: string;
  contentType: string;
  sizeBytes: number;
}

// Step 1 of 2 of an image upload: checks who asks and what they declare, then
// hands out a presigned URL. The card does not change until the upload is
// confirmed (AttachCardImage).
export class RequestCardImageUpload {
  constructor(
    private readonly decks: DeckRepository,
    private readonly cards: CardRepository,
    private readonly files: FileStorage,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: RequestCardImageUploadInput): Promise<ImageUploadView> {
    const card = await findOwnedCard(this.decks, this.cards, input.cardId, input.userId);
    const file = ImageFile.create(input);
    const image = CardImage.forCard(card.id, this.ids.next(), file);

    const upload = await this.files.createUploadUrl(
      image.key,
      { contentType: file.contentType, sizeBytes: file.sizeBytes },
      IMAGE_UPLOAD_URL_TTL_SECONDS,
    );

    return {
      key: image.key,
      url: upload.url,
      method: 'PUT',
      headers: upload.headers,
      expiresAt: new Date(this.clock.now().getTime() + IMAGE_UPLOAD_URL_TTL_SECONDS * 1000),
    };
  }
}
