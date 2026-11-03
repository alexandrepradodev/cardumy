import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { GenericContainer, Wait } from 'testcontainers';
import type { TestProject } from 'vitest/node';

import type { S3Settings } from '../../src/shared/adapters/s3-file-storage.js';

declare module 'vitest' {
  export interface ProvidedContext {
    storage: S3Settings;
  }
}

const S3_PORT = 9000;

// Runs once before the container tests: starts a brand-new RustFS (same image
// as compose.yaml), creates the bucket and hands the settings to the tests.
export default async function setup(project: TestProject) {
  const credentials = { accessKeyId: 'cardumy', secretAccessKey: 'cardumy-test-secret' };
  const container = await new GenericContainer('rustfs/rustfs:1.0.4')
    .withEnvironment({
      RUSTFS_ACCESS_KEY: credentials.accessKeyId,
      RUSTFS_SECRET_KEY: credentials.secretAccessKey,
    })
    .withExposedPorts(S3_PORT)
    .withWaitStrategy(Wait.forHttp('/health', S3_PORT))
    .start();

  const storage: S3Settings = {
    endpoint: `http://${container.getHost()}:${String(container.getMappedPort(S3_PORT))}`,
    region: 'us-east-1',
    bucket: 'cardumy-test',
    ...credentials,
  };

  const client = new S3Client({
    endpoint: storage.endpoint,
    region: storage.region,
    credentials,
    forcePathStyle: true,
  });
  await client.send(new CreateBucketCommand({ Bucket: storage.bucket }));
  client.destroy();

  project.provide('storage', storage);

  return async () => {
    await container.stop();
  };
}
