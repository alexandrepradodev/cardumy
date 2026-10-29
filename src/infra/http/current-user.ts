import type { FastifyInstance, FastifyRequest } from 'fastify';

import { UnauthorizedError } from '../../shared/errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
  }
}

const USER_ID_HEADER = 'x-user-id';
const USER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function registerCurrentUser(app: FastifyInstance): void {
  app.decorateRequest('userId', '');
}

// TEMPORARY (stage 2): trusts whatever user the client claims to be, so it is
// NOT secure. It only lives at the HTTP edge; stage 3 swaps it for a JWT check
// and no use case changes.
export function authenticate(request: FastifyRequest): Promise<void> {
  const header = request.headers[USER_ID_HEADER];

  if (typeof header !== 'string' || !USER_ID_PATTERN.test(header)) {
    return Promise.reject(
      new UnauthorizedError(`Send the ${USER_ID_HEADER} header to identify the user`),
    );
  }

  request.userId = header;
  return Promise.resolve();
}
