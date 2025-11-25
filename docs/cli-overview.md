# CLI Overview
The `spec2lambda` CLI is the entry point for building, evolving, and maintaining spec-driven AWS Lambda APIs. It unifies code generation, local development, and project scaffolding into a single, repeatable workflow.

## CLI Stub Implementation (v1)

The CLI currently supports the following commands as stubs:

- `init <project-name>`: Prints a placeholder message for project initialization.
- `generate`: Prints a placeholder message for code generation.
- `--help`/`-h`: Shows usage information.

These commands do not yet perform real work, but provide a foundation for future development. Use `npm run cli -- <command>` for local development.

## Philosophy: Template + Generator
- **Template**: Provides a ready-to-extend TypeScript service structure, with clear boundaries between user code and generated artifacts.
- **Generator**: Automates the creation of types, validators, and router configs from your OpenAPI spec, ensuring your code stays in sync with your API contract.

## Lifecycle Overview
1. **init**: Scaffold a new project structure and initial OpenAPI spec.
2. **edit spec**: Evolve your API by editing `api/openapi.yml`.
3. **generate**: Generate types, validators, and router config from the spec. All generated files are always safe to overwrite.
4. **develop/iterate**: Implement handlers, run the local dev server, and test your API.

## Regeneration Safety
- All files in `src/generated/` and the router config are always overwritten by codegen. Never edit these directly.
- Handler stubs are (re)generated as needed in grouped files (e.g., `src/handlers/users.ts`), but user-implemented logic in existing handler functions is preserved.
- The `init` command also sets up the HTTP presentation layer, including adapters required for Lambda HTTP API Gateway responses, so you can focus on business logic.
- User code (handlers, adapters, presentation logic) lives outside generated folders and is never touched by codegen, except for safe handler stubbing.

## Next Steps
- See [commands.md](./commands.md) for CLI usage.
- See [project-structure.md](./project-structure.md) for directory and ownership details.
