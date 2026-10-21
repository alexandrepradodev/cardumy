import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';

import { registerHealthRoutes } from './health-routes.js';

// Builds the HTTP app without opening a port, so tests can call it
// in memory with app.inject() and main-api.ts decides when to listen.
export function buildApp(options: FastifyServerOptions = {}): FastifyInstance {
  const app = Fastify(options);

  registerHealthRoutes(app);

  return app;
}
