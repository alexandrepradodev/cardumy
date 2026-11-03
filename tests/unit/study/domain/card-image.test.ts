import { describe, expect, it } from 'vitest';

import { CardImage } from '../../../../src/modules/study/domain/card-image.js';
import { ImageFile } from '../../../../src/modules/study/domain/image-file.js';

const webp = ImageFile.create({ contentType: 'image/webp', sizeBytes: 2048 });

describe('CardImage', () => {
  it('builds the key from the card, a fresh image id and the file extension', () => {
    expect(CardImage.forCard('card-1', 'img-1', webp).key).toBe('cards/card-1/img-1.webp');
  });

  it('belongs to the card it was created for', () => {
    const image = CardImage.forCard('card-1', 'img-1', webp);

    expect(image.belongsTo('card-1')).toBe(true);
    expect(image.belongsTo('card-2')).toBe(false);
  });

  it.each([
    'cards/card-2/img-1.webp',
    'cards/card-1/../card-2/img-1.webp',
    'cards/card-1/img-1.svg',
    'cards/card-1/',
    'cards/card-10/img-1.webp',
    'other/card-1/img-1.webp',
  ])('does not let card-1 claim the key "%s"', (key) => {
    expect(CardImage.restore(key).belongsTo('card-1')).toBe(false);
  });

  it('is equal to another image with the same key', () => {
    expect(CardImage.restore('cards/c/i.png').equals(CardImage.restore('cards/c/i.png'))).toBe(
      true,
    );
  });
});
