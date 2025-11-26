/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Cli } from '../../src/cli';

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
});
