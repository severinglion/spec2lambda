#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require("fs");
const path = require("path");
const { run } = require("./routerConfigCore.cjs");

const specPath = path.join(__dirname, "..", "..", "docs", "openapi.yml");
const outPath = path.join(__dirname, "..", "generated", "routerConfig.ts");

fs.mkdirSync(path.dirname(outPath), { recursive: true });
run(specPath, outPath, {
  readFileSync: fs.readFileSync,
  writeFileSync: fs.writeFileSync,
});

console.log("✅ Generated src/generated/routerConfig.ts from OpenAPI spec");
