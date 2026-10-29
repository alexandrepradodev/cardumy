import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createInMemoryContainer } from '../../src/infra/container.js';
import { buildApp } from '../../src/infra/http/app.js';
import { START } from '../support/accounts-test-kit.js';
import { makeHttpKit } from '../support/http-test-kit.js';

const ANA = { email: 'Ana@Example.com', password: 'secret-123' };

describe('auth routes', () => {
  let kit: ReturnType<typeof makeHttpKit>;

  beforeEach(() => {
    kit = makeHttpKit();
  });

  afterEach(async () => {
    await kit.app.close();
  });

  function register(payload: object) {
    return kit.app.inject({ method: 'POST', url: '/auth/register', payload });
  }

  function login(payload: object) {
    return kit.app.inject({ method: 'POST', url: '/auth/login', payload });
  }

  describe('POST /auth/register', () => {
    it('creates the account and answers 201 without any password data', async () => {
      const response = await register(ANA);

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual({
        id: 'id-1',
        email: 'ana@example.com',
        createdAt: START.toISOString(),
      });
    });

    it('answers 409 when the email is already in use', async () => {
      await register(ANA);

      const response = await register({ ...ANA, email: 'ana@example.com' });

      expect(response.statusCode).toBe(409);
      expect(response.json()).toMatchObject({ code: 'EmailAlreadyInUseError' });
    });

    it('answers 400 when the password is too short', async () => {
      const response = await register({ ...ANA, password: 'short' });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ code: 'WeakPasswordError' });
    });

    it('answers 400 when a field is missing', async () => {
      const response = await register({ email: ANA.email });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ code: 'VALIDATION_FAILED' });
    });

    it('refuses a huge password before it reaches the slow hash', async () => {
      const response = await register({ ...ANA, password: 'x'.repeat(1025) });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ code: 'VALIDATION_FAILED' });
    });
  });

  describe('POST /auth/login', () => {
    it('answers with a signed access token for the user, valid for one hour', async () => {
      await register(ANA);

      const response = await login(ANA);

      expect(response.statusCode).toBe(200);
      const body = response.json<{ accessToken: string; tokenType: string; expiresIn: number }>();
      expect(body).toMatchObject({ tokenType: 'Bearer', expiresIn: 3600 });
      const payload = kit.app.jwt.verify<{ sub: string; iat: number; exp: number }>(
        body.accessToken,
      );
      expect(payload.sub).toBe('id-1');
      expect(payload.exp - payload.iat).toBe(3600);
    });

    it('answers 401 with the same message for a wrong password and an unknown email', async () => {
      await register(ANA);

      const wrongPassword = await login({ ...ANA, password: 'wrong-pass' });
      const unknownEmail = await login({ ...ANA, email: 'bob@example.com' });

      for (const response of [wrongPassword, unknownEmail]) {
        expect(response.statusCode).toBe(401);
        expect(response.json()).toMatchObject({
          code: 'InvalidCredentialsError',
          detail: 'Email or password is incorrect',
        });
      }
    });
  });

  it('does not accept a token signed with another secret', async () => {
    const otherApp = buildApp({
      container: createInMemoryContainer(),
      jwtSecret: 'some-other-secret-with-32-characters',
    });
    await Promise.all([otherApp.ready(), kit.app.ready()]);
    const forged = otherApp.jwt.sign({ sub: 'id-1' });

    expect(() => kit.app.jwt.verify(forged)).toThrow();
    await otherApp.close();
  });
});
