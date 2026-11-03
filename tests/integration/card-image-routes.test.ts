import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { asUser, makeHttpKit } from '../support/http-test-kit.js';
import { START } from '../support/study-test-kit.js';

interface UploadJson {
  key: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  expiresAt: string;
}

const PNG = { contentType: 'image/png', sizeBytes: 48_213 };

describe('card image routes', () => {
  let kit: ReturnType<typeof makeHttpKit>;
  let cardId: string;

  beforeEach(async () => {
    kit = makeHttpKit();
    const deck = await kit.app.inject({
      method: 'POST',
      url: '/decks',
      headers: asUser('alexandre'),
      payload: { name: 'English' },
    });
    const card = await kit.app.inject({
      method: 'POST',
      url: `/decks/${deck.json<{ id: string }>().id}/cards`,
      headers: asUser('alexandre'),
      payload: { front: 'apple', back: 'maçã' },
    });
    cardId = card.json<{ id: string }>().id;
  });

  afterEach(async () => {
    await kit.app.close();
  });

  function requestUpload(payload: object = PNG, user = 'alexandre', id = cardId) {
    return kit.app.inject({
      method: 'POST',
      url: `/cards/${id}/image/upload`,
      headers: asUser(user),
      payload,
    });
  }

  function confirm(key: string, user = 'alexandre') {
    return kit.app.inject({
      method: 'PUT',
      url: `/cards/${cardId}/image`,
      headers: asUser(user),
      payload: { key },
    });
  }

  // Plays the client sending the file through the presigned URL.
  async function uploadedKey(file = PNG): Promise<string> {
    const { key } = (await requestUpload()).json<UploadJson>();
    kit.files.put(key, file);
    return key;
  }

  describe('POST /cards/:cardId/image/upload', () => {
    it('hands out a presigned URL with the headers to send', async () => {
      const response = await requestUpload();

      expect(response.statusCode).toBe(200);
      const upload = response.json<UploadJson>();
      expect(upload.key).toMatch(new RegExp(`^cards/${cardId}/.+\\.png$`));
      expect(upload.method).toBe('PUT');
      expect(upload.headers).toEqual({ 'content-type': 'image/png', 'content-length': '48213' });
      expect(upload.expiresAt).toBe(new Date(START.getTime() + 300_000).toISOString());
    });

    it('refuses a type that is not an allowed image, and a file above 5 MB', async () => {
      const svg = await requestUpload({ contentType: 'image/svg+xml', sizeBytes: 100 });
      const huge = await requestUpload({ contentType: 'image/png', sizeBytes: 6 * 1024 * 1024 });

      expect(svg.statusCode).toBe(400);
      expect(svg.json<{ code: string }>().code).toBe('UnsupportedImageTypeError');
      expect(huge.statusCode).toBe(400);
      expect(huge.json<{ code: string }>().code).toBe('ImageTooLargeError');
    });

    it('answers 400 when the size is missing or not a whole number', async () => {
      const missing = await requestUpload({ contentType: 'image/png' });
      const fraction = await requestUpload({ contentType: 'image/png', sizeBytes: 1.5 });

      expect(missing.json<{ code: string }>().code).toBe('VALIDATION_FAILED');
      expect(fraction.json<{ code: string }>().code).toBe('VALIDATION_FAILED');
    });

    it('answers 404 for a card of someone else, and 401 without a token', async () => {
      const intruder = await requestUpload(PNG, 'intruder');
      const anonymous = await kit.app.inject({
        method: 'POST',
        url: `/cards/${cardId}/image/upload`,
        payload: PNG,
      });

      expect(intruder.statusCode).toBe(404);
      expect(anonymous.statusCode).toBe(401);
    });
  });

  describe('PUT /cards/:cardId/image', () => {
    it('attaches the uploaded file, and every card view carries a download URL', async () => {
      const key = await uploadedKey();

      const response = await confirm(key);
      const due = await kit.app.inject({
        method: 'GET',
        url: `/decks/${response.json<{ deckId: string }>().deckId}/cards/due`,
        headers: asUser('alexandre'),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json<{ imageUrl: string }>().imageUrl).toContain(key);
      expect(due.json<{ imageUrl: string }[]>()[0]?.imageUrl).toContain(key);
    });

    it('answers 409 when nothing was uploaded yet', async () => {
      const { key } = (await requestUpload()).json<UploadJson>();

      const response = await confirm(key);

      expect(response.statusCode).toBe(409);
      expect(response.json<{ code: string }>().code).toBe('ImageNotUploadedError');
    });

    it('refuses a key that was not issued for this card', async () => {
      const response = await confirm('cards/another-card/stolen.png');

      expect(response.statusCode).toBe(400);
      expect(response.json<{ code: string }>().code).toBe('ImageOfAnotherCardError');
    });

    it('refuses, and deletes, a file that arrived different from the rules', async () => {
      const key = await uploadedKey({ contentType: 'image/svg+xml', sizeBytes: 100 });

      const response = await confirm(key);

      expect(response.statusCode).toBe(400);
      expect(kit.files.has(key)).toBe(false);
    });
  });

  describe('DELETE /cards/:cardId/image', () => {
    it('removes the image from the card and deletes its file', async () => {
      const key = await uploadedKey();
      await confirm(key);

      const response = await kit.app.inject({
        method: 'DELETE',
        url: `/cards/${cardId}/image`,
        headers: asUser('alexandre'),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json<{ imageUrl: null }>().imageUrl).toBeNull();
      expect(kit.files.has(key)).toBe(false);
    });
  });
});
