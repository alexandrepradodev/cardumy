import { randomUUID } from 'node:crypto';

import { afterAll, describe, expect, inject, it } from 'vitest';

import { S3FileStorage } from '../../../src/shared/adapters/s3-file-storage.js';
import type { UploadUrl } from '../../../src/shared/ports/file-storage.js';
import { fileStorageContract } from '../../support/contracts/file-storage-contract.js';

const files = new S3FileStorage(inject('storage'));

afterAll(() => {
  files.close();
});

// What a browser does with the upload URL. fetch computes content-length from
// the body itself, like a real client: a bigger file means a bigger length.
async function put(uploadUrl: UploadUrl, contentType: string, body: Uint8Array): Promise<number> {
  const response = await fetch(uploadUrl.url, {
    method: 'PUT',
    headers: { 'content-type': contentType },
    body,
  });
  return response.status;
}

fileStorageContract('S3 (RustFS)', () =>
  Promise.resolve({
    files,
    upload: async (_key, uploadUrl, body) => {
      const status = await put(uploadUrl, uploadUrl.headers['content-type'] ?? '', body);
      expect(status).toBe(200);
    },
  }),
);

// What only a real storage can prove: the signature itself enforces the
// declared type and size, before a single byte reaches the API.
describe('S3 presigned URLs', () => {
  const PNG = { contentType: 'image/png', sizeBytes: 10 };
  const freshKey = () => `presigned/${randomUUID()}.png`;

  it('refuses a file bigger than the declared size, and stores nothing', async () => {
    const key = freshKey();
    const uploadUrl = await files.createUploadUrl(key, PNG, 300);

    const status = await put(uploadUrl, 'image/png', new Uint8Array(PNG.sizeBytes + 1));

    expect(status).toBe(403);
    expect(await files.describe(key)).toBeNull();
  });

  it('refuses a file of another type than the declared one', async () => {
    const key = freshKey();
    const uploadUrl = await files.createUploadUrl(key, PNG, 300);

    const status = await put(uploadUrl, 'image/svg+xml', new Uint8Array(PNG.sizeBytes));

    expect(status).toBe(403);
    expect(await files.describe(key)).toBeNull();
  });

  it('serves a file only through a signed download URL (the bucket is private)', async () => {
    const key = freshKey();
    const uploadUrl = await files.createUploadUrl(key, PNG, 300);
    await put(uploadUrl, 'image/png', new Uint8Array(PNG.sizeBytes));

    const signed = await fetch(await files.createDownloadUrl(key, 60));
    const unsigned = await fetch(new URL(`/${inject('storage').bucket}/${key}`, uploadUrl.url));

    expect(signed.status).toBe(200);
    expect((await signed.arrayBuffer()).byteLength).toBe(PNG.sizeBytes);
    expect(unsigned.status).toBe(403);
  });
});
