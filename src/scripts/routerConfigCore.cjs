const yaml = require("yaml");
const pathToRegexpModule = require("path-to-regexp");
const pathToRegexp =
  typeof pathToRegexpModule === "function"
    ? pathToRegexpModule
    : pathToRegexpModule.pathToRegexp;
if (!pathToRegexp) {
  throw new Error(
    "Could not resolve pathToRegexp from 'path-to-regexp' module. Check your installed version."
  );
}

// Parse OpenAPI YAML file to JS object
function parseSpec(filePath, readFileSync) {
  let raw;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch (e) {
    throw e;
  }
  let spec;
  try {
    spec = yaml.parse(raw);
  } catch (e) {
    throw new Error("Invalid YAML: " + e.message);
  }
  if (!spec.paths) throw new Error("OpenAPI spec missing paths");
  return spec;
}

// Flatten OpenAPI JS object to RouteConfig[]
function flattenRoutes(openApi) {
  if (!openApi || !openApi.paths || typeof openApi.paths !== "object") {
    throw new Error("Malformed OpenAPI spec: missing paths");
  }
  const routes = [];
  for (const [rawPath, methods] of Object.entries(openApi.paths)) {
    for (const [method, op] of Object.entries(methods || {})) {
      if (!op || !op.operationId) continue;
      // Convert /foo/{bar} to /foo/:bar for path-to-regexp
      const expressPath = rawPath.replace(/{/g, ":").replace(/}/g, "");
      // Generate regex for Lambda event path
      let result = pathToRegexp(expressPath, [], { end: true });
      let regex;
      if (result instanceof RegExp) {
        regex = result;
      } else if (result && result.regexp instanceof RegExp) {
        regex = result.regexp;
      } else {
        throw new Error("pathToRegexp did not return a RegExp");
      }
      routes.push({
        method: method.toUpperCase(),
        rawPath,
        pathRegex: regex,
        operationId: op.operationId,
      });
    }
  }
  if (!routes.length) throw new Error("No valid routes found in OpenAPI spec");
  return routes;
}

// Save RouteConfig[] to a TypeScript file
function saveRouteConfig(outputPath, routes, writeFileSync) {
  const fileContents = `// AUTO-GENERATED
export interface RouteConfig {\n  method: string;\n  rawPath: string;\n  pathRegex: RegExp;\n  operationId: string;\n}\n\nexport const routes: RouteConfig[] = [\n${routes
    .map(
      (r) =>
        `  { method: \"${r.method}\", rawPath: \"${
          r.rawPath
        }\", pathRegex: ${r.pathRegex.toString()}, operationId: \"${
          r.operationId
        }\" }`
    )
    .join(",\n")}\n];\n`;
  writeFileSync(outputPath, fileContents);
}

// Run the full pipeline
function run(inputPath, outputPath, { readFileSync, writeFileSync }) {
  const spec = parseSpec(inputPath, readFileSync);
  const routes = flattenRoutes(spec);
  saveRouteConfig(outputPath, routes, writeFileSync);
}

module.exports = { parseSpec, flattenRoutes, saveRouteConfig, run };
