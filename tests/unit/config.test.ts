import { describe, expect, it } from 'vitest';

import { ConfigError, loadConfig } from '../../src/infra/config.js';

describe('loadConfig', () => {
  it('uses defaults when nothing is set', () => {
    const config = loadConfig({});

    expect(config).toEqual({
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: 3000,
      LOG_LEVEL: 'info',
    });
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

  it('rejects a port out of range', () => {
    expect(() => loadConfig({ PORT: '70000' })).toThrow(/PORT/);
  });
});
