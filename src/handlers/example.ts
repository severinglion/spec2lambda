

import type { Handler } from "./HandlerTypes";
import type { components } from "../generated/openapi.types";
import { ok, created, notFound, badRequest } from "../presentation/Responses";
import * as schemas from "../generated/schemas.zod";

// In-memory user store for example purposes
const users = new Map<string, components["schemas"]["User"]>();

// Helper to generate a random user ID
function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// GET /users
export const listUsers: Handler = async () => {
  return ok(Array.from(users.values()));
};

// POST /users
export const createUser: Handler = async (event) => {
  try {
    const bodyRaw = event.body;
    const body = typeof bodyRaw === "string" ? JSON.parse(bodyRaw) : bodyRaw;
    const parseResult = schemas.createUserBody.safeParse(body);
    if (!parseResult.success) {
      return badRequest({ message: "Missing or invalid name/email", issues: parseResult.error.issues });
    }
    const id = generateId();
    const user: components["schemas"]["User"] = { id, ...parseResult.data };
    users.set(id, user);
    return created(user);
  } catch (err) {
    console.error("Error creating user", err);
    return badRequest({ message: "Invalid JSON body" });
  }
};

// GET /users/{userId}
export const getUser: Handler = async (event) => {
  const userId = event.pathParameters?.userId;
  const paramResult = schemas.getUserParams.safeParse({ userId });
  if (!paramResult.success) {
    return badRequest({ message: "Missing or invalid userId", issues: paramResult.error.issues });
  }
  const user = users.get(paramResult.data.userId);
  if (!user) {
    return notFound({ message: "User not found" });
  }
  return ok(user);
};
