import type { FastifyInstance } from 'fastify';

import { problem, toProblemDetails } from './problem-details.js';

const PROBLEM_CONTENT_TYPE = 'application/problem+json';

export function registerErrorHandling(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    const details = toProblemDetails(error, request.url);

    // Only unexpected errors are logged as errors; a 404 or a bad request
    // is the client's mistake, not an incident.
    if (details.status >= 500) {
      request.log.error(error, 'unexpected error');
    }

    return reply.status(details.status).type(PROBLEM_CONTENT_TYPE).send(details);
  });

  app.setNotFoundHandler((request, reply) => {
    const detail = `Route ${request.method} ${request.url} does not exist`;
    return reply
      .status(404)
      .type(PROBLEM_CONTENT_TYPE)
      .send(problem(404, 'ROUTE_NOT_FOUND', detail, request.url));
  });
}
