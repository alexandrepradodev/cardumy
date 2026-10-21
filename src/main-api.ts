import { ConfigError, loadConfig } from './infra/config.js';
import { buildApp } from './infra/http/app.js';

let config;
try {
  config = loadConfig(process.env);
} catch (error) {
  // No logger exists yet: config decides the log level.
  if (error instanceof ConfigError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}

const app = buildApp({ logger: { level: config.LOG_LEVEL } });

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
  // HOST defaults to 0.0.0.0: a container needs to listen on every interface,
  // 127.0.0.1 would only accept connections from inside the container itself.
  await app.listen({ port: config.PORT, host: config.HOST });
} catch (error) {
  app.log.error(error, 'failed to start');
  process.exit(1);
}
