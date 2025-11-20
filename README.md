# spec2lambda
A TypeScript template for building spec-driven AWS Lambda APIs using OpenAPI, code generation, modular handlers, and a local dev server.

## File Structure
- `docs/`: Documentation files.
- `src/`: Source code for the Lambda functions and API handlers.
  - `scripts/`: Utility scripts for code generation and deployment.
  - `handlers/`: Modular Lambda function handlers.
  - `presentation/`: API request/response abstractions and adapters (Lambda, dev server).
  - `domain/`: Business logic and core functionality.
  - `infra/`: Infrastructure-related code (e.g., AWS SDK interactions).
  - `generated/`: Auto-generated code from OpenAPI specs. **Do not edit manually.**
- `tests/`: Unit and integration tests.
- `local-dev/`: Local development server setup and entrypoint.

---

## Goals

- **Spec-first**: The OpenAPI document is the single source of truth for routes, DTOs, and contracts.
- **Type-safe**: Request/response types are generated from the spec and used everywhere.
- **Separation of concerns**:
  - `presentation` = HTTP/Lambda/dev-server concerns
  - `domain` = business rules
  - `infra` = external systems (DBs, queues, APIs)
- **Repeatable pattern**: Adding a new endpoint should follow the same predictable steps.

---

## Tech Stack

- **Runtime**: Node.js on AWS Lambda (HTTP API / API Gateway v2 events)
- **Language**: TypeScript
- **Spec**: OpenAPI (YAML)
- **Codegen**:
  - `openapi-typescript` (or similar) for DTOs
  - Custom scripts in `src/scripts/` for route config / helper generation
- **Local Dev**: Express/Fastify-based dev server that uses the same handler interfaces as Lambda

---

## OpenAPI Spec & Code Generation

- **Spec location**: `docs/openapi.yml` 
- **operationId rules**:
  - Each operation **must** have a unique `operationId`.
  - `operationId` is used as the key for:
    - handler file naming
    - handler registry mapping
    - route config entries

### Codegen Overview

Code generation produces:

- `src/generated/types.ts`  
  TypeScript types for paths, request bodies, parameters, and responses.
- `src/generated/routes.ts`  
  A route config mapping `operationId → { method, path, pathMatcher, extractParams }`.
- (Optionally) handler stubs under `src/handlers/` for any operations that don’t have implementations yet.

> **Important (for humans & coding agents):**  
> - Never manually edit files in `src/generated/`.  
> - If types or routes are wrong, fix `openapi/api.yaml` and re-run codegen.

---

## Scripts & Commands

> These names are suggestions; keep them in sync with `package.json`.

- `npm run codegen`  
  Runs all code generation scripts (DTOs, routes, etc.).
- `npm run codegen:types`  
  Generates TypeScript types from the OpenAPI spec.
- `npm run codegen:zod`  
  Generates Zod schemas from the OpenAPI spec.
- `npm run codegen:routes`  
  Generates the route configuration from `operationId` and paths.
- `npm run dev`  
  Starts the local dev server (Express/Fastify) using generated routes and handlers.
- `npm test`  
  Runs unit and integration tests.
- `npm run build`  
  Compiles TypeScript to JavaScript for deployment.

---

## Adding a New Endpoint (Happy Path)

> This is the most important workflow for coding agents.

1. **Update the OpenAPI spec**
   - Edit `openapi/api.yaml`.
   - Add a new path + method.
   - Set a unique `operationId` (e.g., `createUser`, `listParticipants`).
   - Define parameters, request body schema, and response schemas.

2. **Regenerate code**
   - Run: `npm run codegen`
   - This updates:
     - `src/generated/types.ts`
     - `src/generated/routes.ts`
     - (Optionally) handler stubs, if configured

3. **Implement the handler**
   - Create or edit `src/handlers/<operationId>.ts`.
   - Import the generated request/response types.
   - Implement the handler using the domain/services layer.
   - Export the handler and register it in `src/handlers/index.ts` if needed.

4. **Wire up domain & infra**
   - Add or update services in `src/domain/` (pure business logic).
   - Add or update infrastructure in `src/infra/` (e.g., DynamoDB repositories).

5. **Test locally**
   - Run `npm run dev`.
   - Call the endpoint using the route defined in the OpenAPI spec.
   - Add tests in `tests/` as needed.

---

## Architecture Overview

### Presentation Layer (`src/presentation/`)

Responsibilities:

- Adapting **AWS Lambda events** to the internal `HttpRequest` abstraction.
- Adapting **local dev server requests** to the same abstraction.
- Converting `HttpResponse` objects back to:
  - Lambda `APIGatewayProxyResultV2`
  - Express/Fastify responses
- Mapping errors to consistent HTTP responses.

### Domain Layer (`src/domain/`)

Responsibilities:

- Core business logic and use cases.
- Pure-ish functions where possible.
- No direct knowledge of HTTP, Lambda, or AWS-specific APIs.
- Consumes interfaces from `infra/` (e.g., repositories, gateway interfaces).

### Infra Layer (`src/infra/`)

Responsibilities:

- Implementation of repositories and clients (DynamoDB, RDS, S3, external APIs, etc.).
- Configuration loading (env vars).
- Wiring services together (optionally via simple factories or DI).

---

## Local Development

- Entry point: `local-dev/dev-server.ts` (or similar).
- Uses the generated `routeConfig` to register routes.
- Uses the same handler functions as Lambda.
- Ideal workflow:
  - Run `npm run codegen`.
  - Run `npm run dev`.
  - Hit `http://localhost:<PORT>/<your-path>` using a tool like Postman or curl.

---

## Testing

- Place tests under `tests/`.
- Suggested patterns:
  - **Unit tests** for domain logic (`src/domain/`).
  - **Integration tests** for handlers:
    - Invoke handlers directly with fake `HttpRequest` objects, or
    - Use the dev server and make HTTP calls.
- Keep tests decoupled from actual AWS services by using:
  - Mocks for infra repositories.
  - Local test doubles for external APIs.

---

## Guidelines for Coding Agents

> This section is explicitly for tools like ChatGPT, Copilot, Cody, etc.

When modifying this repo:

1. **Do not edit generated files**
   - Never modify anything under `src/generated/` directly.
   - Instead, change the OpenAPI spec (`openapi/api.yaml`) and run `npm run codegen`.

2. **Follow the layering rules**
   - HTTP/Lambda-specific logic belongs in `src/presentation/`.
   - Business logic belongs in `src/domain/`.
   - AWS SDK and external system calls belong in `src/infra/`.

3. **When adding endpoints**
   - Always add/modify the OpenAPI spec first.
   - Use `operationId` as the source of truth for handler names and mapping keys.
   - Keep handler filenames and exports aligned with `operationId`.

4. **Type usage**
   - Prefer using generated request/response types over custom ones.
   - If types are missing or incorrect:
     - Update the spec.
     - Re-run codegen.
     - Then refactor call sites to use the correct types.

5. **Safe places to refactor**
   - `src/handlers/`: handler composition, mapping to domain services.
   - `src/domain/`: pure business logic refactors.
   - `src/infra/`: implementation details of repositories/clients.
   - `tests/`: adding or updating tests.

6. **Avoid breaking changes**
   - Do not change public handler signatures or contract types without updating:
     - The OpenAPI spec.
     - Related clients/tests.

---

## License

MIT – see `LICENSE` for details.
