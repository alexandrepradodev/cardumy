import type { FastifyInstance } from 'fastify';

// Liveness probe: answers "is this process able to serve HTTP?".
// It deliberately does not touch Postgres or Redis, so a slow database
// never makes the platform restart a healthy API process.
export function registerHealthRoutes(app: FastifyInstance): void {
  app.get(
    '/health',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: { status: { type: 'string' } },
            required: ['status'],
          },
        },
      },
    },
    () => ({ status: 'ok' }),
  );
}
