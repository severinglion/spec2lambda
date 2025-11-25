/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from "vitest";
import * as example from "../../../src/handlers/example";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

function makeEvent(partial: Partial<APIGatewayProxyEventV2>): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "",
    rawPath: "/users",
    rawQueryString: "",
    headers: {},
    requestContext: { http: { method: "GET" } } as any,
    isBase64Encoded: false,
    ...partial,
  };
}

describe("example.ts handlers", () => {
  beforeEach(() => {
    // Reset in-memory users before each test
    (example as any).users?.clear?.();
  });

  describe("listUsers", () => {
    it("returns empty array when no users exist", async () => {
      const res = await example.listUsers(makeEvent({}));
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("createUser", () => {
    it("creates a user with valid input", async () => {
      const res = await example.createUser(
        makeEvent({
          body: JSON.stringify({ name: "Alice", email: "alice@example.com" }),
        })
      );
      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({ name: "Alice", email: "alice@example.com" });
    });

    it("fails with missing name", async () => {
      const res = await example.createUser(
        makeEvent({ body: JSON.stringify({ email: "x@example.com" }) })
      );
      expect(res.statusCode).toBe(400);
    });

    it("fails with invalid email type", async () => {
      const res = await example.createUser(
        makeEvent({ body: JSON.stringify({ name: "Bob", email: 123 }) })
      );
      expect(res.statusCode).toBe(400);
    });

    it("fails with malformed JSON", async () => {
      const res = await example.createUser(
        makeEvent({ body: "{" })
      );
      expect(res.statusCode).toBe(400);
    });
  });

  describe("getUser", () => {
    it("returns 404 for non-existent user", async () => {
      const res = await example.getUser(
        makeEvent({ pathParameters: { userId: "nope" } })
      );
      expect(res.statusCode).toBe(404);
    });

    it("returns 400 for missing userId", async () => {
      const res = await example.getUser(makeEvent({ pathParameters: {} }));
      expect(res.statusCode).toBe(400);
    });

    it("returns the user after creation", async () => {
      // Create user
      const createRes = await example.createUser(
        makeEvent({ body: JSON.stringify({ name: "Eve", email: "eve@example.com" }) })
      );
      const user = createRes.body as { id: string; name: string; email: string };
      const userId = user.id;
      // Get user
      const getRes = await example.getUser(
        makeEvent({ pathParameters: { userId } })
      );
      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toMatchObject({ name: "Eve", email: "eve@example.com" });
    });
  });
});
