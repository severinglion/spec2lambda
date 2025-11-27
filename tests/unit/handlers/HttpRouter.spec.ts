
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { HttpRouter, OperationHandler } from "../../../src/handlers/HttpRouter";

// Minimal OpenAPI-style route config for tests
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const openApiRoutes = {
  "/users/{userId}": {
    get: {
      summary: "Get a user",
      operationId: "getUser",
      responses: {
        "200": {
          description: "User found"
        }
      }
    },
    post: {
      summary: "Update a user",
      operationId: "updateUser",
      responses: {
        "200": {
          description: "User updated"
        }
      }
    }
  },
  "/users": {
    get: {
      summary: "List users",
      operationId: "listUsers",
      responses: {
        "200": {
          description: "A list of users"
        }
      }
    }
  }
};


const baseEvent: APIGatewayProxyEventV2 = {
  version: "2.0",
  routeKey: "$default",
  rawPath: "/users/123",
  rawQueryString: "q=1",
  headers: {},
  requestContext: {
    accountId: "test",
    apiId: "test",
    domainName: "test",
    domainPrefix: "test",
    http: {
      method: "GET",
      path: "/users/123",
      protocol: "HTTP/1.1",
      sourceIp: "127.0.0.1",
      userAgent: "vitest"
    },
    requestId: "test",
    routeKey: "$default",
    stage: "$default",
    time: "01/Jan/2020:00:00:00 +0000",
    timeEpoch: 0
  },
  body: '{"foo":"bar"}',
  isBase64Encoded: false,
  queryStringParameters: { q: "1" }
};

describe("HttpRouter (class)", () => {
  it("returns 404 if no route", async () => {
    const router = new HttpRouter({}, openApiRoutes as any);
    const res = await router.lambdaHandler({ ...baseEvent, rawPath: "/nope" }) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(404);
  });

  it("returns 404 if path exists but method does not", async () => {
    const router = new HttpRouter({}, openApiRoutes as any);
    const event = {
      ...baseEvent,
      rawPath: "/users/123",
      requestContext: {
        ...baseEvent.requestContext,
        http: { ...baseEvent.requestContext.http, method: "DELETE" }
      }
    };
    const res = await router.lambdaHandler(event) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(404);
  });

  it("returns 500 if no handler", async () => {
    const router = new HttpRouter({}, openApiRoutes as any);
    const res = await router.lambdaHandler(baseEvent) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 for malformed JSON body", async () => {
    const router = new HttpRouter({ getUser: vi.fn() }, openApiRoutes as any);
    const event = { ...baseEvent, body: "{" };
    const res = await router.lambdaHandler(event) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(400);
  });

  it("returns 500 for handler error", async () => {
    const router = new HttpRouter({ getUser: vi.fn().mockImplementation(() => { throw new Error("fail"); }) }, openApiRoutes as any);
    const res = await router.lambdaHandler(baseEvent) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(500);
  });

  it("returns handler result on success", async () => {
    const handler: OperationHandler = vi.fn().mockResolvedValue({ statusCode: 200, body: "ok" });
    const router = new HttpRouter({ getUser: handler }, openApiRoutes as any);
    const res = await router.lambdaHandler(baseEvent) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('ok');
  });

  it("passes correct context to handler", async () => {
    const handler = vi.fn().mockResolvedValue({ statusCode: 200 });
    const router = new HttpRouter({ getUser: handler }, openApiRoutes as any);
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



