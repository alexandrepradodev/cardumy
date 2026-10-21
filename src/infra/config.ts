import { Type, type Static } from 'typebox';
import { Value } from 'typebox/value';

const EnvSchema = Type.Object({
  NODE_ENV: Type.Enum(['development', 'test', 'production'], { default: 'development' }),
  HOST: Type.String({ minLength: 1, default: '0.0.0.0' }),
  PORT: Type.Integer({ minimum: 1, maximum: 65535, default: 3000 }),
  LOG_LEVEL: Type.Enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'], {
    default: 'info',
  }),
});

export type Config = Static<typeof EnvSchema>;

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

  return candidate;
}
