import { ImageTooLargeError, UnsupportedImageTypeError } from './errors.js';

// Formats every browser shows. SVG is left out on purpose: it can carry scripts.
const EXTENSIONS = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
} as const;

export type ImageContentType = keyof typeof EXTENSIONS;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function isImageContentType(value: string): value is ImageContentType {
  return Object.hasOwn(EXTENSIONS, value);
}

// Value object for an image file a user wants to put on a card: its type and
// size, checked before upload (what the client declares) and again after
// (what really arrived in the storage).
export class ImageFile {
  private constructor(
    readonly contentType: ImageContentType,
    readonly sizeBytes: number,
  ) {}

  static create({ contentType, sizeBytes }: { contentType: string; sizeBytes: number }): ImageFile {
    const type = contentType.trim().toLowerCase();

    if (!isImageContentType(type)) {
      throw new UnsupportedImageTypeError('Card images must be PNG, JPEG or WebP');
    }
    if (!Number.isInteger(sizeBytes) || sizeBytes < 1) {
      throw new ImageTooLargeError('Image size must be a positive number of bytes');
    }
    if (sizeBytes > MAX_IMAGE_BYTES) {
      throw new ImageTooLargeError(
        `Card images cannot exceed ${String(MAX_IMAGE_BYTES / 1024 / 1024)} MB`,
      );
    }

    return new ImageFile(type, sizeBytes);
  }

  get extension(): string {
    return EXTENSIONS[this.contentType];
  }
}
