# CLI Command Reference

This document details the available `spec2lambda` CLI commands, their usage, and expected behavior.

## init
Scaffold a new project structure and set the project name.

```
spec2lambda init <project-name>
```
- Sets up the directory structure, initial OpenAPI spec, and updates project files to use the provided name.
- Intended as the first step when starting a new service.

## generate
Parse the OpenAPI spec, generate types, schemas, routes, and grouped handler stubs.

```
spec2lambda generate [--config <path>]
```
- `--config <path>`: (optional) Path to a spec2lambda config file. Use this to override default settings (such as custom output directories, handler grouping, or codegen options).
- Reads `api/openapi.yml` by default unless overridden by config.
- Overwrites all files in `src/generated/` and router config.
- Groups handler stubs by resource (e.g., all user operations in `src/handlers/users.ts`).
- Ensures all operationIds are stubbed and wired into the framework.
- Never modifies user-implemented logic in existing handler functions.
