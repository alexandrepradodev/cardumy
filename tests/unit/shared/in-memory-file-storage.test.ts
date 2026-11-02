import { describe, expect, it } from 'vitest';

import { InMemoryFileStorage } from '../../../src/shared/adapters/in-memory-file-storage.js';

describe('InMemoryFileStorage', () => {
  it('describes a stored file and forgets it after delete', async () => {
    const files = new InMemoryFileStorage();
    files.put('a/b.png', { contentType: 'image/png', sizeBytes: 10 });

    expect(await files.describe('a/b.png')).toEqual({ contentType: 'image/png', sizeBytes: 10 });

    await files.delete('a/b.png');

    expect(await files.describe('a/b.png')).toBeNull();
  });

  it('does not fail when deleting a key that does not exist', async () => {
    await expect(new InMemoryFileStorage().delete('nothing/here.png')).resolves.toBeUndefined();
  });

  it('asks the client to send the declared type and size with the upload', async () => {
    const upload = await new InMemoryFileStorage().createUploadUrl(
      'a/b.png',
      { contentType: 'image/png', sizeBytes: 10 },
      300,
    );

    expect(upload.headers).toEqual({ 'content-type': 'image/png', 'content-length': '10' });
  });
});
