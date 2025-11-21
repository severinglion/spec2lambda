// src/presentation/http/adapters.ts
import type {
  APIGatewayProxyResult,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import type { HttpResponse } from "./HttpTypes.js";

function serializeBody(statusCode: number, body: unknown): string | undefined {
  // 204 MUST NOT have a body
  if (statusCode === 204 || body === undefined) {
    return undefined;
  }

  if (typeof body === "string") {
    return body;
  }

  return JSON.stringify(body);
}

/**
 * Adapter for API Gateway REST API / Lambda Function URLs
 * (payload format v1 → APIGatewayProxyResult).
 */
export function toApiGatewayRestResponse<T>(
  httpResponse: HttpResponse<T>
): APIGatewayProxyResult {
  const { statusCode, body, headers } = httpResponse;

  const payload = serializeBody(statusCode, body) ?? "";

  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    body: payload,
    isBase64Encoded: false,
  };
}

/**
 * Adapter for API Gateway HTTP API (payload format v2).
 */
export function toApiGatewayHttpV2Response<T>(
  httpResponse: HttpResponse<T>
): APIGatewayProxyStructuredResultV2 {
  const { statusCode, body, headers } = httpResponse;

  const payload = serializeBody(statusCode, body);

  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    // v2 allows body to be undefined for 204s
    body: payload,
    isBase64Encoded: false,
  };
}
