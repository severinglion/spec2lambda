import type { HttpResponse } from "./HttpTypes.js";

export function ok<T>(body: T, headers?: Record<string, string>): HttpResponse<T> {
  return { statusCode: 200, body, headers };
}

export function created<T>(
  body: T,
  headers?: Record<string, string>
): HttpResponse<T> {
  return { statusCode: 201, body, headers };
}

export function noContent(headers?: Record<string, string>): HttpResponse<never> {
  return { statusCode: 204, headers };
}

export function badRequest<T = { message: string }>(
  body: T
): HttpResponse<T> {
  return { statusCode: 400, body };
}

export function notFound<T = { message: string }>(
  body: T
): HttpResponse<T> {
  return { statusCode: 404, body };
}

export function internalError<T = { message: string }>(
  body: T
): HttpResponse<T> {
  return { statusCode: 500, body };
}
