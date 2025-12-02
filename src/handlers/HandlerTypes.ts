import type { LambdaRequestContext } from "./HttpRouter.js";
import type { HttpResponse } from "../presentation/HttpTypes.js";

export interface Handler {
  (event: LambdaRequestContext): Promise<HttpResponse<unknown>>;
}

