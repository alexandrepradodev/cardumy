import type { ImageFile } from './image-file.js';

const FILE_NAME = /^[A-Za-z0-9-]+\.(png|jpg|webp)$/;

// Value object for the image attached to a card. The file itself lives in the
// object storage; the card only keeps its key, like a cloakroom ticket.
// Keys are "cards/<cardId>/<imageId>.<ext>": the card id in the key is what
// lets a card refuse an image uploaded for another card.
export class CardImage {
  private constructor(readonly key: string) {}

  // A new, never used key for this card. A fresh imageId per upload means a
  // replaced image never collides with the old one (no stale caches).
  static forCard(cardId: string, imageId: string, file: ImageFile): CardImage {
    return new CardImage(`cards/${cardId}/${imageId}.${file.extension}`);
  }

  // Rebuilds an image key saved earlier, or one sent back by a client.
  static restore(key: string): CardImage {
    return new CardImage(key);
  }

  // Exact shape, not just the prefix: "cards/<cardId>/../other" or any other
  // trick in a key sent by a client does not pass.
  belongsTo(cardId: string): boolean {
    const prefix = `cards/${cardId}/`;
    return this.key.startsWith(prefix) && FILE_NAME.test(this.key.slice(prefix.length));
  }

  equals(other: CardImage): boolean {
    return this.key === other.key;
  }
}
