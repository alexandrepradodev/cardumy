import type { FastifyError, FastifyInstance, FastifyRequest } from 'fastify';

import { UnauthorizedError } from '../../shared/errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
  }
}

// Three named 401s, so a client can tell "log in again" (expired) apart from
// "you never sent a token" or "this token is not ours".
export class MissingTokenError extends UnauthorizedError {
  constructor() {
    super('Send an access token in the header "Authorization: Bearer <token>"');
  }
}

export class ExpiredTokenError extends UnauthorizedError {
  constructor() {
    super('The access token has expired, log in again');
  }
}

export class InvalidTokenError extends UnauthorizedError {
  constructor() {
    super('The access token is not valid');
  }
}

export function registerCurrentUser(app: FastifyInstance): void {
  app.decorateRequest('userId', '');
}

// Hook for protected routes: checks the token's signature and expiry, then
// exposes the user id. Use cases keep receiving a plain userId, so swapping
// the stage 2 x-user-id header for this changed nothing inside the modules.
export async function authenticate(request: FastifyRequest): Promise<void> {
  try {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    request.userId = sub;
  } catch (error) {
    throw toUnauthorized(error);
  }
}

// Same idea as the 23505 translation in the users repository: the library's
// error codes stay here, the rest of the app sees our own errors.
function toUnauthorized(error: unknown): Error {
  const code = (error as Partial<FastifyError>).code ?? '';
  if (code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') return new MissingTokenError();
  if (code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') return new ExpiredTokenError();
  if (code.startsWith('FST_JWT_')) return new InvalidTokenError();
  return error instanceof Error ? error : new Error(String(error));
}
