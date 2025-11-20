export interface PageRequest {
  limit: number;
  cursor?: string; // opaque; infra knows how to interpret it
}

export interface PageResult<T> {
  items: T[];
  nextCursor?: string;
  // optionally:
  // prevCursor?: string;
  // totalCount?: number; // only if you can afford it
}
