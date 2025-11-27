

import { writeGeneratedFiles } from '../../../src/scripts/generate';
import { describe, it, expect, vi, beforeEach } from 'vitest';


describe('writeGeneratedFiles logging', () => {
  let deps: {
    fs: {
      existsSync: (path: string) => Promise<boolean>;
      readFileSync: (path: string, encoding: string) => Promise<string>;
      writeFileSync: (path: string, content: string, encoding: string) => Promise<void>;
      mkdirSync: (path: string, opts: { recursive?: boolean }) => Promise<void>;
    };
    logger: {
      info: (msg: string) => void;
      warn: (msg: string) => void;
      error: (msg: string) => void;
    };
    diff: (oldStr: string, newStr: string) => string;
  };
  let openapi: { paths: Record<string, { [method: string]: { operationId: string } }> };
  let handlerDir: string;
  let zodResult: { stdout: string; stderr: string; code: number };

  beforeEach(() => {
    deps = {
      fs: {
        existsSync: vi.fn().mockResolvedValue(false),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
        mkdirSync: vi.fn(),
      },
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      diff: vi.fn().mockImplementation((oldStr: string, newStr: string) => `diff: ${oldStr} -> ${newStr}`),
    };
    openapi = {
      paths: {
        '/users': {
          get: { operationId: 'getUsers' },
        },
        '/admin': {
          post: { operationId: 'createAdmin' },
        },
        '/users/{id}': {
          get: { operationId: 'getUserById' },
        },
      },
    };
    handlerDir = 'src/handlers';
    zodResult = { stdout: '', stderr: '', code: 0 };
  });

  it('logs summary of created, appended, and skipped stubs', async () => {
    await writeGeneratedFiles(deps, {
      routerConfig: { openapi },
      zodResult,
      handlerDir,
      dryRun: false,
    });
    expect(deps.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Handler stub generation summary:')
    );
    expect(deps.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Created handler files:')
    );
    expect(deps.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Appended stubs:')
    );
    expect(deps.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Skipped stubs:')
    );
  });

  it('logs per-stub actions in verbose mode', async () => {
    await writeGeneratedFiles(deps, {
      routerConfig: { openapi },
      zodResult,
      handlerDir,
      dryRun: false,
    });
    expect(deps.logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Appended handler stub: 'getUsers'")
    );
    expect(deps.logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Appended handler stub: 'createAdmin'")
    );
    expect(deps.logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Appended handler stub: 'getUserById'")
    );
  });

  it('logs per-stub actions and summary in dryRun mode', async () => {
    await writeGeneratedFiles(deps, {
      routerConfig: { openapi },
      zodResult,
      handlerDir,
      dryRun: true,
    });
    expect(deps.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('[dry-run] Would write:')
    );
    expect(deps.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Handler stub generation summary:')
    );
    expect(deps.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Appended handler stub:')
    );
  });
});
