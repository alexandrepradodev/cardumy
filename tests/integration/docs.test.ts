import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { FastifyInstance } from 'fastify';

import { createInMemoryContainer } from '../../src/infra/container.js';
import { buildApp } from '../../src/infra/http/app.js';
import { TEST_JWT_SECRET } from '../support/http-test-kit.js';

interface OpenApiSpec {
  openapi: string;
  paths: Record<string, Record<string, { tags?: string[]; security?: unknown[] }>>;
  components: { securitySchemes: Record<string, { name: string }> };
}

describe('API docs', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = buildApp({ container: createInMemoryContainer(), jwtSecret: TEST_JWT_SECRET });
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves the Swagger UI at /docs without asking for a user', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });

  it('describes every route in the OpenAPI spec', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/json' });
    const spec = response.json<OpenApiSpec>();

    expect(spec.openapi).toBe('3.1.0');
    expect(Object.keys(spec.paths).sort()).toEqual([
      '/auth/login',
      '/auth/register',
      '/cards/{cardId}',
      '/cards/{cardId}/reviews',
      '/decks',
      '/decks/{deckId}',
      '/decks/{deckId}/cards',
      '/decks/{deckId}/cards/due',
      '/health',
    ]);
    expect(spec.paths['/cards/{cardId}/reviews']?.post?.tags).toEqual(['study']);
  });

  it('documents the x-user-id header and keeps /health, sign up and login public', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/json' });
    const spec = response.json<OpenApiSpec>();

    expect(spec.components.securitySchemes.userId?.name).toBe('x-user-id');
    expect(spec.paths['/health']?.get?.security).toEqual([]);
    expect(spec.paths['/auth/register']?.post?.security).toEqual([]);
    expect(spec.paths['/auth/login']?.post?.security).toEqual([]);
  });
});
