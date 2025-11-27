import type { LambdaRequestContext } from "./HttpRouter";
import type { HttpResponse } from "../presentation/HttpTypes";

export interface Handler {
  (event: LambdaRequestContext): Promise<HttpResponse<unknown>>;
}

