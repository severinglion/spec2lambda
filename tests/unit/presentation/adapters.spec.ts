import { describe, it, expect } from "vitest";
import { toApiGatewayRestResponse, toApiGatewayHttpV2Response } from "../../../src/presentation/adapters";

const baseResponse = {
  statusCode: 200,
  body: { foo: "bar" },
  headers: { "X-Test": "1" }
};

describe("adapters", () => {
  describe("toApiGatewayRestResponse", () => {
    it("serializes object body as JSON", () => {
      const res = toApiGatewayRestResponse(baseResponse);
      expect(res.body).toBe(JSON.stringify({ foo: "bar" }));
      expect(res.statusCode).toBe(200);
      expect(res.headers).toBeDefined();
      expect(res.headers!["Content-Type"]).toBe("application/json");
      expect(res.headers!["X-Test"]).toBe("1");
      expect(res.isBase64Encoded).toBe(false);
    });
    it("returns string body unchanged", () => {
      const res = toApiGatewayRestResponse({ ...baseResponse, body: "hello" });
      expect(res.body).toBe("hello");
    });
    it("omits body for 204", () => {
      const res = toApiGatewayRestResponse({ ...baseResponse, statusCode: 204 });
      expect(res.body).toBe("");
    });
    it("handles undefined body for non-204", () => {
      const res = toApiGatewayRestResponse({ ...baseResponse, body: undefined });
      expect(res.body).toBe("");
    });
    it("handles null body", () => {
      const res = toApiGatewayRestResponse({ ...baseResponse, body: null });
      expect(res.body).toBe("null");
    });
    it("handles empty string body", () => {
      const res = toApiGatewayRestResponse({ ...baseResponse, body: "" });
      expect(res.body).toBe("");
    });
  });

  describe("toApiGatewayHttpV2Response", () => {
    it("serializes object body as JSON", () => {
      const res = toApiGatewayHttpV2Response(baseResponse);
      expect(res.body).toBe(JSON.stringify({ foo: "bar" }));
      expect(res.statusCode).toBe(200);
      expect(res.headers).toBeDefined();
      expect(res.headers!["Content-Type"]).toBe("application/json");
      expect(res.headers!["X-Test"]).toBe("1");
      expect(res.isBase64Encoded).toBe(false);
    });
    it("returns string body unchanged", () => {
      const res = toApiGatewayHttpV2Response({ ...baseResponse, body: "hello" });
      expect(res.body).toBe("hello");
    });
    it("omits body for 204", () => {
      const res = toApiGatewayHttpV2Response({ ...baseResponse, statusCode: 204 });
      expect(res.body).toBeUndefined();
    });
    it("handles undefined body for non-204", () => {
      const res = toApiGatewayHttpV2Response({ ...baseResponse, body: undefined });
      expect(res.body).toBeUndefined();
    });
    it("handles null body", () => {
      const res = toApiGatewayHttpV2Response({ ...baseResponse, body: null });
      expect(res.body).toBe("null");
    });
    it("handles empty string body", () => {
      const res = toApiGatewayHttpV2Response({ ...baseResponse, body: "" });
      expect(res.body).toBe("");
    });
  });
});
