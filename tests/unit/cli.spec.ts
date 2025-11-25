import { describe, it, expect } from 'vitest';

// This test only checks that the CLI module can be imported without error.
describe('CLI Entrypoint', () => {
  it('should import without throwing', async () => {
    let cliModule;
    let error;
    try {
      cliModule = await import('../../src/cli');
    } catch (e) {
      error = e;
    }
    expect(error).toBeUndefined();
    expect(cliModule).toBeDefined();
  });
});
