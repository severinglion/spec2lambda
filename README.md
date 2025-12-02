# [spec2lambda](https://www.npmjs.com/package/spec2lambda)

[![npm version](https://img.shields.io/npm/v/spec2lambda)](https://www.npmjs.com/package/spec2lambda)
[![npm downloads](https://img.shields.io/npm/dm/spec2lambda)](https://www.npmjs.com/package/spec2lambda)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/severinglion/spec2lambda)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


**spec2lambda** is an opinionated, spec-driven code generation tool for building scalable AWS Lambda APIs in TypeScript. It enforces a clear project structure and automates type-safe handler scaffolding, all powered by your OpenAPI spec.

---

## Features
- **Spec-first**: The OpenAPI document is the single source of truth for routes, types, and contracts.
- **Type-safe**: Request/response types and schemas are generated from the spec and used everywhere.
- **Separation of concerns**: Presentation (HTTP/Lambda), business logic, and infrastructure are clearly separated.
- **Repeatable pattern**: Adding a new endpoint is always spec → generate → implement handler.

---

## Project Structure
See [`docs/project-structure.md`](./docs/project-structure.md) for a full breakdown.

- `api/` — Your OpenAPI spec (`openapi.yml`).
- `src/generated/` — All code generated from the spec (types, schemas, router config). **Generated. Always overwritten. Never edit directly.**
- `src/handlers/` — Grouped Lambda handler implementations (e.g., `users.ts` for all user operations).
- `src/presentation/` — Adapters, response helpers, and HTTP presentation logic.
- `tests/` — Unit and integration tests.
- `local-dev/` — Local development server setup and entrypoint.

---

## Getting Started

### 1. Initialize a New Project

```sh
npx spec2lambda init <project-name>
```

This scaffolds a new project with the opinionated structure, a starter OpenAPI spec, and all required scripts. The generated `package.json` includes a `generate` script for codegen.

### 2. Edit Your OpenAPI Spec

Edit `api/openapi.yml` to define or update endpoints. Each operation **must** have a unique `operationId`.

### 3. Generate Code

```sh
cd <project-name>
npm run generate
```

This runs `spec2lambda generate` under the hood, updating all generated types, schemas, router config, and handler stubs (grouped by resource, e.g., `users.ts`).

### 4. Implement Handlers

Fill in handler stubs in `src/handlers/`. Use adapters and responses from `src/presentation/`.

### 5. Test and Iterate

Add or update tests in `tests/`. Use the local dev server for manual testing.

---

## CLI Command Reference

All commands are available via `npx spec2lambda ...` or, in generated projects, via npm scripts.

### `init`

Scaffold a new Lambda service project in a new folder.

**Usage:**

```sh
npx spec2lambda init <project-name>
```

**Behavior:**
- Creates a new directory named `<project-name>`.
- Copies the opinionated starter structure and template files into the new directory.
- Generates a `package.json` with the project name, a `generate` script, and `spec2lambda` as a dev dependency.
- Fails if the target directory already exists.

### `generate`

Run codegen based on the OpenAPI spec. In generated projects, use:

```sh
npm run generate
```

**Behavior:**
- Parses the OpenAPI spec and generates types, schemas, routes, and handler stubs.
- Overwrites all files in `src/generated/` and updates handler stubs as needed.

### `help`

Show usage information for the CLI.

**Usage:**

```sh
npx spec2lambda --help
npx spec2lambda -h
```

### `version`

Show the current version of the CLI.

**Usage:**

```sh
npx spec2lambda --version
npx spec2lambda -v
```

---

## Typical Workflow
1. **Initialize the project**
   - Run: `npx spec2lambda init <project-name>`
2. **Edit the OpenAPI spec**
   - Edit `api/openapi.yml` to add or update endpoints.
   - Set a unique `operationId` for each operation.
3. **Generate code**
   - Run: `npm run generate`
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
  - Run `npm run generate` after editing the spec.
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
   - Instead, change the OpenAPI spec (`api/openapi.yml`) and run `npm run generate`.
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
