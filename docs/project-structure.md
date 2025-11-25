# Project Structure

This document explains the layout of a `spec2lambda`-based service, the role of each directory, and which files are user-owned vs. generated.

## Directory Map

- `api/` — Your OpenAPI spec (`openapi.yml`). User-owned. Edit freely.
- `src/generated/` — All code generated from the spec (types, validators, router config). **Generated. Always overwritten. Never edit directly.**
- `src/handlers/` — Your Lambda handler implementations. User-owned. Scaffolded and extended by you.
- `src/presentation/` — Adapters, response helpers, and HTTP presentation logic. User-owned.
- `src/core/` — (Optional) Shared business logic, utilities, or abstractions. User-owned.
- `tests/` — Unit and integration tests. User-owned.

## Ownership & Regeneration Safety
- **User-owned**: `api/`, `src/handlers/`, `src/presentation/`, `src/core/`, `tests/`
- **Generated (ephemeral)**: `src/generated/` and router config. These are always safe to delete and regenerate. Never hand-edit.

## Adapters & Responses
- Adapters in `src/presentation/` connect your handler logic to the generated contracts, ensuring type safety and consistent HTTP responses.
- Responses are helpers for common HTTP patterns (ok, notFound, badRequest, etc.), and can be extended as needed.

## Example Workflow
1. Run `spec2lambda init <project-name>` to scaffold a new project and set the name.
2. Edit `api/openapi.yml` to define or update endpoints.
3. Run `spec2lambda generate` to regenerate types, schemas, routes, and grouped handler stubs (e.g., all user operations in `src/handlers/users.ts`).
4. Implement business logic in grouped handler files. Handlers are auto-wired to the framework by operationId.
5. Use adapters and responses to shape output.
6. Test and iterate.
