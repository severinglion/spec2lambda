

import { APIGatewayProxyResultV2 } from 'aws-lambda';
import type { LambdaRequestContext } from './HttpRouter.js';
import { ZodType } from 'zod';
import { toApiGatewayHttpV2Response } from '../presentation/adapters.js';
import { Handler } from './HandlerTypes.js';

export type RunnerHooks = {
  pre?: (ctx: LambdaRequestContext) => Promise<void> | void;
  post?: (ctx: LambdaRequestContext, result: APIGatewayProxyResultV2) => Promise<void> | void;
};

export type RunnerErrorHandler = (error: unknown, ctx: LambdaRequestContext) => Promise<APIGatewayProxyResultV2> | APIGatewayProxyResultV2;

export interface RunnerOptions {
  hooks?: RunnerHooks;
  errorHandler?: RunnerErrorHandler;
}

export class Runner {
  private hooks: RunnerHooks;
  private errorHandler: RunnerErrorHandler;

  constructor(options?: RunnerOptions) {
    this.hooks = options?.hooks || {};
    this.errorHandler = options?.errorHandler || this.defaultErrorHandler;
  }

  setHooks(hooks: RunnerHooks) {
    this.hooks = hooks;
  }

  setErrorHandler(handler: RunnerErrorHandler) {
    this.errorHandler = handler;
  }

  async run(
    ctx: LambdaRequestContext,
    handler: Handler,
    parameterSchema?: ZodType,
    inputSchema?: ZodType,
    outputSchema?: ZodType
  ): Promise<APIGatewayProxyResultV2> {
    try {
      if (this.hooks.pre) await this.hooks.pre(ctx);
      let params: LambdaRequestContext = ctx;
      // Validate parameters (query/path)
      if (parameterSchema) {
        params = {
          ...params,
          pathParams: parameterSchema.parse(ctx.pathParams) as Record<string, string>,
          queryParams: parameterSchema.parse(ctx.queryParams) as Record<string, string | undefined>
        };
      }
      // Validate body
      if (inputSchema) {
        params = { ...params, body: inputSchema.parse(ctx.body) };
      }
      let result = await handler(params); // result is HttpResponse<unknown>
      if (outputSchema) {
        // Validate the body property of the result if present
        if (result && typeof result === 'object' && 'body' in result) {
          if (result.body === undefined || result.body === null) {
            throw new Error('Output schema is defined but response body is missing');
          }
          const parsedBody = outputSchema.parse(result.body);
          result = { ...result, body: parsedBody };
        } else {
          throw new Error('Output schema is defined but response has no body property');
        }
      }
      // Translate to APIGatewayProxyResultV2 using the adapter
      const apiGatewayResult = toApiGatewayHttpV2Response(result);
      if (this.hooks.post) await this.hooks.post(ctx, apiGatewayResult);
      return apiGatewayResult;
    } catch (error) {
      return this.errorHandler(error, ctx);
    }
  }

  // Default error handler
  private defaultErrorHandler(error: unknown): APIGatewayProxyResultV2 {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: String(error) }),
    };
  }
}
