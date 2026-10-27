import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { FastifyInstance } from 'fastify';

import { createInMemoryContainer } from '../../src/infra/container.js';
import { buildApp } from '../../src/infra/http/app.js';

describe('GET /health', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = buildApp({ container: createInMemoryContainer() });
  });

  afterEach(async () => {
    await app.close();
  });

  it('answers 200 with status ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('answers 404 for an unknown route', async () => {
    const response = await app.inject({ method: 'GET', url: '/healthz' });

    expect(response.statusCode).toBe(404);
  });
});
