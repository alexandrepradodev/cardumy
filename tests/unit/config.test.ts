import { describe, expect, it } from 'vitest';

import { ConfigError, loadConfig } from '../../src/infra/config.js';

const SECRET = 'a-random-secret-with-at-least-32-chars';

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
    });
  });

  it('requires DATABASE_URL and JWT_SECRET in production', () => {
    const load = () => loadConfig({ NODE_ENV: 'production' });

    expect(load).toThrow(/DATABASE_URL/);
    expect(load).toThrow(/JWT_SECRET/);
  });

  it('accepts a Postgres DATABASE_URL and rejects anything else', () => {
    const url = 'postgres://app:secret@db.internal:5432/cardumy';
    const production = { NODE_ENV: 'production', DATABASE_URL: url, JWT_SECRET: SECRET };

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

  it('rejects a port out of range', () => {
    expect(() => loadConfig({ PORT: '70000' })).toThrow(/PORT/);
  });
});
