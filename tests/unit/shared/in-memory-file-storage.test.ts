import { InMemoryFileStorage } from '../../../src/shared/adapters/in-memory-file-storage.js';
import { fileStorageContract } from '../../support/contracts/file-storage-contract.js';

fileStorageContract('in-memory', () => {
  const files = new InMemoryFileStorage();
  return Promise.resolve({
    files,
    // There is no server behind a memory:// URL: store what the client sent.
    upload: (key, uploadUrl, body) => {
      files.put(key, {
        contentType: uploadUrl.headers['content-type'] ?? '',
        sizeBytes: body.length,
      });
      return Promise.resolve();
    },
  });
});
