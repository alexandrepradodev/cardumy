import { describe, expect, it } from 'vitest';

import packageJson from '../../package.json' with { type: 'json' };

describe('runtime', () => {
  it('runs on a Node version allowed by package.json engines', () => {
    // Arrange
    const minimumMajor = Number(packageJson.engines.node.replace('>=', ''));

    // Act
    const currentMajor = Number(process.versions.node.split('.')[0]);

    // Assert
    expect(currentMajor).toBeGreaterThanOrEqual(minimumMajor);
  });
});
