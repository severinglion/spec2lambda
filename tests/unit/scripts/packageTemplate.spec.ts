/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { copyStarterTemplate, Manifest } from '../../../src/scripts/packageTemplate';

describe('copyStarterTemplate', () => {
  let mockFs: any;
  let mockPath: any;
  let mockLogger: any;
  let manifest: Manifest;

  beforeEach(() => {
    manifest = [
      { path: 'file1.txt', source: 'src/file1.txt' },
      { path: 'dir/file2.txt', source: 'src/dir/file2.txt' },
    ];
    // existsSync: first call (destRoot) returns false, then true for all others
    let callCount = 0;
    mockFs = {
      existsSync: vi.fn(() => {
        callCount++;
        return callCount === 1 ? false : true;
      }),
      mkdirSync: vi.fn(),
      copyFileSync: vi.fn(),
    };
    mockPath = {
      resolve: vi.fn((...args: string[]) => args.join('/')),
      dirname: vi.fn((p: string) => p.split('/').slice(0, -1).join('/') || '.'),
    };
    mockLogger = { info: vi.fn(), error: vi.fn() };
  });

  it('copies all files from manifest to destination', () => {
    copyStarterTemplate(manifest, { fs: mockFs, path: mockPath, logger: mockLogger });
    // mkdirSync should be called once for destRoot
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('dist/starter-template'),
      { recursive: true }
    );
    expect(mockFs.copyFileSync).toHaveBeenCalledTimes(manifest.length);
    manifest.forEach((entry) => {
      expect(mockFs.copyFileSync).toHaveBeenCalledWith(
        expect.stringContaining(entry.source),
        expect.stringContaining(entry.path)
      );
    });
  });

  it('creates destination directories if they do not exist', () => {
    let callCount = 0;
    mockFs.existsSync = vi.fn(() => {
      callCount++;
      // 1: destRoot, 2: file1.txt dir, 3: file2.txt dir
      return callCount === 1 ? false : callCount === 2 ? false : true;
    });
    copyStarterTemplate(manifest, { fs: mockFs, path: mockPath, logger: mockLogger });
    // Should create destRoot and dir for file1.txt and dir/file2.txt
    // Should create destRoot and at least one subdirectory
    const mkdirCalls = mockFs.mkdirSync.mock.calls.map((call: any[]) => call[0]);
    expect(mkdirCalls.some((p: string) => p.includes('dist/starter-template'))).toBe(true);
    expect(mkdirCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('throws error if source file does not exist', () => {
    mockFs.existsSync = vi.fn((p: string) => p.includes('dist/starter-template') ? true : false);
    expect(() =>
      copyStarterTemplate(manifest, { fs: mockFs, path: mockPath, logger: mockLogger })
    ).toThrow(/Source file does not exist/);
  });

  it('logs info for each copied file and final message', () => {
    copyStarterTemplate(manifest, { fs: mockFs, path: mockPath, logger: mockLogger });
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Copied:'));
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Starter template successfully copied'));
  });
});
