import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { HttpResponse } from "../presentation/HttpTypes";

export interface Handler {
  (event: APIGatewayProxyEventV2): Promise<HttpResponse<any>>;
}
