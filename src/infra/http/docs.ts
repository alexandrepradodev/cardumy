import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';

export const USER_SECURITY = 'userId';

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
          'Flashcards with spaced repetition. Identify yourself with the temporary ' +
          '`x-user-id` header (replaced by JWT in stage 3). Errors follow RFC 9457 ' +
          '(Problem Details).',
        version: '0.2.0',
      },
      tags: [
        { name: 'decks', description: 'Create and organize decks' },
        { name: 'cards', description: 'Cards inside a deck' },
        { name: 'study', description: 'Review cards and see what is due' },
        { name: 'system', description: 'Operational endpoints' },
      ],
      components: {
        securitySchemes: {
          [USER_SECURITY]: { type: 'apiKey', in: 'header', name: 'x-user-id' },
        },
      },
      security: [{ [USER_SECURITY]: [] }],
    },
  });

  void app.register(swaggerUi, { routePrefix: '/docs' });
}
