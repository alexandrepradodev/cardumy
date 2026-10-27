import { Type, type Static } from 'typebox';
import { Value } from 'typebox/value';

const EnvSchema = Type.Object({
  NODE_ENV: Type.Enum(['development', 'test', 'production'], { default: 'development' }),
  HOST: Type.String({ minLength: 1, default: '0.0.0.0' }),
  PORT: Type.Integer({ minimum: 1, maximum: 65535, default: 3000 }),
  LOG_LEVEL: Type.Enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'], {
    default: 'info',
  }),
  DATABASE_URL: Type.Optional(Type.String({ pattern: '^postgres(ql)?://' })),
});

// Matches compose.yaml, so `pnpm dev` works with no .env at all.
const LOCAL_DATABASE_URL = 'postgres://cardumy:cardumy@localhost:5433/cardumy';

export type Config = Static<typeof EnvSchema> & { DATABASE_URL: string };

export class ConfigError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Invalid environment configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.name = 'ConfigError';
  }
}

// Reads only the variables the schema knows, converts text to the right
// types ("8080" -> 8080), fills defaults and fails fast listing every problem.
// Receives env as a parameter so tests never need to touch process.env.
export function loadConfig(env: Record<string, string | undefined>): Config {
  const known = Object.fromEntries(
    Object.keys(EnvSchema.properties)
      .filter((key) => env[key] !== undefined && env[key] !== '')
      .map((key) => [key, env[key]]),
  );

  const candidate = Value.Default(EnvSchema, Value.Convert(EnvSchema, known));

  if (!Value.Check(EnvSchema, candidate)) {
    const problems = [...Value.Errors(EnvSchema, candidate)].map(
      (error) => `${error.instancePath.slice(1)}: ${error.message}`,
    );
    throw new ConfigError(problems);
  }

  // Convenient locally, dangerous in production: there it must be explicit,
  // or a misconfigured deploy would quietly look for a database on localhost.
  if (candidate.DATABASE_URL === undefined && candidate.NODE_ENV === 'production') {
    throw new ConfigError(['DATABASE_URL: is required in production']);
  }

  return { ...candidate, DATABASE_URL: candidate.DATABASE_URL ?? LOCAL_DATABASE_URL };
}
