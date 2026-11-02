import { describe, expect, it } from 'vitest';

import {
  ImageTooLargeError,
  UnsupportedImageTypeError,
} from '../../../../src/modules/study/domain/errors.js';
import { ImageFile, MAX_IMAGE_BYTES } from '../../../../src/modules/study/domain/image-file.js';

describe('ImageFile', () => {
  it.each([
    ['image/png', 'png'],
    ['image/jpeg', 'jpg'],
    ['image/webp', 'webp'],
  ])('accepts %s and names the file .%s', (contentType, extension) => {
    const file = ImageFile.create({ contentType, sizeBytes: 1024 });

    expect(file.contentType).toBe(contentType);
    expect(file.extension).toBe(extension);
  });

  it('ignores case and surrounding spaces in the type', () => {
    expect(ImageFile.create({ contentType: ' Image/PNG ', sizeBytes: 1 }).contentType).toBe(
      'image/png',
    );
  });

  it.each(['image/svg+xml', 'image/gif', 'application/pdf', 'text/html', ''])(
    'rejects the type "%s"',
    (contentType) => {
      expect(() => ImageFile.create({ contentType, sizeBytes: 1024 })).toThrow(
        UnsupportedImageTypeError,
      );
    },
  );

  it('accepts an image of exactly 5 MB', () => {
    expect(
      ImageFile.create({ contentType: 'image/png', sizeBytes: MAX_IMAGE_BYTES }).sizeBytes,
    ).toBe(MAX_IMAGE_BYTES);
  });

  it('rejects an image larger than 5 MB', () => {
    expect(() =>
      ImageFile.create({ contentType: 'image/png', sizeBytes: MAX_IMAGE_BYTES + 1 }),
    ).toThrow(ImageTooLargeError);
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects the size %s', (sizeBytes) => {
    expect(() => ImageFile.create({ contentType: 'image/png', sizeBytes })).toThrow(
      ImageTooLargeError,
    );
  });
});
