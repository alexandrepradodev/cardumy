import { describe, expect, it } from 'vitest';

import {
  CardNotFoundError,
  ImageNotUploadedError,
} from '../../../../src/modules/study/application/errors.js';
import { IMAGE_UPLOAD_URL_TTL_SECONDS } from '../../../../src/modules/study/application/request-card-image-upload.js';
import {
  ImageOfAnotherCardError,
  ImageTooLargeError,
  UnsupportedImageTypeError,
} from '../../../../src/modules/study/domain/errors.js';
import { START, makeStudyKit } from '../../../support/study-test-kit.js';

const PNG = { contentType: 'image/png', sizeBytes: 2048 };

async function kitWithCard() {
  const kit = makeStudyKit();
  const { id: deckId } = await kit.createDeck.execute({ ownerId: 'user-1', name: 'Geography' });
  const { id: cardId } = await kit.addCard.execute({
    userId: 'user-1',
    deckId,
    front: 'Where is Peru?',
    back: 'South America',
  });
  return { ...kit, deckId, cardId };
}

// What the client does between the two calls: PUT the bytes to the URL.
async function uploadImage(kit: Awaited<ReturnType<typeof kitWithCard>>, file = PNG) {
  const upload = await kit.requestCardImageUpload.execute({
    userId: 'user-1',
    cardId: kit.cardId,
    ...file,
  });
  kit.files.put(upload.key, file);
  return upload;
}

describe('RequestCardImageUpload', () => {
  it('hands out a short-lived upload URL for a fresh key of this card', async () => {
    const { requestCardImageUpload, cardId } = await kitWithCard();

    const upload = await requestCardImageUpload.execute({ userId: 'user-1', cardId, ...PNG });

    expect(upload.key).toMatch(new RegExp(`^cards/${cardId}/[\\w-]+\\.png$`));
    expect(upload.method).toBe('PUT');
    expect(upload.url).toContain(upload.key);
    expect(upload.headers).toEqual({ 'content-type': 'image/png', 'content-length': '2048' });
    expect(upload.expiresAt).toEqual(
      new Date(START.getTime() + IMAGE_UPLOAD_URL_TTL_SECONDS * 1000),
    );
  });

  it('gives a different key to each upload', async () => {
    const { requestCardImageUpload, cardId } = await kitWithCard();

    const first = await requestCardImageUpload.execute({ userId: 'user-1', cardId, ...PNG });
    const second = await requestCardImageUpload.execute({ userId: 'user-1', cardId, ...PNG });

    expect(first.key).not.toBe(second.key);
  });

  it('does not change the card yet', async () => {
    const kit = await kitWithCard();

    await kit.requestCardImageUpload.execute({ userId: 'user-1', cardId: kit.cardId, ...PNG });

    expect((await kit.cards.findById(kit.cardId))?.image).toBeNull();
  });

  it.each([
    [{ contentType: 'image/svg+xml', sizeBytes: 100 }, UnsupportedImageTypeError],
    [{ contentType: 'image/png', sizeBytes: 6 * 1024 * 1024 }, ImageTooLargeError],
  ])('refuses a file that breaks the rules (%o)', async (file, error) => {
    const { requestCardImageUpload, cardId } = await kitWithCard();

    await expect(
      requestCardImageUpload.execute({ userId: 'user-1', cardId, ...file }),
    ).rejects.toThrow(error);
  });

  it("does not hand out a URL for someone else's card", async () => {
    const { requestCardImageUpload, cardId } = await kitWithCard();

    await expect(
      requestCardImageUpload.execute({ userId: 'user-2', cardId, ...PNG }),
    ).rejects.toThrow(CardNotFoundError);
  });
});

describe('AttachCardImage', () => {
  it('attaches the uploaded image and shows it through a download link', async () => {
    const kit = await kitWithCard();
    const { key } = await uploadImage(kit);

    const card = await kit.attachCardImage.execute({ userId: 'user-1', cardId: kit.cardId, key });

    expect(card.imageUrl).toContain(key);
    expect((await kit.cards.findById(kit.cardId))?.image?.key).toBe(key);
  });

  it('shows the image in the card lists too', async () => {
    const kit = await kitWithCard();
    const { key } = await uploadImage(kit);
    await kit.attachCardImage.execute({ userId: 'user-1', cardId: kit.cardId, key });

    const [listed] = await kit.listCards.execute({ userId: 'user-1', deckId: kit.deckId });

    expect(listed?.imageUrl).toContain(key);
  });

  it('refuses to attach when nothing was uploaded', async () => {
    const kit = await kitWithCard();
    const { key } = await kit.requestCardImageUpload.execute({
      userId: 'user-1',
      cardId: kit.cardId,
      ...PNG,
    });

    await expect(
      kit.attachCardImage.execute({ userId: 'user-1', cardId: kit.cardId, key }),
    ).rejects.toThrow(ImageNotUploadedError);
    expect((await kit.cards.findById(kit.cardId))?.image).toBeNull();
  });

  it('checks the file that really arrived, deleting it when it breaks the rules', async () => {
    const kit = await kitWithCard();
    const { key } = await kit.requestCardImageUpload.execute({
      userId: 'user-1',
      cardId: kit.cardId,
      ...PNG,
    });
    // The client declared a small PNG but something else got there.
    kit.files.put(key, { contentType: 'text/html', sizeBytes: 2048 });

    await expect(
      kit.attachCardImage.execute({ userId: 'user-1', cardId: kit.cardId, key }),
    ).rejects.toThrow(UnsupportedImageTypeError);
    expect(kit.files.has(key)).toBe(false);
    expect((await kit.cards.findById(kit.cardId))?.image).toBeNull();
  });

  it("refuses a key uploaded for another card, even one of the user's own", async () => {
    const kit = await kitWithCard();
    const other = await kit.addCard.execute({
      userId: 'user-1',
      deckId: kit.deckId,
      front: 'a',
      back: 'b',
    });
    const { key } = await uploadImage(kit);

    await expect(
      kit.attachCardImage.execute({ userId: 'user-1', cardId: other.id, key }),
    ).rejects.toThrow(ImageOfAnotherCardError);
  });

  it('replaces the previous image and deletes its file', async () => {
    const kit = await kitWithCard();
    const first = await uploadImage(kit);
    await kit.attachCardImage.execute({ userId: 'user-1', cardId: kit.cardId, key: first.key });
    const second = await uploadImage(kit);

    await kit.attachCardImage.execute({ userId: 'user-1', cardId: kit.cardId, key: second.key });

    expect((await kit.cards.findById(kit.cardId))?.image?.key).toBe(second.key);
    expect(kit.files.has(first.key)).toBe(false);
    expect(kit.files.has(second.key)).toBe(true);
  });

  it('can be confirmed twice without losing the image', async () => {
    const kit = await kitWithCard();
    const { key } = await uploadImage(kit);
    await kit.attachCardImage.execute({ userId: 'user-1', cardId: kit.cardId, key });

    const again = await kit.attachCardImage.execute({ userId: 'user-1', cardId: kit.cardId, key });

    expect(again.imageUrl).toContain(key);
    expect(kit.files.has(key)).toBe(true);
  });
});

describe('RemoveCardImage', () => {
  it('removes the image from the card and deletes its file', async () => {
    const kit = await kitWithCard();
    const { key } = await uploadImage(kit);
    await kit.attachCardImage.execute({ userId: 'user-1', cardId: kit.cardId, key });

    const card = await kit.removeCardImage.execute({ userId: 'user-1', cardId: kit.cardId });

    expect(card.imageUrl).toBeNull();
    expect(kit.files.has(key)).toBe(false);
  });

  it('does nothing on a card without an image', async () => {
    const kit = await kitWithCard();

    const card = await kit.removeCardImage.execute({ userId: 'user-1', cardId: kit.cardId });

    expect(card.imageUrl).toBeNull();
  });
});

describe('deleting cards with images', () => {
  it('DeleteCard deletes the image file too', async () => {
    const kit = await kitWithCard();
    const { key } = await uploadImage(kit);
    await kit.attachCardImage.execute({ userId: 'user-1', cardId: kit.cardId, key });

    await kit.deleteCard.execute({ userId: 'user-1', cardId: kit.cardId });

    expect(kit.files.has(key)).toBe(false);
  });

  it('DeleteDeck deletes the image files of its cards', async () => {
    const kit = await kitWithCard();
    const { key } = await uploadImage(kit);
    await kit.attachCardImage.execute({ userId: 'user-1', cardId: kit.cardId, key });

    await kit.deleteDeck.execute({ userId: 'user-1', deckId: kit.deckId });

    expect(kit.files.has(key)).toBe(false);
  });
});
