
# spec2lambda
A TypeScript template and generator for building spec-driven AWS Lambda APIs using OpenAPI, code generation, grouped handler stubs, and a local dev server.


## Project Structure
- `api/` — Your OpenAPI spec (`openapi.yml`). User-owned. Edit freely.
- `src/generated/` — All code generated from the spec (types, schemas, router config). **Generated. Always overwritten. Never edit directly.**
- `src/handlers/` — Grouped Lambda handler implementations (e.g., `users.ts` for all user operations). User-owned, but stubs are generated as needed.
- `src/presentation/` — Adapters, response helpers, and HTTP presentation logic. User-owned.
- `tests/` — Unit and integration tests. User-owned.
- `local-dev/` — Local development server setup and entrypoint.

See [`docs/project-structure.md`](./docs/project-structure.md) for details.

---


## Philosophy & Goals
- **Spec-first**: The OpenAPI document is the single source of truth for routes, types, and contracts.
- **Type-safe**: Request/response types and schemas are generated from the spec and used everywhere.
- **Separation of concerns**: Presentation (HTTP/Lambda), business logic, and infrastructure are clearly separated.
- **Repeatable pattern**: Adding a new endpoint is always spec → generate → implement handler.

---


## Tech Stack
- **Runtime**: Node.js on AWS Lambda (HTTP API / API Gateway v2 events)
- **Language**: TypeScript
- **Spec**: OpenAPI (YAML)
- **Codegen**: Built-in CLI (`spec2lambda generate`) for types, schemas, router config, and handler stubs
- **Local Dev**: Express-based dev server using the same handler interfaces as Lambda

---


## OpenAPI Spec & Code Generation
- **Spec location**: `api/openapi.yml`
- **operationId rules**:
  - Each operation **must** have a unique `operationId`.
  - `operationId` is used as the key for handler grouping and wiring.

### Codegen Overview
Running `spec2lambda generate` produces:
- `src/generated/openapi.types.ts` — TypeScript types for paths, request bodies, parameters, and responses.
- `src/generated/schemas.zod.ts` — Zod schemas for validation.
- `src/generated/routerConfig.ts` — Route config mapping operationId to method/path/regex.
- Grouped handler stubs in `src/handlers/` (e.g., all user operations in `users.ts`).

> **Important:**
> - Never manually edit files in `src/generated/`.
> - If types or routes are wrong, fix `api/openapi.yml` and re-run codegen.

---


## CLI Commands

See [`docs/commands.md`](./docs/commands.md) for full details.

- `spec2lambda init <project-name>` — Scaffold a new project and set the name. Sets up the directory structure, initial OpenAPI spec, and HTTP presentation layer (adapters for Lambda HTTP API Gateway responses).
- `spec2lambda generate [--config <path>]` — Parse the OpenAPI spec, generate types, schemas, router config, and grouped handler stubs. Use `--config` to override default settings.

---


## Typical Workflow
1. **Initialize the project**
  - Run: `spec2lambda init <project-name>`
  - Sets up the directory structure, initial OpenAPI spec, and HTTP adapters.
2. **Edit the OpenAPI spec**
  - Edit `api/openapi.yml` to add or update endpoints.
  - Set a unique `operationId` for each operation.
3. **Generate code**
  - Run: `spec2lambda generate [--config <path>]`
  - Updates all generated types, schemas, router config, and handler stubs (grouped by resource, e.g., `users.ts`).
4. **Implement business logic**
  - Fill in handler stubs in `src/handlers/`.
  - Use adapters and responses from `src/presentation/`.
5. **Test and iterate**
  - Add or update tests in `tests/`.
  - Use the local dev server for manual testing.

---


## Architecture Overview

See [`docs/project-structure.md`](./docs/project-structure.md) for directory roles and regeneration safety.

### Presentation Layer (`src/presentation/`)
- Adapts AWS Lambda events and local dev server requests to a common abstraction.
- Converts internal responses to Lambda/Express responses.
- Provides adapters and helpers for consistent HTTP output.

### Domain Layer (`src/domain/`)
- Core business logic and use cases.
- Pure functions where possible.
- No direct knowledge of HTTP, Lambda, or AWS-specific APIs.

### (Optional) Infra Layer (`src/infra/`)
- Implementation of repositories and clients (e.g., DynamoDB, S3, external APIs).
- Configuration loading and service wiring.

---


## Local Development
- Entry point: `local-dev/dev-server.ts`.
- Uses the generated router config and grouped handlers.
- Uses the same handler functions as Lambda.
- Typical workflow:
  - Run `spec2lambda generate` after editing the spec.
  - Start the dev server (see future CLI support).
  - Hit `http://localhost:<PORT>/<your-path>` using a tool like Postman or curl.

---


## Testing
- Place tests under `tests/`.
- Suggested patterns:
  - **Unit tests** for domain logic (`src/domain/`).
  - **Integration tests** for handlers:
    - Invoke handlers directly with fake events, or
    - Use the dev server and make HTTP calls.
- Keep tests decoupled from actual AWS services by using mocks or local test doubles.

---


## Guidelines for Coding Agents
> This section is for tools like ChatGPT, Copilot, Cody, etc.

1. **Do not edit generated files**
  - Never modify anything under `src/generated/` directly.
  - Instead, change the OpenAPI spec (`api/openapi.yml`) and run `spec2lambda generate`.
2. **Follow the layering rules**
  - HTTP/Lambda-specific logic: `src/presentation/`
  - Business logic: `src/domain/`
  - (Optional) AWS SDK/external system calls: `src/infra/`
3. **When adding endpoints**
  - Always update the OpenAPI spec first.
  - Use `operationId` as the source of truth for handler grouping and mapping.
  - Handlers are grouped by resource (e.g., all user operations in `users.ts`).
4. **Type usage**
  - Prefer using generated request/response types over custom ones.
  - If types are missing or incorrect, update the spec and re-run codegen.
5. **Safe places to refactor**
  - `src/handlers/`, `src/domain/`, `tests/`.
6. **Avoid breaking changes**
  - Do not change public handler signatures or contract types without updating the OpenAPI spec and related tests.

---


## License
MIT – see `LICENSE` for details.
