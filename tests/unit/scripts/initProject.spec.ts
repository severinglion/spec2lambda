/* eslint-disable @typescript-eslint/no-explicit-any */

import path from 'path';
import { initProject, Manifest } from '../../../src/scripts/initProject';
import { describe, it, expect, beforeEach } from 'vitest';


describe('initProject', () => {
  const manifest: Manifest = [
    { path: 'src/handlers/testHandler.ts', source: 'template/handler.ts' },
    { path: 'src/presentation/testPresentation.ts', source: 'template/presentation.ts' },
  ];

  let files: Record<string, string>;
  let mkdirs: string[];
  let logs: string[];
  let fsMock: any;
  let loggerMock: any;
  const root = 'my-lambda';

  let writeCalls: Array<{ path: string, content: string }>;
  beforeEach(() => {
    // Use absolute paths to match implementation
    const starterTemplateRoot = path.resolve(__dirname, '../../../dist/starter-template');
    files = {};
    manifest.forEach(entry => {
      const absPath = path.resolve(starterTemplateRoot, entry.path);
      files[absPath] = entry.path.includes('handler') ? '// handler template' : '// presentation template';
    });
    mkdirs = [];
    logs = [];
    writeCalls = [];
    fsMock = {
      existsSync: (p: string) => {
        // Normalize for starter template source
        const normP = p.replace(/\\/g, '/');
        return Object.keys(files).some(k => k.replace(/\\/g, '/').toLowerCase() === normP.toLowerCase()) || mkdirs.includes(normP);
      },
      mkdirSync: (p: string) => { mkdirs.push(p.replace(/\\/g, '/')); },
      readFileSync: (p: string) => {
        const normP = p.replace(/\\/g, '/');
        const match = Object.keys(files).find(k => k.replace(/\\/g, '/').toLowerCase() === normP.toLowerCase());
        if (match) return files[match];
        throw new Error(`File not found in mock: ${p}`);
      },
      writeFileSync: (p: string, c: string) => {
        const norm = p.replace(/\\/g, '/');
        files[norm] = c;
        writeCalls.push({ path: norm, content: c });
      },
    };
    loggerMock = { info: (msg: string) => logs.push(msg), error: (msg: string) => logs.push('ERR:' + msg) };
  });

  it('copies all files, creates package.json, and creates directories in root', () => {
    const created = initProject(manifest, { fs: fsMock, logger: loggerMock }, root);
    expect(created).toContain(`${root}/package.json`);
    expect(created).toContain(`${root}/src/handlers/testHandler.ts`);
    expect(created).toContain(`${root}/src/presentation/testPresentation.ts`);
    const norm = (p: string) => p.replace(/\\/g, '/');
    expect(files[norm(`${root}/src/handlers/testHandler.ts`)]).toBe('// handler template');
    expect(files[norm(`${root}/src/presentation/testPresentation.ts`)]).toBe('// presentation template');
    expect(logs).toContain(`Created: ${root}/src/handlers/testHandler.ts`);
    expect(logs).toContain(`Created: ${root}/src/presentation/testPresentation.ts`);
    // Check that package.json was written with correct name and script
    const pkgCall = writeCalls.find(c => c.path === `${root}/package.json`);
    expect(pkgCall).toBeDefined();
    const pkg = JSON.parse(pkgCall!.content);
    expect(pkg.name).toBe(root);
    expect(pkg.scripts.codegen).toMatch(/spec2lambda generate/);
    expect(pkg.devDependencies.spec2lambda).toBe('latest');
  });

  it('throws if root folder exists', () => {
    files[root] = 'already exists';
    expect(() => initProject(manifest, { fs: fsMock, logger: loggerMock }, root)).toThrow(`Folder already exists: ${root}`);
  });

  it('throws if any file exists in root', () => {
    files[`${root}/src/handlers/testHandler.ts`] = '// already exists';
    expect(() => initProject(manifest, { fs: fsMock, logger: loggerMock }, root)).toThrow(`File already exists: ${root}/src/handlers/testHandler.ts`);
  });
});
