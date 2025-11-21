import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
} from "aws-lambda";

import { routes as defaultRoutes } from "../generated/routerConfig.js";
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



export class HttpRouter {
  private handlers: Record<string, OperationHandler>;
  private routes: typeof defaultRoutes;

  constructor(
    handlers: Record<string, OperationHandler> = handlersByOperationId,
    routes: typeof defaultRoutes = defaultRoutes
  ) {
    this.handlers = handlers;
    this.routes = routes;
  }

  private findRoute(method: string, rawPath: string) {
    return this.routes.find(
      (r) => r.method === method && r.pathRegex.test(rawPath)
    );
  }

  public async lambdaHandler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
    const method = event.requestContext.http.method.toUpperCase();
    const rawPath = event.rawPath || "/";

    // 1) Find matching route from injected or default routerConfig
    const route = this.findRoute(method, rawPath);
    if (!route) {
      return toApiGatewayResult(notFound({ message: "Not Found" }));
    }

    // 2) Look up the operation handler by operationId
    const operationHandler = this.handlers[route.operationId];
    if (!operationHandler) {
      console.error(`No handler registered for operationId=${route.operationId}`);
      return toApiGatewayResult(internalError({ message: "Handler not implemented" }));
    }

    // 3) Build LambdaRequestContext
    let body: unknown;
    try {
      body = this.parseBody(event);
    } catch (err: any) {
      if (err?.message === "INVALID_JSON_BODY") {
        return toApiGatewayResult(badRequest({ message: "Malformed JSON body" }));
      }
      console.error("Unexpected body parse error", err);
      return toApiGatewayResult(internalError({ message: "Internal Server Error" }));
    }

    const pathParams = this.extractPathParams(rawPath, route.rawPath);

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
    } catch (err) {
      console.error(
        `Unhandled error in operationId=${route.operationId}`,
        err
      );
      return toApiGatewayResult(internalError({ message: "Internal Server Error" }));
    }
  }

  private extractPathParams(
    rawPath: string,
    openApiPath: string
  ): Record<string, string> {
    // If the path uses a wildcard like "/*", there are no named params
    // and path-to-regexp will throw
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
        // No match, no params
        return {};
      }

      return result.params;
    } catch (err) {
      console.error(
        `Error extracting path params for rawPath=${rawPath} openApiPath=${openApiPath}`,
        err
      );
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
