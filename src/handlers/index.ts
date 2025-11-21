// src/handlers/index.ts
import type { APIGatewayProxyResultV2 } from "aws-lambda";
import type { LambdaRequestContext } from "./HttpRouter.js";

export type HandlerFn = (
  ctx: LambdaRequestContext
) => Promise<APIGatewayProxyResultV2> | APIGatewayProxyResultV2;

// Import handler functions

export const handlersByOperationId: Record<string, HandlerFn> = {
  // Map operationIds to handler functions here
};
