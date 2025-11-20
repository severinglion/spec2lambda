import { describe, it, expect, vi } from 'vitest';
import * as routerConfigCore from '../../../src/scripts/routerConfigCore.cjs';


const validYaml = `
openapi: 3.1.0
paths:
  /foo:
    get:
      operationId: getFoo
  /bar/{baz}:
    post:
      operationId: postBarBaz
`;

const invalidYaml = `
openapi: 3.1.0
paths:
  /foo:
    get
      operationId: getFoo
`;

describe('routerConfigCore.cjs', () => {
  describe('parseSpec', () => {
    it('parses valid OpenAPI YAML to JS object', () => {
      const mockRead = vi.fn().mockReturnValue(validYaml);
      const result = routerConfigCore.parseSpec('fake/path/openapi.yml', mockRead);
      expect(result).toHaveProperty('openapi', '3.1.0');
      expect(result.paths).toHaveProperty('/foo');
    });

    it('throws on invalid YAML', () => {
      const mockRead = vi.fn().mockReturnValue(invalidYaml);
      expect(() => routerConfigCore.parseSpec('fake/path/openapi.yml', mockRead)).toThrow();
    });

    it('throws if file does not exist', () => {
      const mockRead = vi.fn(() => { throw new Error('ENOENT'); });
      expect(() => routerConfigCore.parseSpec('missing/path/openapi.yml', mockRead)).toThrow('ENOENT');
    });

    it('throws if YAML does not contain paths', () => {
      const mockRead = vi.fn().mockReturnValue('openapi: 3.1.0');
      expect(() => routerConfigCore.parseSpec('fake/path/openapi.yml', mockRead)).toThrow(/paths/i);
    });
  });

  describe('flattenRoutes', () => {
    it('flattens OpenAPI object into correct RouteConfig array', () => {
      const openApi = {
        openapi: '3.1.0',
        paths: {
          '/foo': { get: { operationId: 'getFoo' } },
          '/bar/{baz}': { post: { operationId: 'postBarBaz' } }
        }
      };
      const routes = routerConfigCore.flattenRoutes(openApi);
      expect(routes).toHaveLength(2);
      expect(routes[0]).toMatchObject({
        method: 'GET',
        rawPath: '/foo',
        operationId: 'getFoo'
      });
      expect(routes[1].pathRegex).toBeInstanceOf(RegExp);
      expect('/bar/123').toMatch(routes[1].pathRegex);
    });

    it('skips methods without operationId', () => {
      const openApi = {
        openapi: '3.1.0',
        paths: {
          '/foo': { get: {}, post: { operationId: 'fooPost' } }
        }
      };
      const routes = routerConfigCore.flattenRoutes(openApi);
      expect(routes).toHaveLength(1);
      expect(routes[0].operationId).toBe('fooPost');
    });

    it('handles multiple methods per path', () => {
      const openApi = {
        openapi: '3.1.0',
        paths: {
          '/bar': { get: { operationId: 'getBar' }, post: { operationId: 'postBar' } }
        }
      };
      const routes = routerConfigCore.flattenRoutes(openApi);
      expect(routes.map(r => r.method)).toEqual(['GET', 'POST']);
    });

    it('throws on malformed input', () => {
      expect(() => routerConfigCore.flattenRoutes({})).toThrow();
      expect(() => routerConfigCore.flattenRoutes({ openapi: '3.1.0' })).toThrow();
    });

    it('generates regex that matches Lambda event paths', () => {
      const openApi = {
        openapi: '3.1.0',
        paths: {
          '/foo/{bar}': { get: { operationId: 'getBar' } }
        }
      };
      const routes = routerConfigCore.flattenRoutes(openApi);
      expect('/foo/abc').toMatch(routes[0].pathRegex);
      expect('/foo/abc/').toMatch(routes[0].pathRegex);
      expect('/foo/').not.toMatch(routes[0].pathRegex);
    });
  });

  describe('saveRouteConfig', () => {
    it('writes the route config to a file', () => {
      const routes = [
        { method: 'GET', rawPath: '/foo', pathRegex: /^\/foo$/, operationId: 'getFoo' }
      ];
      const expectedTs = expect.stringContaining('export const routes: RouteConfig[]');
      const mockWrite = vi.fn();
      routerConfigCore.saveRouteConfig('fake/output.ts', routes, mockWrite);
      expect(mockWrite).toHaveBeenCalledWith('fake/output.ts', expect.any(String));
    });
  });

  describe('run', () => {
    it('runs the full pipeline (integration smoke test)', () => {
      const mockRead = vi.fn().mockReturnValue(validYaml);
      const mockWrite = vi.fn();
      routerConfigCore.run('fake/path/openapi.yml', 'fake/output.ts', { readFileSync: mockRead, writeFileSync: mockWrite });
      expect(mockWrite).toHaveBeenCalled();
      const written = mockWrite.mock.calls[0][1];
      expect(written).toContain('RouteConfig');
      expect(written).toContain('getFoo');
      expect(written).toContain('postBarBaz');
    });
  });
});