/* eslint-disable @typescript-eslint/no-explicit-any */

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
    files = {
      'template/handler.ts': '// handler template',
      'template/presentation.ts': '// presentation template',
    };
    mkdirs = [];
    logs = [];
    writeCalls = [];
    fsMock = {
      existsSync: (p: string) => files[p] !== undefined || mkdirs.includes(p),
      mkdirSync: (p: string) => { mkdirs.push(p); },
      readFileSync: (p: string) => files[p],
      writeFileSync: (p: string, c: string) => { files[p] = c; writeCalls.push({ path: p, content: c }); },
    };
    loggerMock = { info: (msg: string) => logs.push(msg), error: (msg: string) => logs.push('ERR:' + msg) };
  });

  it('copies all files, creates package.json, and creates directories in root', () => {
    const created = initProject(manifest, { fs: fsMock, logger: loggerMock }, root);
    expect(created).toContain(`${root}/package.json`);
    expect(created).toContain(`${root}/src/handlers/testHandler.ts`);
    expect(created).toContain(`${root}/src/presentation/testPresentation.ts`);
    expect(files[`${root}/src/handlers/testHandler.ts`]).toBe('// handler template');
    expect(files[`${root}/src/presentation/testPresentation.ts`]).toBe('// presentation template');
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
