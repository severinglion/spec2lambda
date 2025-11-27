import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
} from "aws-lambda";

import openApiRouterConfig from "../generated/routerConfig.generated.json" assert { type: "json" };
import { handlersByOperationId } from "./index.js";
import { badRequest, internalError, notFound } from "../presentation/Responses.js";
import { toApiGatewayHttpV2Response as toApiGatewayResult } from "../presentation/adapters.js";
import { match } from "path-to-regexp";

export interface LambdaRequestContext {
  pathParams: Record<string, string>;
  queryParams: Record<string, string | undefined>;
  body: unknown;
  rawEvent: APIGatewayProxyEventV2;
}

export type OperationHandler = (
  ctx: LambdaRequestContext
) => Promise<APIGatewayProxyResultV2> | APIGatewayProxyResultV2;




// Type for the OpenAPI-like router config
type OpenApiRouterConfig = typeof openApiRouterConfig;

export class HttpRouter {
  private handlers: Record<string, OperationHandler>;
  private openApiPaths: { [path: string]: { [method: string]: Record<string, unknown> } };

  constructor(
    handlers: Record<string, OperationHandler> = handlersByOperationId,
    openApiPaths: OpenApiRouterConfig["openapi"]["paths"] = openApiRouterConfig.openapi.paths
  ) {
    this.handlers = handlers;
    this.openApiPaths = openApiPaths;
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

    // 4) Invoke the operation handler with proper error wrapping
    try {
      return await operationHandler(ctx);
    } catch {
      return toApiGatewayResult(internalError({ message: "Internal Server Error" }));
    }
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
