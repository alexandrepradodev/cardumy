import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import type { FileStorage, UploadUrl } from '../../../src/shared/ports/file-storage.js';

export interface FileStorageUnderTest {
  files: FileStorage;
  // Plays the client: sends `body` through the presigned upload URL.
  upload(key: string, uploadUrl: UploadUrl, body: Uint8Array): Promise<void>;
}

const PNG = { contentType: 'image/png', sizeBytes: 10 };

// Every test uses a key no other test touches, so a real bucket shared by
// all tests never needs to be emptied.
const freshKey = () => `contract/${randomUUID()}.png`;

// Contract test: the SAME expectations run against every FileStorage adapter.
// If memory and S3 both pass, the use cases cannot tell them apart.
export function fileStorageContract(
  adapterName: string,
  makeStorage: () => Promise<FileStorageUnderTest>,
): void {
  describe(`${adapterName} file storage (contract)`, () => {
    let storage: FileStorageUnderTest;

    beforeEach(async () => {
      storage = await makeStorage();
    });

    async function uploaded(key: string): Promise<void> {
      const uploadUrl = await storage.files.createUploadUrl(key, PNG, 300);
      await storage.upload(key, uploadUrl, new Uint8Array(PNG.sizeBytes));
    }

    it('asks the client to send the declared type and size with the upload', async () => {
      const uploadUrl = await storage.files.createUploadUrl(freshKey(), PNG, 300);

      expect(uploadUrl.headers).toEqual({ 'content-type': 'image/png', 'content-length': '10' });
    });

    it('describes an uploaded file with its type and size', async () => {
      const key = freshKey();
      await uploaded(key);

      expect(await storage.files.describe(key)).toEqual(PNG);
    });

    it('describes a key with nothing uploaded as null', async () => {
      expect(await storage.files.describe(freshKey())).toBeNull();
    });

    it('deletes a file, and deleting a missing key is not an error', async () => {
      const key = freshKey();
      await uploaded(key);

      await storage.files.delete(key);

      expect(await storage.files.describe(key)).toBeNull();
      await expect(storage.files.delete(freshKey())).resolves.toBeUndefined();
    });
  });
}
