import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
// Manifest-driven project initializer for Lambda function scaffolding
// All dependencies are injected for testability


export interface ManifestEntry {
  /** Output path for the copied file */
  path: string;
  /** Source file to copy from (relative to project root) */
  source: string;
}

export type Manifest = ManifestEntry[];

export interface InitProjectDeps {
  fs: {
    existsSync: (path: string) => boolean;
    mkdirSync: (path: string, opts?: { recursive?: boolean }) => void;
    readFileSync: (path: string) => string;
    writeFileSync: (path: string, content: string) => void;
  };
  logger?: { info: (msg: string) => void; error: (msg: string) => void };
}

export function initProject(
  manifest: Manifest,
  deps: InitProjectDeps,
  rootFolder: string
): string[] {
  const { fs, logger } = deps;
  if (!rootFolder) throw new Error("A root folder name must be provided.");
  if (fs.existsSync(rootFolder)) {
    throw new Error(`Folder already exists: ${rootFolder}`);
  }
  fs.mkdirSync(rootFolder, { recursive: true });
  const created: string[] = [];
  const projectRoot = dirname(fileURLToPath(import.meta.url));
  // Generate package.json
  const pkg = {
    name: rootFolder,
    version: "1.0.0",
    private: true,
    scripts: {
      codegen: "spec2lambda generate --config spec2lambda.config.mts"
    },
    type: "module",
    devDependencies: {
      spec2lambda: "latest"
    }
  };
  const pkgPath = `${rootFolder}/package.json`;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  created.push(pkgPath);
  logger?.info?.(`Created: ${pkgPath}`);

  for (const entry of manifest) {
    const outPath = `${rootFolder}/${entry.path}`.replace(/\\/g, "/");
    if (fs.existsSync(outPath)) {
      throw new Error(`File already exists: ${outPath}`);
    }
  }
  for (const entry of manifest) {
    const outPath = `${rootFolder}/${entry.path}`.replace(/\\/g, "/");
    const dir = outPath.replace(/\/[^/]+$/, "");
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const sourcePath = resolve(projectRoot, "../../", entry.source);
    const content = fs.readFileSync(sourcePath);
    fs.writeFileSync(outPath, content);
    created.push(outPath);
    logger?.info?.(`Created: ${outPath}`);
  }
  return created;
}

// Default manifest (opinionated structure, editable in code)
export const defaultManifest: Manifest = [
  {
    path: "src/handlers/HttpRouter.ts",
    source: "src/handlers/HttpRouter.ts",
  },
  {
    path: "src/handlers/HandlerTypes.ts",
    source: "src/handlers/HandlerTypes.ts",
  },
  {
    path: "src/handlers/index.ts",
    source: "src/handlers/index.ts",
  },
  {
    path: "api/openapi.yml",
    source: "api/openapi.yml",
  },
  {
    path: "src/presentation/http/Responses.ts",
    source: "src/presentation/Responses.ts",
  },
  {
    path: "src/presentation/http/HttpTypes.ts",
    source: "src/presentation/HttpTypes.ts",
  },
  {
    path: "src/presentation/http/adapters.ts",
    source: "src/presentation/adapters.ts",
  },
  {
    path: "tsconfig.json",
    source: "tsconfig.json",
  },
  {
    path: ".gitignore",
    source: ".gitignore",
  },
];
