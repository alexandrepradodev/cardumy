// Port for an object storage (R2 in production, RustFS locally, memory in
// tests). Files are whole objects found by a key; the API never carries their
// bytes: clients upload and download them directly through presigned URLs.

export interface FileDescription {
  contentType: string;
  sizeBytes: number;
}

export interface UploadUrl {
  url: string;
  // Headers the client must send with the PUT, exactly as given: they are part
  // of the signature, so a different type or size is refused by the storage.
  headers: Record<string, string>;
}

export interface FileStorage {
  // A temporary URL that lets anyone holding it PUT exactly this file at `key`.
  createUploadUrl(key: string, file: FileDescription, expiresInSeconds: number): Promise<UploadUrl>;
  // A temporary URL that lets anyone holding it GET the file at `key`.
  createDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;
  // What really is stored at `key`, or null when nothing was uploaded there.
  describe(key: string): Promise<FileDescription | null>;
  // Deleting a key that does not exist is not an error.
  delete(key: string): Promise<void>;
}
