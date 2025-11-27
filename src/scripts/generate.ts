// Baseline generate command handler for spec2lambda
import path from "path";

export interface GenerateOptions {
  verbose?: boolean;
  args?: string[];
  dryRun?: boolean;
  configPath?: string;
}

// Dependency injection for testability
export interface GenerateDeps {
  fs: any;
  logger: any;
  yaml: any;
  processRunner: any; // (cmd, args, opts) => Promise<{ stdout, stderr, code }>
  diff: any; // (oldStr, newStr) => string
}

export async function generate(
  { fs, logger, yaml, processRunner, diff }: GenerateDeps,
  options: GenerateOptions = {}
) {
  logger.info("[spec2lambda] Starting code generation...");

  // Step 1: Load config and OpenAPI spec
  const { config, openapi, handlerDir } = await loadConfigAndSpec({ fs, logger, yaml }, options);

  // Step 2: Generate router config (placeholder)
  const routerConfig = await generateRouterConfig({ fs, logger }, openapi, config);

  // Step 3: Generate Zod schemas and types (via script)
  const zodResult = await generateZodAndTypes({ logger, processRunner }, options);

  // Step 4: Write generated files (or dry-run)
  await writeGeneratedFiles({ fs, logger, diff }, {
    routerConfig,
    zodResult,
    handlerDir,
    dryRun: !!options.dryRun,
  });

  if (options.verbose) {
    logger.info(
      `[spec2lambda] Verbose mode enabled.\n  - Args: ${JSON.stringify(options.args)}\n  - Dry run: ${!!options.dryRun}`
    );
  }

  logger.info("[spec2lambda] Code generation complete.");
}

// --- Step 1: Load config and OpenAPI spec ---
type LoadConfigAndSpecDeps = {
  fs: {
    existsSync: (path: string) => boolean | Promise<boolean>;
    readFileSync: (path: string, encoding: string) => string | Promise<string>;
  };
  logger: { info: (msg: string) => void; warn: (msg: string) => void };
  yaml: { load: (str: string) => any };
};

async function loadConfigAndSpec(
  { fs, logger, yaml }: LoadConfigAndSpecDeps,
  options: GenerateOptions
): Promise<{ config: Record<string, any>; openapi: Record<string, any>; handlerDir: string }> {
  // Autodetect config file (spec2lambda.config.yaml|yml|json)
  const configCandidates = [
    options.configPath,
    "spec2lambda.config.yaml",
    "spec2lambda.config.yml",
    "spec2lambda.config.json",
  ].filter(Boolean) as string[];
  let config: Record<string, any> = {};
  let configPath: string | null = null;
  for (const candidate of configCandidates) {
    if (candidate && (await fs.existsSync(candidate))) {
      configPath = candidate;
      if (candidate.endsWith(".json")) {
        config = JSON.parse(await fs.readFileSync(candidate, "utf8"));
      } else {
        config = yaml.load(await fs.readFileSync(candidate, "utf8"));
      }
      logger.info(`[spec2lambda] Loaded config: ${candidate}`);
      break;
    }
  }
  if (!configPath) {
    logger.info("[spec2lambda] No config file found, using defaults.");
  }

  // Autodetect OpenAPI spec (openapi.yaml|yml|json in api/)
  const openapiCandidates = [
    "api/openapi.yaml",
    "api/openapi.yml",
    "api/openapi.json",
  ];
  let openapi: Record<string, any> = {};
  let openapiPath: string | null = null;
  for (const candidate of openapiCandidates) {
    if (candidate && (await fs.existsSync(candidate))) {
      openapiPath = candidate;
      if (candidate.endsWith(".json")) {
        openapi = JSON.parse(await fs.readFileSync(candidate, "utf8"));
      } else {
        openapi = yaml.load(await fs.readFileSync(candidate, "utf8"));
      }
      logger.info(`[spec2lambda] Loaded OpenAPI spec: ${candidate}`);
      break;
    }
  }
  if (!openapiPath) {
    logger.warn("[spec2lambda] No OpenAPI spec found. Generation may fail.");
  }

  // Handler output directory
  const handlerDir = typeof config === 'object' && config !== null && 'handlersDir' in config && typeof config.handlersDir === 'string'
    ? config.handlersDir
    : "src/handlers";
  return { config, openapi, handlerDir };
}

// --- Step 2: Generate router config ---
type GenerateRouterConfigDeps = {
  fs: any;
  logger: { info: (msg: string) => void };
};
async function generateRouterConfig(
  { fs, logger }: GenerateRouterConfigDeps,
  openapi: Record<string, any>,
  config: Record<string, any>
): Promise<Record<string, any>> {
  // Placeholder: In real impl, generate router config from openapi
  logger.info("[spec2lambda] Generating router config (placeholder)");
  return { generated: true, openapi, config };
}

// --- Step 3: Generate Zod schemas and types ---
type GenerateZodAndTypesDeps = {
  logger: { info: (msg: string) => void; warn: (msg: string) => void; error: (msg: string) => void };
  processRunner: (cmd: string, args: string[], opts: any) => Promise<{ stdout: string; stderr: string; code: number }>;
};
async function generateZodAndTypes(
  { logger, processRunner }: GenerateZodAndTypesDeps,
  options: GenerateOptions
): Promise<{ stdout: string; stderr: string; code: number }> {
  // Use the correct script name from package.json
  logger.info("[spec2lambda] Running Zod/type generation script");
  const script = "codegen:zod";
  // Use npm.cmd on Windows for compatibility
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  try {
    const result = await processRunner(npmCmd, ["run", script], { stdio: "pipe" });
    logger.info(`[spec2lambda] Script output:\n${result.stdout}`);
    if (result.stderr) logger.warn(`[spec2lambda] Script errors:\n${result.stderr}`);
    return result;
  } catch (err: any) {
    logger.error(`[spec2lambda] Script failed: ${err}`);
    throw err;
  }
}

// --- Step 4: Write generated files (or dry-run) ---
type WriteGeneratedFilesDeps = {
  fs: {
    existsSync: (path: string) => boolean | Promise<boolean>;
    readFileSync: (path: string, encoding: string) => string | Promise<string>;
    writeFileSync: (path: string, content: string, encoding: string) => void | Promise<void>;
    mkdirSync: (path: string, opts: { recursive?: boolean }) => void | Promise<void>;
  };
  logger: { info: (msg: string) => void; warn: (msg: string) => void };
  diff: (oldStr: string, newStr: string) => string;
};
type WriteGeneratedFilesOptions = {
  routerConfig: Record<string, any>;
  zodResult: { stdout: string; stderr: string; code: number };
  handlerDir: string;
  dryRun: boolean;
};
export async function writeGeneratedFiles(
  { fs, logger, diff }: WriteGeneratedFilesDeps,
  { routerConfig, zodResult, handlerDir, dryRun }: WriteGeneratedFilesOptions
) {
  // 1. Write router config file to src/generated
  const generatedDir = path.join("src", "generated");
  const routerConfigPath = path.join(generatedDir, "routerConfig.generated.json");
  const newContent = JSON.stringify(routerConfig, null, 2);
  let oldContent = "";
  if (await fs.existsSync(routerConfigPath)) {
    oldContent = await fs.readFileSync(routerConfigPath, "utf8");
  }
  if (dryRun) {
    logger.info(`[spec2lambda] [dry-run] Would write: ${routerConfigPath}`);
    const summary = diff(oldContent, newContent);
    logger.info(`[spec2lambda] [dry-run] Diff summary:\n${summary}`);
  } else {
    // Ensure generatedDir exists
    if (!(await fs.existsSync(generatedDir))) {
      await fs.mkdirSync(generatedDir, { recursive: true });
    }
    await fs.writeFileSync(routerConfigPath, newContent, "utf8");
    logger.info(`[spec2lambda] Wrote: ${routerConfigPath}`);
  }

  // 2. Generate grouped handler files and stubs
  // For this, we need to scan the OpenAPI spec for operationIds and tags
  // We'll assume routerConfig.openapi is the OpenAPI spec
  const openapi = routerConfig.openapi;
  if (!openapi || !openapi.paths) {
    logger.warn('[spec2lambda] No OpenAPI paths found, skipping handler stub generation.');
    return;
  }

  // Group operations by API path: /users -> users.ts, /users/{id}/licenses -> userLicenses.ts, fallback to 'default'
  const groupMap: Record<string, Array<{ operationId: string; method: string; path: string }>> = {};
  for (const pathKey of Object.keys(openapi.paths)) {
    const pathObj = openapi.paths[pathKey];
    for (const method of Object.keys(pathObj)) {
      const op = pathObj[method];
      if (!op || typeof op !== 'object') continue;
      const operationId = op.operationId || `${method}_${pathKey.replace(/[\/{}/]/g, '_')}`;
      // Grouping logic:
      // - /users -> users
      // - /users/{id}/licenses -> userLicenses
      // - /users/{id}/licenses/{lid} -> userLicenses
      // - / -> default
      let group = 'default';
      const segments = pathKey.split('/').filter(Boolean).map(s => s.replace(/\{.*?\}/g, ''));
      if (segments.length === 1) {
        group = segments[0] || 'default';
      } else if (segments.length > 1) {
        // Only use non-empty segments, join first and second (if present) for compound
        group = segments.slice(0, 2).map(s => s.charAt(0).toLowerCase() + s.slice(1)).join('');
      }
      if (!groupMap[group]) groupMap[group] = [];
      groupMap[group].push({ operationId, method, path: pathKey });
    }
  }

  // For each group, ensure a handler file exists and all stubs are present
  for (const tag of Object.keys(groupMap)) {
    const fileName = `${tag.replace(/[^a-zA-Z0-9_]/g, '_')}.ts`;
    const filePath = path.join(handlerDir, fileName);
    let fileContent = '';
    let exists = await fs.existsSync(filePath);
    if (exists) {
      fileContent = await fs.readFileSync(filePath, "utf8");
    }
    let newFileContent = fileContent;
    let addedAny = false;
    // Ensure import for Handler type at the top
    const importLine = `import type { Handler } from './HandlerTypes';\n`;
    if (!fileContent.startsWith(importLine)) {
      newFileContent = importLine + (newFileContent.startsWith('\n') ? newFileContent.slice(1) : newFileContent);
      addedAny = true;
    }
    for (const op of groupMap[tag]) {
      const stubName = op.operationId;
      // Handler type: (event: APIGatewayProxyEventV2) => Promise<HttpResponse<unknown>>
      const stubSignature = `export const ${stubName}: Handler = async (event) => {\n  // TODO: implement\n  return { statusCode: 501, body: 'Not implemented' };\n};\n`;
      const regex = new RegExp(`export\\s+const\\s+${stubName}\\s*:\\s*Handler`);
      if (!regex.test(fileContent)) {
        newFileContent += (newFileContent && !newFileContent.endsWith('\n') ? '\n' : '') + stubSignature;
        addedAny = true;
        logger.info(`[spec2lambda] ${exists ? '[update]' : '[create]'} Handler stub for '${stubName}' in ${filePath}`);
      }
    }
    if (addedAny) {
      if (dryRun) {
        logger.info(`[spec2lambda] [dry-run] Would write: ${filePath}`);
        const summary = diff(fileContent, newFileContent);
        logger.info(`[spec2lambda] [dry-run] Diff summary:\n${summary}`);
      } else {
        await fs.writeFileSync(filePath, newFileContent, "utf8");
        logger.info(`[spec2lambda] Wrote: ${filePath}`);
      }
    }
  }
}
