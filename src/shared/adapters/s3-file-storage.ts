import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { FileDescription, FileStorage, UploadUrl } from '../ports/file-storage.js';

export interface S3Settings {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

// The headers the client must send exactly as declared. Left alone, the SDK
// signs content-length but NOT content-type: an "image/png" upload URL would
// also accept an SVG. Listing both puts them inside the signature.
const SIGNED_UPLOAD_HEADERS = new Set(['content-type', 'content-length']);

// FileStorage over the S3 API, so the same code talks to Cloudflare R2 in
// production and to RustFS locally; only the settings change.
export class S3FileStorage implements FileStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(settings: S3Settings) {
    this.bucket = settings.bucket;
    this.client = new S3Client({
      endpoint: settings.endpoint,
      region: settings.region,
      credentials: {
        accessKeyId: settings.accessKeyId,
        secretAccessKey: settings.secretAccessKey,
      },
      // "endpoint/bucket/key" instead of "bucket.endpoint/key": works with
      // R2 and with a local server that has no wildcard DNS.
      forcePathStyle: true,
      // Without these, the SDK puts a checksum of the (still empty) body in
      // every presigned upload URL. AWS S3 and R2 then refuse the real file
      // as corrupted; RustFS ignores that checksum, so tests cannot catch it.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  async createUploadUrl(
    key: string,
    file: FileDescription,
    expiresInSeconds: number,
  ): Promise<UploadUrl> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: file.contentType,
      ContentLength: file.sizeBytes,
    });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
      signableHeaders: SIGNED_UPLOAD_HEADERS,
    });
    return {
      url,
      headers: { 'content-type': file.contentType, 'content-length': String(file.sizeBytes) },
    };
  }

  createDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  // HEAD reads only the metadata (type and size), never the file's bytes.
  async describe(key: string): Promise<FileDescription | null> {
    try {
      const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return {
        contentType: head.ContentType ?? 'application/octet-stream',
        sizeBytes: head.ContentLength ?? 0,
      };
    } catch (error) {
      if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  // S3 answers a delete of a missing key with success, as the port asks.
  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  // Releases the HTTP connections the client keeps open.
  close(): void {
    this.client.destroy();
  }
}
