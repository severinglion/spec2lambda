import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction
} from "express";
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { fileURLToPath } from "node:url";
import type {
  APIGatewayProxyEventV2,
  Context,
  APIGatewayProxyResultV2
} from "aws-lambda";
import { handler as lambdaHandler } from "../src/handlers/HttpRouter.js";

console.log('Starting local dev server...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
app.use(express.json());

console.log('Loading OpenAPI spec...');
const specPath = path.join(
  __dirname,
  "..",
  "docs",
  "openapi.yml"
);
const spec = yaml.parse(fs.readFileSync(specPath, "utf8"));

// Serve raw spec (useful for other tools, ReDoc, etc.)
app.get("/openapi/spec.yml", (_req: Request, res: Response) => {
  res.type("text/yaml").send(fs.readFileSync(specPath, "utf8"));
});

// Swagger UI at /docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));

/**
 * Convert Express request → APIGatewayProxyEventV2-ish object
 */
function toApiGatewayEvent(req: Request): APIGatewayProxyEventV2 {
  // Build rawQueryString and queryStringParameters
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v != null) searchParams.append(key, String(v));
      }
    } else if (value != null) {
      searchParams.append(key, String(value));
    }
  }

  const rawQueryString = searchParams.toString();
  const queryStringParameters: Record<string, string> = {};
  for (const [k, v] of searchParams.entries()) {
    queryStringParameters[k] = v;
  }

  const headers: Record<string, string> = Object.fromEntries(
    Object.entries(req.headers).map(([k, v]) => [k, String(v)])
  );

  return {
    version: "2.0",
    routeKey: `${req.method} ${req.path}`,
    rawPath: req.path,
    rawQueryString,
    headers,
    requestContext: {
      accountId: "local-dev",
      apiId: "local-dev",
      domainName: "localhost",
      domainPrefix: "localhost",
      http: {
        method: req.method,
        path: req.path,
        protocol: "HTTP/1.1",
        // 👇 Fix: req.ip is string | undefined, Lambda expects string
        sourceIp:
          req.ip ??
          (req.socket.remoteAddress ?? "127.0.0.1"),
        userAgent: req.get("user-agent") ?? ""
      },
      requestId: "local-dev-request",
      routeKey: `${req.method} ${req.path}`,
      stage: "$default",
      time: new Date().toISOString(),
      timeEpoch: Date.now()
    },
    body: req.body ? JSON.stringify(req.body) : undefined,
    isBase64Encoded: false,
    pathParameters: req.params as Record<string, string>,
    queryStringParameters: Object.keys(queryStringParameters).length
      ? queryStringParameters
      : undefined,
    stageVariables: undefined,
    cookies: undefined
  };
}
console.log('Setting up route handler...');
app.use(async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const event = toApiGatewayEvent(req);

    // Minimal dummy context for local dev
    const context: Context = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: "local-dev-handler",
      functionVersion: "$LATEST",
      invokedFunctionArn: "arn:aws:lambda:local:000000000000:function:local-dev-handler",
      memoryLimitInMB: "128",
      awsRequestId: "local-dev-request",
      logGroupName: "/aws/lambda/local-dev-handler",
      logStreamName: "local",
      getRemainingTimeInMillis: () => 30000,
      done: () => { },
      fail: () => { },
      succeed: () => { }
    };

    const lambdaResult = await lambdaHandler(
      event,
    );

    // Handler is allowed to return void according to the AWS types.
    // In that case, just return 204 No Content.
    if (!lambdaResult) {
      res.status(204).end();
      return;
    }

    // If the handler ever returns a plain string, just send it as a 200 response.
    if (typeof lambdaResult === "string") {
      res.status(200).send(lambdaResult);
      return;
    }

    res
      .status(lambdaResult.statusCode ?? 200)
      .set(lambdaResult.headers || {})
      .send(lambdaResult.body);
  } catch (err) {
    console.error("Error in dev server handler", err);
    res.status(500).json({ message: "Dev server error" });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}`);
  console.log(`Swagger UI at http://localhost:${port}/docs`);
  console.log(
    `OpenAPI spec at http://localhost:${port}/openapi/account-service.yml`
  );
});
