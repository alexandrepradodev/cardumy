import type { FastifyPluginAsync } from 'fastify';

// Liveness probe: answers "is this process able to serve HTTP?".
// It deliberately does not touch Postgres or Redis, so a slow database
// never makes the platform restart a healthy API process.
export const healthRoutes: FastifyPluginAsync = (app) => {
  app.get(
    '/health',
    {
      schema: {
        tags: ['system'],
        summary: 'Liveness check',
        security: [],
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

  return Promise.resolve();
};
