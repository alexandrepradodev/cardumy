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
  // Signs the access tokens. Anyone who knows it can forge a token for any
  // user, so it must be long, random and never committed.
  JWT_SECRET: Type.Optional(Type.String({ minLength: 32 })),
  // Object storage speaking the S3 API: Cloudflare R2 in production
  // (region "auto"), RustFS from compose.yaml locally.
  S3_ENDPOINT: Type.Optional(Type.String({ pattern: '^https?://' })),
  S3_REGION: Type.String({ minLength: 1, default: 'us-east-1' }),
  S3_BUCKET: Type.String({ minLength: 1, default: 'cardumy' }),
  S3_ACCESS_KEY_ID: Type.Optional(Type.String({ minLength: 1 })),
  S3_SECRET_ACCESS_KEY: Type.Optional(Type.String({ minLength: 1 })),
});

// Matches compose.yaml, so `pnpm dev` works with no .env at all.
const LOCAL_DATABASE_URL = 'postgres://cardumy:cardumy@localhost:5433/cardumy';
// Public on purpose (it is in the repository), so it is only acceptable locally.
const LOCAL_JWT_SECRET = 'local-development-only-jwt-secret-do-not-use';
// RustFS from compose.yaml, with its local-only keys.
const LOCAL_S3 = {
  S3_ENDPOINT: 'http://localhost:9000',
  S3_ACCESS_KEY_ID: 'cardumy',
  S3_SECRET_ACCESS_KEY: 'cardumy-local-secret',
};

// Required in production, filled with a local default everywhere else.
const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'JWT_SECRET',
  'S3_ENDPOINT',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
] as const;

export type Config = Static<typeof EnvSchema> &
  Record<(typeof REQUIRED_IN_PRODUCTION)[number], string>;

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

  // Convenient locally, dangerous in production: there they must be explicit,
  // or a misconfigured deploy would quietly look for a database on localhost,
  // sign tokens with a secret anyone can read on GitHub, or upload files to
  // a storage that does not exist.
  if (candidate.NODE_ENV === 'production') {
    const missing = REQUIRED_IN_PRODUCTION.filter((key) => candidate[key] === undefined).map(
      (key) => `${key}: is required in production`,
    );
    if (missing.length > 0) {
      throw new ConfigError(missing);
    }
  }

  return {
    ...candidate,
    DATABASE_URL: candidate.DATABASE_URL ?? LOCAL_DATABASE_URL,
    JWT_SECRET: candidate.JWT_SECRET ?? LOCAL_JWT_SECRET,
    S3_ENDPOINT: candidate.S3_ENDPOINT ?? LOCAL_S3.S3_ENDPOINT,
    S3_ACCESS_KEY_ID: candidate.S3_ACCESS_KEY_ID ?? LOCAL_S3.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: candidate.S3_SECRET_ACCESS_KEY ?? LOCAL_S3.S3_SECRET_ACCESS_KEY,
  };
}
