import defaultSchemaMap from '../generated/schemaMap.generated.json' assert { type: 'json' };
import * as defaultSchemas from '../generated/schemas.zod.js';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
} from "aws-lambda";
import { Runner } from "./Runner.js";
import openApiRouterConfig from "../generated/routerConfig.generated.json" assert { type: "json" };
import { handlersByOperationId } from "./index.js";
import { badRequest, internalError, notFound } from "../presentation/Responses.js";
import { toApiGatewayHttpV2Response as toApiGatewayResult } from "../presentation/adapters.js";
import { match } from "path-to-regexp";
import { Handler } from './HandlerTypes';

export interface LambdaRequestContext {
  pathParams: Record<string, string>;
  queryParams: Record<string, string | undefined>;
  body: unknown;
  rawEvent: APIGatewayProxyEventV2;
}

// Type for the OpenAPI-like router config
type OpenApiRouterConfig = typeof openApiRouterConfig;

export class HttpRouter {
  private handlers: Record<string, Handler>;
  private openApiPaths: { [path: string]: { [method: string]: Record<string, unknown> } };
  private runner: Runner;
  private schemaMap: Record<string, { parameters?: string; inputBody?: string; output?: string }>;
  private schemas: Record<string, unknown>;

  /**
   * Inject a Runner instance for runtime logic (for testability and modularity)
   */
  public setRunner(runner: Runner) {
    this.runner = runner;
  }

  constructor(
    handlers: Record<string, Handler> = handlersByOperationId,
    openApiPaths: OpenApiRouterConfig["openapi"]["paths"] = openApiRouterConfig.openapi.paths,
    runner: Runner = new Runner(),
    schemaMap: Record<string, { parameters?: string; inputBody?: string; output?: string }> = defaultSchemaMap,
    schemas: Record<string, unknown> = defaultSchemas
  ) {
    this.handlers = handlers;
    this.openApiPaths = openApiPaths;
    this.runner = runner;
    this.schemaMap = schemaMap;
    this.schemas = schemas;
  }

  /**
   * Find the OpenAPI path template and method config for a given request path and method.
   * Returns { pathTemplate, methodConfig } or null if not found.
   * If path exists but method does not, returns { pathTemplate, methodConfig: null }.
   */
  private findRoute(method: string, rawPath: string): { pathTemplate: string, methodConfig: Record<string, unknown> } | { pathTemplate: string, methodConfig: null } | null {
    // Try to match the rawPath to a path template in openApiPaths
    for (const pathTemplate in this.openApiPaths) {
      // Convert OpenAPI path template to express style for matching
      const expressStylePath = pathTemplate.replace(/{/g, ":").replace(/}/g, "");
      const matcher = match<Record<string, string>>(expressStylePath, { decode: decodeURIComponent });
      const result = matcher(rawPath);
      if (result) {
        // Path matches, now check for method
        const methodConfig = this.openApiPaths[pathTemplate][method.toLowerCase()];
        if (methodConfig) {
          return { pathTemplate, methodConfig };
        } else {
          // Path exists but method does not
          return { pathTemplate, methodConfig: null };
        }
      }
    }
    // No path match
    return null;
  }

  public async lambdaHandler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
    const method = event.requestContext.http.method.toUpperCase();
    const rawPath = event.rawPath || "/";

    // 1) Find matching route from OpenAPI routerConfig
    const routeResult = this.findRoute(method, rawPath);
    if (!routeResult) {
      // No path match
      return toApiGatewayResult(notFound({ message: "Not Found" }));
    }
    if (routeResult.methodConfig === null) {
      // Path exists but method does not
      return toApiGatewayResult(notFound({ message: "Not Found" }));
    }
    const { pathTemplate, methodConfig } = routeResult;
    // 2) Look up the operation handler by operationId
    const operationId = (methodConfig as { operationId?: string }).operationId;
    if (!operationId) {
      return toApiGatewayResult(internalError({ message: "Handler not implemented" }));
    }
    const operationHandler = this.handlers[operationId];
    if (!operationHandler) {
      return toApiGatewayResult(internalError({ message: "Handler not implemented" }));
    }

    // 3) Build LambdaRequestContext
    let body: unknown;
    try {
      body = this.parseBody(event);

    } catch {
      // Only care about INVALID_JSON_BODY
      return toApiGatewayResult(badRequest({ message: "Malformed JSON body" }));
    }



    const pathParams = this.extractPathParams(rawPath, pathTemplate);

    const queryParams: Record<string, string | undefined> = {
      ...(event.queryStringParameters ?? {})
    };

    const ctx: LambdaRequestContext = {
      pathParams,
      queryParams,
      body,
      rawEvent: event
    };

    // 4) Always delegate to Runner, providing schemas if available
    const schemaEntry = (this.schemaMap as Record<string, { parameters?: string; inputBody?: string; output?: string }>)[operationId] || {};
    let parameterSchema: import('zod').ZodType | undefined, inputSchema: import('zod').ZodType | undefined, outputSchema: import('zod').ZodType | undefined;
    if (schemaEntry.parameters && Object.prototype.hasOwnProperty.call(this.schemas, schemaEntry.parameters)) {
      parameterSchema = (this.schemas as Record<string, unknown>)[schemaEntry.parameters] as import('zod').ZodType;
    }
    if (schemaEntry.inputBody && Object.prototype.hasOwnProperty.call(this.schemas, schemaEntry.inputBody)) {
      inputSchema = (this.schemas as Record<string, unknown>)[schemaEntry.inputBody] as import('zod').ZodType;
    }
    if (schemaEntry.output && Object.prototype.hasOwnProperty.call(this.schemas, schemaEntry.output)) {
      outputSchema = (this.schemas as Record<string, unknown>)[schemaEntry.output] as import('zod').ZodType;
    }
    if ((schemaEntry.parameters && !parameterSchema) || (schemaEntry.inputBody && !inputSchema) || (schemaEntry.output && !outputSchema)) {
      console.warn(`[spec2lambda] Warning: Missing parameter/input/output schema for operationId '${operationId}'. This may mean the OpenAPI spec is incomplete or codebase needs to be regenerated.`);
    }
    // Always wrap operationHandler to ensure a Promise return
    return await this.runner.run(
      ctx,
      operationHandler,
      parameterSchema,
      inputSchema,
      outputSchema
    );
  }

  private extractPathParams(
    rawPath: string,
    openApiPath: string
  ): Record<string, string> {
    // If the path uses a wildcard like "/*", there are no named params
    if (openApiPath.includes("*")) {
      return {};
    }
    const expressStylePath = openApiPath.replace(/{/g, ":").replace(/}/g, "");
    try {
      const matcher = match<Record<string, string>>(expressStylePath, {
        decode: decodeURIComponent
      });
      const result = matcher(rawPath);
      if (!result) {
        return {};
      }
      return result.params;
    } catch {
      return {};
    }
  }

  private parseBody(event: APIGatewayProxyEventV2): unknown {
    if (!event.body) return undefined;

    try {
      const raw = event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf8")
        : event.body;
      return JSON.parse(raw);
    } catch {
      // Let caller decide how to respond
      throw new Error("INVALID_JSON_BODY");
    }
  }
}


// For AWS Lambda entrypoint
export const handler = new HttpRouter().lambdaHandler.bind(new HttpRouter());
