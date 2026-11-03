import type { FileStorage } from '../../../shared/ports/file-storage.js';
import type { Card } from '../domain/card.js';
import { type CardView, toCardView } from './views.js';

// Download links last as long as an access token: a client that can still
// call the API can still see the images it got.
export const IMAGE_DOWNLOAD_URL_TTL_SECONDS = 3600;

// Turns cards into views. Async because showing an image needs a fresh
// presigned link from the storage (the bucket is private).
export class CardPresenter {
  constructor(private readonly files: FileStorage) {}

  async present(card: Card): Promise<CardView> {
    const imageUrl =
      card.image === null
        ? null
        : await this.files.createDownloadUrl(card.image.key, IMAGE_DOWNLOAD_URL_TTL_SECONDS);
    return toCardView(card, imageUrl);
  }

  presentAll(cards: Card[]): Promise<CardView[]> {
    return Promise.all(cards.map((card) => this.present(card)));
  }
}
