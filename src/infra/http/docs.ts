import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';

export const BEARER_SECURITY = 'bearerAuth';

// OpenAPI spec generated from the same TypeBox schemas that validate requests,
// so the docs cannot drift from the code. UI at /docs, raw spec at /docs/json.
// Must be registered before the routes so it can see them.
export function registerDocs(app: FastifyInstance): void {
  void app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Cardumy API',
        description:
          'Flashcards with spaced repetition. Create an account (`POST /auth/register`), ' +
          'log in (`POST /auth/login`) and send the access token as ' +
          '`Authorization: Bearer <token>` (in this page: the Authorize button). ' +
          'Errors follow RFC 9457 (Problem Details).',
        version: '0.3.0',
      },
      tags: [
        { name: 'decks', description: 'Create and organize decks' },
        { name: 'cards', description: 'Cards inside a deck' },
        { name: 'study', description: 'Review cards and see what is due' },
        { name: 'auth', description: 'Sign up and log in' },
        { name: 'system', description: 'Operational endpoints' },
      ],
      components: {
        securitySchemes: {
          [BEARER_SECURITY]: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
      security: [{ [BEARER_SECURITY]: [] }],
    },
  });

  void app.register(swaggerUi, { routePrefix: '/docs' });
}
