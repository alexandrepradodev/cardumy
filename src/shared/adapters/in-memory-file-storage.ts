import type { FileDescription, FileStorage, UploadUrl } from '../ports/file-storage.js';

// Object storage in a Map, for tests and the in-memory container. URLs are
// fake (memory://) since there is no server to send them to; put() plays the
// part of the client that uploads through the presigned URL.
export class InMemoryFileStorage implements FileStorage {
  private readonly objects = new Map<string, FileDescription>();

  createUploadUrl(
    key: string,
    file: FileDescription,
    expiresInSeconds: number,
  ): Promise<UploadUrl> {
    return Promise.resolve({
      url: `memory://${key}?upload&expires=${String(expiresInSeconds)}`,
      headers: { 'content-type': file.contentType, 'content-length': String(file.sizeBytes) },
    });
  }

  createDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    return Promise.resolve(`memory://${key}?expires=${String(expiresInSeconds)}`);
  }

  describe(key: string): Promise<FileDescription | null> {
    return Promise.resolve(this.objects.get(key) ?? null);
  }

  delete(key: string): Promise<void> {
    this.objects.delete(key);
    return Promise.resolve();
  }

  put(key: string, file: FileDescription): void {
    this.objects.set(key, { ...file });
  }

  has(key: string): boolean {
    return this.objects.has(key);
  }
}
