import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../src/infra/http/current-user.js';
import { createInMemoryContainer } from '../../src/infra/container.js';
import { buildApp } from '../../src/infra/http/app.js';
import { TEST_JWT_SECRET } from '../support/http-test-kit.js';
import { EmailAlreadyInUseError } from '../../src/modules/accounts/application/errors.js';
import { DeckNotFoundError } from '../../src/modules/study/application/errors.js';
import { InvalidDeckNameError } from '../../src/modules/study/domain/errors.js';

// Test-only routes that throw each kind of error, to check how the API answers.
function buildAppWithTestRoutes(): FastifyInstance {
  const app = buildApp({ container: createInMemoryContainer(), jwtSecret: TEST_JWT_SECRET });

  app.get('/test/domain-error', () => {
    throw new InvalidDeckNameError('Deck name cannot be empty');
  });
  app.get('/test/not-found', () => {
    throw new DeckNotFoundError('deck-42');
  });
  app.get('/test/conflict', () => {
    throw new EmailAlreadyInUseError();
  });
  app.get('/test/crash', () => {
    throw new Error('database password is hunter2');
  });
  app.post(
    '/test/validation',
    {
      schema: {
        body: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
    },
    () => ({ ok: true }),
  );
  app.get('/test/whoami', { onRequest: authenticate }, (request) => ({ userId: request.userId }));

  return app;
}

describe('error handling (Problem Details)', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = buildAppWithTestRoutes();
  });

  afterEach(async () => {
    await app.close();
  });

  it('answers a broken business rule with 400', async () => {
    const response = await app.inject({ method: 'GET', url: '/test/domain-error' });

    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toEqual({
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      detail: 'Deck name cannot be empty',
      instance: '/test/domain-error',
      code: 'InvalidDeckNameError',
    });
  });

  it('answers a missing resource with 404', async () => {
    const response = await app.inject({ method: 'GET', url: '/test/not-found' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      status: 404,
      code: 'DeckNotFoundError',
      detail: 'Deck deck-42 not found',
    });
  });

  it('answers a clash with existing data with 409', async () => {
    const response = await app.inject({ method: 'GET', url: '/test/conflict' });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      status: 409,
      code: 'EmailAlreadyInUseError',
      detail: 'This email is already in use',
    });
  });

  it('answers an invalid body with 400 and the field that failed', async () => {
    const response = await app.inject({ method: 'POST', url: '/test/validation', payload: {} });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'name', message: expect.any(String) as string }],
    });
  });

  it('answers an unknown route with a 404 problem', async () => {
    const response = await app.inject({ method: 'GET', url: '/nope' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'ROUTE_NOT_FOUND', instance: '/nope' });
  });

  it('answers an unexpected error with 500 and never leaks its message', async () => {
    const response = await app.inject({ method: 'GET', url: '/test/crash' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({ code: 'INTERNAL_ERROR' });
    expect(response.body).not.toContain('hunter2');
  });
});

describe('temporary authentication (x-user-id)', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = buildAppWithTestRoutes();
  });

  afterEach(async () => {
    await app.close();
  });

  it('identifies the user from the header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/test/whoami',
      headers: { 'x-user-id': 'alexandre' },
    });

    expect(response.json()).toEqual({ userId: 'alexandre' });
  });

  it.each([
    ['missing', undefined],
    ['invalid', 'not a valid id!'],
  ])('answers 401 when the header is %s', async (_case, header) => {
    const response = await app.inject({
      method: 'GET',
      url: '/test/whoami',
      headers: header === undefined ? {} : { 'x-user-id': header },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'UnauthorizedError' });
  });

  it('keeps /health public', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
  });
});
