export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HttpRequest<PathParams = unknown, Query = unknown, Body = unknown> {
  method: HttpMethod;
  path: string;
  pathParams: PathParams;
  query: Query;
  headers: Record<string, string | undefined>;
  body: Body;
}

export interface HttpResponse<Body = unknown> {
  statusCode: number;
  headers?: Record<string, string>;
  body?: Body;
}
