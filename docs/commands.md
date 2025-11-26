
# CLI Command Reference

This document details the available `spec2lambda` CLI commands, their usage, and expected behavior.

## init / create-lambda-function

Scaffold a new Lambda service project in a new folder. This command is fully implemented.

**Usage:**

```sh
spec2lambda init <project-name>
spec2lambda create-lambda-function <project-name>
```

**Behavior:**
- Creates a new directory named `<project-name>`.
- Copies the opinionated starter structure and template files into the new directory.
- Generates a `package.json` with the project name, a codegen script, and `spec2lambda` as a dev dependency.
- Fails if the target directory already exists.

## generate

Run codegen based on the OpenAPI spec. *(Currently stubbed, not implemented)*

**Usage:**

```sh
spec2lambda generate --config spec2lambda.config.mts
```

**Behavior:**
- Intended to parse the OpenAPI spec and generate types, schemas, routes, and handler stubs.
- Currently prints a placeholder message and does not perform real work.

## help

Show usage information for the CLI.

**Usage:**

```sh
spec2lambda --help
spec2lambda -h
```
