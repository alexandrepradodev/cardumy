import { buildApp } from './infra/http/app.js';

// Port and host move to validated config in the next step.
const PORT = 3000;
// 0.0.0.0 listens on every network interface, which a container needs:
// 127.0.0.1 would only accept connections from inside the container itself.
const HOST = '0.0.0.0';

const app = buildApp({ logger: true });

// Graceful shutdown: on SIGTERM (sent by Docker, Railway, ECS on deploy)
// stop accepting new requests, finish the in-flight ones, then exit.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    app.log.info({ signal }, 'shutting down');
    app.close().then(
      () => process.exit(0),
      (error: unknown) => {
        app.log.error(error, 'error during shutdown');
        process.exit(1);
      },
    );
  });
}

try {
  await app.listen({ port: PORT, host: HOST });
} catch (error) {
  app.log.error(error, 'failed to start');
  process.exit(1);
}
