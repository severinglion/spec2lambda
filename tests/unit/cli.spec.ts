/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Cli } from '../../src/cli';
import * as runGen from '../../src/runGenerateCLI';

describe('Cli', () => {
  let cli: Cli;
  let called: any[];
  let logger: any;
  const origExitCode = process.exitCode;

  beforeEach(() => {
    cli = new Cli();
    called = [];
    cli.initProject = (...args: any[]) => {
      called.push(args);
      return [];
    };
    // Patch generate to call the real implementation but with test logger
    // Import at top-level for ESM
    // (see import below)
    logger = { info: vi.fn(), error: vi.fn() };
    cli.logger = logger;
    process.exitCode = undefined;
  });

  afterEach(() => {
    process.exitCode = origExitCode;
  });

  it('calls initProject for "init" with project name', () => {
    cli.run(['init', 'my-project']);
    expect(called.length).toBe(1);
    expect(called[0][2]).toBe('my-project');
    expect(logger.info).toHaveBeenCalledWith('Project initialized.');
  });

  it('calls initProject for "create-lambda-function" with project name', () => {
    cli.run(['create-lambda-function', 'my-lambda']);
    expect(called.length).toBe(1);
    expect(called[0][2]).toBe('my-lambda');
    expect(logger.info).toHaveBeenCalledWith('Project initialized.');
  });

  it('errors if no project name is provided', () => {
    cli.run(['init']);
    expect(called.length).toBe(0);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('You must provide a project name'));
    expect(process.exitCode).toBe(1);
  });

  it('shows help for unknown command', () => {
    cli.run(['unknown']);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Unknown command:'));
    expect(process.exitCode).toBe(1);
  });

  it('runs generate command and logs new pipeline steps', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const spy = vi.spyOn(runGen, 'runGenerateCLI').mockImplementation(async (args) => {
      logger.info('[spec2lambda] Starting code generation...');
      logger.info('[spec2lambda] Loaded config: test-config.yaml');
      logger.info('[spec2lambda] Loaded OpenAPI spec: api/openapi.yml');
      logger.info('[spec2lambda] Generating router config (placeholder)');
      logger.info('[spec2lambda] Running Zod/type generation script');
      logger.info('[spec2lambda] Code generation complete.');
      return Promise.resolve();
    });
    await cli.run(['generate']);
    expect(logger.info).toHaveBeenCalledWith('[spec2lambda] Starting code generation...');
    expect(logger.info).toHaveBeenCalledWith('[spec2lambda] Loaded config: test-config.yaml');
    expect(logger.info).toHaveBeenCalledWith('[spec2lambda] Loaded OpenAPI spec: api/openapi.yml');
    expect(logger.info).toHaveBeenCalledWith('[spec2lambda] Generating router config (placeholder)');
    expect(logger.info).toHaveBeenCalledWith('[spec2lambda] Running Zod/type generation script');
    expect(logger.info).toHaveBeenCalledWith('[spec2lambda] Code generation complete.');
    spy.mockRestore();
  });

  it('runs generate command with --verbose and logs extra details', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const spy = vi.spyOn(runGen, 'runGenerateCLI').mockImplementation(async (args) => {
      logger.info('[spec2lambda] Starting code generation...');
      logger.info('[spec2lambda] Loaded config: test-config.yaml');
      logger.info('[spec2lambda] Loaded OpenAPI spec: api/openapi.yml');
      logger.info('[spec2lambda] Generating router config (placeholder)');
      logger.info('[spec2lambda] Running Zod/type generation script');
      logger.info('[spec2lambda] Verbose mode enabled.\n  - Args: ["--verbose","foo","bar"]\n  - Dry run: false');
      logger.info('[spec2lambda] Code generation complete.');
      return Promise.resolve();
    });
    await cli.run(['generate', '--verbose', 'foo', 'bar']);
    expect(logger.info).toHaveBeenCalledWith('[spec2lambda] Starting code generation...');
    expect(logger.info).toHaveBeenCalledWith('[spec2lambda] Loaded config: test-config.yaml');
    expect(logger.info).toHaveBeenCalledWith('[spec2lambda] Loaded OpenAPI spec: api/openapi.yml');
    expect(logger.info).toHaveBeenCalledWith('[spec2lambda] Generating router config (placeholder)');
    expect(logger.info).toHaveBeenCalledWith('[spec2lambda] Running Zod/type generation script');
    expect(logger.info).toHaveBeenCalledWith('[spec2lambda] Verbose mode enabled.\n  - Args: ["--verbose","foo","bar"]\n  - Dry run: false');
    expect(logger.info).toHaveBeenCalledWith('[spec2lambda] Code generation complete.');
    spy.mockRestore();
  });
});
