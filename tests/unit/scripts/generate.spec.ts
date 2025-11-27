import { generate, GenerateOptions, GenerateDeps, writeGeneratedFiles } from '../../../src/scripts/generate';
import path from 'path';
import { describe, it, expect, vi, beforeEach } from 'vitest';

function makeDeps(overrides: Partial<GenerateDeps> = {}): GenerateDeps {
  return {
    fs: {
      existsSync: vi.fn().mockResolvedValue(false),
      readFileSync: vi.fn(),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
      ...(overrides.fs || {})
    },
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      ...(overrides.logger || {})
    },
    yaml: {
      load: vi.fn().mockImplementation((str: string) => ({ loaded: str })),
      ...(overrides.yaml || {})
    },
    processRunner: vi.fn().mockResolvedValue({ stdout: 'ok', stderr: '', code: 0 }),
    diff: vi.fn().mockImplementation((oldStr, newStr) => `diff: ${oldStr} -> ${newStr}`),
    ...overrides
  };
}

describe('generate', () => {
  let deps: GenerateDeps;
  let options: GenerateOptions;

  beforeEach(() => {
    deps = makeDeps();
    options = { verbose: false };
  });

  it('runs with no config or openapi and dryRun', async () => {
    await generate(deps, { ...options, dryRun: true });
    expect(deps.logger.info).toHaveBeenCalledWith(expect.stringContaining('Starting code generation'));
    expect(deps.logger.info).toHaveBeenCalledWith(expect.stringContaining('[dry-run]'));
    expect(deps.logger.info).toHaveBeenCalledWith(expect.stringContaining('Code generation complete'));
  });

  it('loads config and openapi yaml, writes file in dryRun', async () => {
    deps.fs.existsSync = vi.fn()
      .mockImplementationOnce(async (p: string) => p.endsWith('config.yaml'))
      .mockImplementationOnce(async (p: string) => p.endsWith('openapi.yaml'))
      .mockImplementation(() => false);
    deps.fs.readFileSync = vi.fn().mockResolvedValueOnce('config: true').mockResolvedValueOnce('openapi: true');
    deps.yaml.load = vi.fn().mockImplementation((str: string) => ({ loaded: str }));
    await generate(deps, { ...options, dryRun: true });
    expect(deps.logger.info).toHaveBeenCalledWith(expect.stringContaining('Loaded config'));
    expect(deps.logger.info).toHaveBeenCalledWith(expect.stringContaining('Loaded OpenAPI spec'));
    expect(deps.logger.info).toHaveBeenCalledWith(expect.stringContaining('[dry-run]'));
  });

  it('writes file for real (not dryRun)', async () => {
    deps.fs.existsSync = vi.fn()
      .mockResolvedValueOnce(false) // routerConfig.generated.json does not exist
      .mockResolvedValue(false); // handler files do not exist
    deps.fs.mkdirSync = vi.fn();
    await generate(deps, { ...options, dryRun: false });
    // Should create src/generated if missing
    expect(deps.fs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining(path.join('src', 'generated')),
      { recursive: true }
    );
    // Should write router config to src/generated
    expect(deps.fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining(path.join('src', 'generated', 'routerConfig.generated.json')),
      expect.any(String),
      'utf8'
    );
    expect(deps.logger.info).toHaveBeenCalledWith(expect.stringContaining('Wrote:'));
  });
  it('creates handler stubs for new group files', async () => {
    // Simulate OpenAPI with two tags/groups and two operations
    const openapi = {
      paths: {
        '/users': {
          get: { operationId: 'getUsers', tags: ['users'] },
        },
        '/admin': {
          post: { operationId: 'createAdmin', tags: ['admin'] },
        },
      },
    };
    deps.fs.existsSync = vi.fn()
      .mockResolvedValueOnce(false) // routerConfig.generated.json
      .mockResolvedValue(false); // handler files do not exist
    deps.fs.mkdirSync = vi.fn();
    deps.fs.readFileSync = vi.fn();
    deps.fs.writeFileSync = vi.fn();
    await writeGeneratedFiles(
      deps,
      {
        routerConfig: { openapi },
        zodResult: { stdout: '', stderr: '', code: 0 },
        handlerDir: 'src/handlers',
        dryRun: false,
      }
    );
    // Should create handler files for each group
    expect(deps.fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining(path.join('src', 'handlers', 'users.ts')),
      expect.stringContaining('export const getUsers: Handler = async (event) =>'),
      'utf8'
    );
    expect(deps.fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining(path.join('src', 'handlers', 'admin.ts')),
      expect.stringContaining('export const createAdmin: Handler = async (event) =>'),
      'utf8'
    );
  });

  it('logs diff summary in dryRun if file exists', async () => {
    deps.fs.existsSync = vi.fn().mockResolvedValue(true);
    deps.fs.readFileSync = vi.fn().mockResolvedValue('old content');
    await generate(deps, { ...options, dryRun: true });
    expect(deps.diff).toHaveBeenCalledWith('old content', expect.any(String));
    expect(deps.logger.info).toHaveBeenCalledWith(expect.stringContaining('Diff summary'));
  });

  it('logs script errors if processRunner returns stderr', async () => {
    deps.processRunner = vi.fn().mockResolvedValue({ stdout: '', stderr: 'err', code: 1 });
    deps.logger.warn = vi.fn();
    await generate(deps, { ...options, dryRun: true });
    expect(deps.logger.warn).toHaveBeenCalledWith(expect.stringContaining('Script errors'));
  });

  it('throws and logs if processRunner throws', async () => {
    const error = new Error('fail');
    deps.processRunner = vi.fn().mockRejectedValue(error);
    deps.logger.error = vi.fn();
    await expect(generate(deps, { ...options, dryRun: true })).rejects.toThrow('fail');
    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('Script failed'));
  });
});
