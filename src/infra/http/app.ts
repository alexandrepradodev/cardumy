import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';

import { authRoutes } from '../../modules/accounts/adapters/in/http/auth-routes.js';
import { cardRoutes } from '../../modules/study/adapters/in/http/card-routes.js';
import { deckRoutes } from '../../modules/study/adapters/in/http/deck-routes.js';
import type { Container } from '../container.js';
import { registerAuth } from './auth.js';
import { registerCurrentUser } from './current-user.js';
import { registerDocs } from './docs.js';
import { registerErrorHandling } from './error-handling.js';
import { healthRoutes } from './health-routes.js';

export interface BuildAppOptions extends FastifyServerOptions {
  container: Container;
  jwtSecret: string;
}

// Builds the HTTP app without opening a port, so tests can call it
// in memory with app.inject() and main-api.ts decides when to listen.
// The caller chooses the container: Postgres in main-api, memory in tests.
export function buildApp({
  container,
  jwtSecret,
  ...fastifyOptions
}: BuildAppOptions): FastifyInstance {
  const app = Fastify(fastifyOptions);

  registerErrorHandling(app);
  registerCurrentUser(app);
  registerAuth(app, jwtSecret);
  // Plugins load in order: docs first, so they see every route below.
  registerDocs(app);
  void app.register(healthRoutes);
  void app.register(authRoutes, { accounts: container.accounts });
  void app.register(deckRoutes, { study: container.study });
  void app.register(cardRoutes, { study: container.study });

  // app.close() (graceful shutdown, end of a test) also closes the database pool.
  app.addHook('onClose', () => container.close());

  return app;
}
