/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSchemaMap } from '../../../src/scripts/generate';

describe('generateSchemaMap', () => {
  const fakeFs: Record<string, unknown> = {
    existsSync: vi.fn((p: string) => {
      // Simulate schemas.zod.ts always exists
      if (typeof p === 'string' && p.endsWith('schemas.zod.ts')) return true;
      if (typeof p === 'string' && p.endsWith('src/generated')) return true;
      return false;
    }),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
  const fakeLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

  beforeEach(() => {
    // Clear all mock calls before each test
    (fakeFs.existsSync as any).mockClear();
    (fakeFs.mkdirSync as any).mockClear();
    (fakeFs.writeFileSync as any).mockClear();
    fakeLogger.info.mockClear();
    fakeLogger.warn.mockClear();
    fakeLogger.error.mockClear();
  });

  it('writes a schema map for operationIds', async () => {
    const openapi = {
      paths: {
        '/users': {
          get: { operationId: 'listUsers' },
          post: { operationId: 'createUser' },
        },
        '/users/{userId}': {
          get: { operationId: 'getUser' },
        },
      },
    };
    // Simulate schemas.zod.ts content
    const schemasContent = `
      export const listUsersQueryParams = {};
      export const listUsersBody = {};
      export const listUsersResponse = {};
      export const createUserBody = {};
      export const createUserResponse = {};
      export const getUserParams = {};
      export const getUserBody = {};
      export const getUserResponse = {};
    `;
    (fakeFs.readFileSync as any) = vi.fn(() => schemasContent);
    await generateSchemaMap({ fs: fakeFs, logger: fakeLogger }, openapi);
    const expectedMap = {
      listUsers: { parameters: 'listUsersQueryParams', inputBody: 'listUsersBody', output: 'listUsersResponse' },
      createUser: { inputBody: 'createUserBody', output: 'createUserResponse' },
      getUser: { parameters: 'getUserParams', inputBody: 'getUserBody', output: 'getUserResponse' },
    };
    // Check that writeFileSync was called with the correct path and JSON
    const writeFileSyncMock = fakeFs.writeFileSync as unknown as { mock: { calls: unknown[][] } };
    const call = writeFileSyncMock.mock.calls.find((args: unknown[]) => {
      const filePath = args[0] as string;
      return filePath.endsWith('schemaMap.generated.json');
    });
    expect(call).toBeTruthy();
    if (call) {
      const json = JSON.parse(call[1] as string);
      expect(json).toMatchObject(expectedMap);
    }
  });

  it('warns and does not write if no openapi paths', async () => {
    await generateSchemaMap({ fs: fakeFs, logger: fakeLogger }, {});
    expect(fakeLogger.warn).toHaveBeenCalled();
    // Check that no call to writeFileSync used a path ending with schemaMap.generated.json (cross-platform)
    const writeFileSyncMock = fakeFs.writeFileSync as unknown as { mock: { calls: unknown[][] } };
    const wroteSchemaMap = writeFileSyncMock.mock.calls.some((args: unknown[]) => {
      const filePath = args[0] as string;
      return /[\\/]?schemaMap\.generated\.json$/.test(filePath);
    });
    expect(wroteSchemaMap).toBe(false);
  });
});
