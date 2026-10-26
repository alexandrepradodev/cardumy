import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { FastifyInstance } from 'fastify';

import { buildApp } from '../../src/infra/http/app.js';

interface OpenApiSpec {
  openapi: string;
  paths: Record<string, Record<string, { tags?: string[]; security?: unknown[] }>>;
  components: { securitySchemes: Record<string, { name: string }> };
}

describe('API docs', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = buildApp();
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

  it('documents the x-user-id header and keeps /health public', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/json' });
    const spec = response.json<OpenApiSpec>();

    expect(spec.components.securitySchemes.userId?.name).toBe('x-user-id');
    expect(spec.paths['/health']?.get?.security).toEqual([]);
  });
});
