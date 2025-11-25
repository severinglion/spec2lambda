/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { HttpRouter, OperationHandler } from "../../../src/handlers/HttpRouter";

// Minimal route config for tests
const routes = [
  {
    method: "GET",
    pathRegex: /^\/users\/\d+$/,
    rawPath: "/users/{userId}",
    operationId: "getUser"
  }
];

const baseEvent: APIGatewayProxyEventV2 = {
  requestContext: { http: { method: "GET" } } as any,
  rawPath: "/users/123",
  body: '{"foo":"bar"}',
  isBase64Encoded: false,
  queryStringParameters: { q: "1" }
} as any;

describe("HttpRouter (class)", () => {
  it("returns 404 if no route", async () => {
    const router = new HttpRouter({}, []);
    const res = await router.lambdaHandler({ ...baseEvent, rawPath: "/nope" }) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(404);
  });

  it("returns 500 if no handler", async () => {
    const router = new HttpRouter({}, routes);
    const res = await router.lambdaHandler(baseEvent) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 for malformed JSON body", async () => {
    const router = new HttpRouter({ getUser: vi.fn() }, routes);
    const event = { ...baseEvent, body: "{" };
    const res = await router.lambdaHandler(event) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(400);
  });

  it("returns 500 for handler error", async () => {
    const router = new HttpRouter({ getUser: vi.fn().mockImplementation(() => { throw new Error("fail"); }) }, routes);
    const res = await router.lambdaHandler(baseEvent) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(500);
  });

  it("returns handler result on success", async () => {
    const handler: OperationHandler = vi.fn().mockResolvedValue({ statusCode: 200, body: "ok" });
    const router = new HttpRouter({ getUser: handler }, routes);
    const res = await router.lambdaHandler(baseEvent) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('ok');
  });

  it("passes correct context to handler", async () => {
    const handler = vi.fn().mockResolvedValue({ statusCode: 200 });
    const router = new HttpRouter({ getUser: handler }, routes);
    await router.lambdaHandler(baseEvent);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        pathParams: { userId: "123" },
        queryParams: { q: "1" },
        body: { foo: "bar" },
        rawEvent: expect.any(Object)
      })
    );
  });
});



