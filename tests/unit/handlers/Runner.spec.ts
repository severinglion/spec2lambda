import { describe, it, beforeEach, expect, vi } from 'vitest';
import { Runner } from '../../../src/handlers/Runner';
import { ZodType, z } from 'zod';
import type { LambdaRequestContext } from '../../../src/handlers/HttpRouter';
import { APIGatewayEventRequestContextV2 } from 'aws-lambda';
type HttpResponse = { statusCode: number; body?: unknown; headers?: Record<string, string> };


describe('Runner', () => {
  let runner: Runner;
  let ctx: LambdaRequestContext;

  beforeEach(() => {
    runner = new Runner();
    ctx = {
      pathParams: {},
      queryParams: {},
      body: undefined,
      rawEvent: {
        version: '2.0',
        routeKey: '$default',
        rawPath: '/',
        rawQueryString: '',
        headers: {},
        requestContext: {
          accountId: '',
          apiId: '',
          domainName: '',
          domainPrefix: '',
          http: {
            method: 'GET',
            path: '/',
            protocol: '',
            sourceIp: '',
            userAgent: '',
          },
          requestId: '',
          routeKey: '',
          stage: '',
          time: '',
          timeEpoch: 0,
        } as APIGatewayEventRequestContextV2,
        isBase64Encoded: false,
      },
    };
  });

  it('should call pre and post hooks', async () => {
    const pre = vi.fn();
    const post = vi.fn();
    runner.setHooks({ pre, post });
    const handler = vi.fn().mockResolvedValue({ statusCode: 200, body: 'ok' } as HttpResponse);
    await runner.run(ctx, handler);
    expect(pre).toHaveBeenCalledWith(ctx);
    expect(post).toHaveBeenCalledWith(ctx, expect.objectContaining({ statusCode: 200, body: 'ok' }));
  });


  it('should validate input and output schemas (object body)', async () => {
    const inputSchema: ZodType = z.any();
    const outputSchema: ZodType = z.object({ bar: z.string() });
    const handler = vi.fn().mockResolvedValue({ statusCode: 200, body: { bar: 'baz' } } as HttpResponse);
    ctx.body = { foo: 'bar' };
    const result = await runner.run(ctx, handler, undefined, inputSchema, outputSchema);
    expect((result as { body: string }).body).toBe(JSON.stringify({ bar: 'baz' }));
  });

  it('should validate output schema (string body)', async () => {
    const outputSchema: ZodType = z.string();
    const handler = vi.fn().mockResolvedValue({ statusCode: 200, body: 'ok' } as HttpResponse);
    ctx.body = 'foo';
    const result = await runner.run(ctx, handler, undefined, undefined, outputSchema);
    expect((result as { body: string }).body).toBe('ok');
  });

  it('should return 500 if output schema is defined but response body is missing', async () => {
    const outputSchema: ZodType = z.string();
    const handler = vi.fn().mockResolvedValue({ statusCode: 200 } as HttpResponse);
    const result = await runner.run(ctx, handler, undefined, undefined, outputSchema);
    expect((result as { statusCode: number }).statusCode).toBe(500);
    const errorMsg = JSON.parse((result as { body: string }).body).error;
    expect(errorMsg).toContain('Output schema is defined but response has no body property');
  });

  it('should return 500 if output schema is defined but response has no body property', async () => {
    const outputSchema: ZodType = z.string();
    const handler = vi.fn().mockResolvedValue({ statusCode: 200 } as HttpResponse);
    const result = await runner.run(ctx, handler, undefined, undefined, outputSchema);
    expect((result as { statusCode: number }).statusCode).toBe(500);
    const errorMsg = JSON.parse((result as { body: string }).body).error;
    expect(errorMsg).toContain('Output schema is defined but response has no body property');
  });

  it('should use custom error handler', async () => {
    const errorHandler = vi.fn().mockResolvedValue({ statusCode: 500, body: 'fail' });
    runner.setErrorHandler(errorHandler);
    const handler = vi.fn().mockRejectedValue(new Error('fail'));
    await runner.run(ctx, handler);
    expect(errorHandler).toHaveBeenCalled();
  });

  it('should extract params from event', async () => {
    ctx.pathParams = { id: '123' };
    ctx.queryParams = { q: 'test' };
    ctx.body = { foo: 'bar' };
    let paramsResult: unknown = null;
    const handler = vi.fn().mockImplementation(async (params: unknown) => {
      paramsResult = params;
      return { statusCode: 200, body: 'ok' } as HttpResponse;
    });
    await runner.run(ctx, handler);
    expect(paramsResult).toMatchObject({ pathParams: { id: '123' }, queryParams: { q: 'test' }, body: { foo: 'bar' } });
  });
});
