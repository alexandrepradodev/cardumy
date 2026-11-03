import { describe, expect, it } from 'vitest';

import { ConfigError, loadConfig } from '../../src/infra/config.js';

const SECRET = 'a-random-secret-with-at-least-32-chars';
const PRODUCTION_STORAGE = {
  S3_ENDPOINT: 'https://account-id.r2.cloudflarestorage.com',
  S3_REGION: 'auto',
  S3_ACCESS_KEY_ID: 'r2-key',
  S3_SECRET_ACCESS_KEY: 'r2-secret',
};

describe('loadConfig', () => {
  it('uses defaults when nothing is set', () => {
    const config = loadConfig({});

    expect(config).toEqual({
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: 3000,
      LOG_LEVEL: 'info',
      DATABASE_URL: 'postgres://cardumy:cardumy@localhost:5433/cardumy',
      JWT_SECRET: 'local-development-only-jwt-secret-do-not-use',
      S3_ENDPOINT: 'http://localhost:9000',
      S3_REGION: 'us-east-1',
      S3_BUCKET: 'cardumy',
      S3_ACCESS_KEY_ID: 'cardumy',
      S3_SECRET_ACCESS_KEY: 'cardumy-local-secret',
    });
  });

  it('requires the database, the token secret and the storage keys in production', () => {
    const load = () => loadConfig({ NODE_ENV: 'production' });

    expect(load).toThrow(/DATABASE_URL/);
    expect(load).toThrow(/JWT_SECRET/);
    expect(load).toThrow(/S3_ENDPOINT/);
    expect(load).toThrow(/S3_ACCESS_KEY_ID/);
    expect(load).toThrow(/S3_SECRET_ACCESS_KEY/);
  });

  it('accepts a Postgres DATABASE_URL and rejects anything else', () => {
    const url = 'postgres://app:secret@db.internal:5432/cardumy';
    const production = {
      ...PRODUCTION_STORAGE,
      NODE_ENV: 'production',
      DATABASE_URL: url,
      JWT_SECRET: SECRET,
    };

    expect(loadConfig(production).DATABASE_URL).toBe(url);
    expect(() => loadConfig({ DATABASE_URL: 'mysql://x' })).toThrow(/DATABASE_URL/);
  });

  it('converts PORT from text to number', () => {
    const config = loadConfig({ PORT: '8080' });

    expect(config.PORT).toBe(8080);
  });

  it('treats an empty variable as not set', () => {
    const config = loadConfig({ PORT: '' });

    expect(config.PORT).toBe(3000);
  });

  it('ignores variables it does not know', () => {
    const config = loadConfig({ PATH: '/usr/bin', HOME: '/home/alexandre' });

    expect(config).not.toHaveProperty('PATH');
  });

  it('fails listing every invalid variable', () => {
    const load = () => loadConfig({ PORT: 'abc', NODE_ENV: 'prod' });

    expect(load).toThrow(ConfigError);
    expect(load).toThrow(/PORT/);
    expect(load).toThrow(/NODE_ENV/);
  });

  it('rejects a JWT_SECRET shorter than 32 characters', () => {
    expect(() => loadConfig({ JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
    expect(loadConfig({ JWT_SECRET: SECRET }).JWT_SECRET).toBe(SECRET);
  });

  it('reads the storage settings and rejects an endpoint that is not a URL', () => {
    const config = loadConfig(PRODUCTION_STORAGE);

    expect(config.S3_ENDPOINT).toBe(PRODUCTION_STORAGE.S3_ENDPOINT);
    expect(config.S3_REGION).toBe('auto');
    expect(() => loadConfig({ S3_ENDPOINT: 'r2.cloudflarestorage.com' })).toThrow(/S3_ENDPOINT/);
  });

  it('rejects a port out of range', () => {
    expect(() => loadConfig({ PORT: '70000' })).toThrow(/PORT/);
  });
});
