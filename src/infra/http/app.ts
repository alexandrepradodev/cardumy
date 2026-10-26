import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';

import { cardRoutes } from '../../modules/study/adapters/in/http/card-routes.js';
import { deckRoutes } from '../../modules/study/adapters/in/http/deck-routes.js';
import { type Container, createContainer } from '../container.js';
import { registerCurrentUser } from './current-user.js';
import { registerDocs } from './docs.js';
import { registerErrorHandling } from './error-handling.js';
import { healthRoutes } from './health-routes.js';

export interface BuildAppOptions extends FastifyServerOptions {
  container?: Container;
}

// Builds the HTTP app without opening a port, so tests can call it
// in memory with app.inject() and main-api.ts decides when to listen.
// Tests pass their own container (frozen clock, predictable ids).
export function buildApp({
  container = createContainer(),
  ...fastifyOptions
}: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify(fastifyOptions);

  registerErrorHandling(app);
  registerCurrentUser(app);
  // Plugins load in order: docs first, so they see every route below.
  registerDocs(app);
  void app.register(healthRoutes);
  void app.register(deckRoutes, { study: container.study });
  void app.register(cardRoutes, { study: container.study });

  return app;
}
