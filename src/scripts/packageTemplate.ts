import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";
import { logger } from '../presentation/logger.js';
export interface ManifestEntry {
  /** Output path for the copied file */
  path: string;
  /** Source file to copy from (relative to project root) */
  source: string;
}

export type Manifest = ManifestEntry[];

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


export interface PackageTemplateDeps {
  fs: typeof fs;
  path: typeof path;
  logger?: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void; debug?: (...args: unknown[]) => void };
}

/**
 * Copies starter files from the manifest to dist/starter-template
 */
export function copyStarterTemplate(
  manifest: Manifest = defaultManifest,
  deps: PackageTemplateDeps = {
    fs,
    path,
    logger: logger,
  }
) {
  const { fs, path, logger } = deps;
  const projectRoot = path.dirname(fileURLToPath(import.meta.url));
  const destRoot = path.resolve(projectRoot, "../../dist/starter-template");

  logger?.info?.("[packageTemplate] Starting copy of starter files to dist/starter-template...");

  if (!fs.existsSync(destRoot)) {
    fs.mkdirSync(destRoot, { recursive: true });
    logger?.debug?.(`[packageTemplate] Created destination root: ${destRoot}`);
  } else {
    logger?.debug?.(`[packageTemplate] Destination root already exists: ${destRoot}`);
  }

  for (const entry of manifest) {
    const destPath = path.resolve(destRoot, entry.path);
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      logger?.debug?.(`[packageTemplate] Created directory: ${destDir}`);
    }
    const sourcePath = path.resolve(projectRoot, "../../", entry.source);
    if (!fs.existsSync(sourcePath)) {
      logger?.error?.(`[packageTemplate] Source file does not exist: ${sourcePath}`);
      throw new Error(`Source file does not exist: ${sourcePath}`);
    }
    fs.copyFileSync(sourcePath, destPath);
    logger?.info?.(`[packageTemplate] Copied: ${entry.source} -> ${entry.path}`);
    logger?.debug?.(`[packageTemplate] Full copy: ${sourcePath} -> ${destPath}`);
  }
  logger?.info?.(`[packageTemplate] Starter template successfully copied to dist/starter-template`);
}



// ESM-compatible main check for direct execution

if (typeof process !== 'undefined' && process.argv[1]) {
  const scriptPath = path.resolve(process.argv[1]);
  const thisModulePath = path.resolve(fileURLToPath(import.meta.url));
  if (scriptPath === thisModulePath) {
    copyStarterTemplate();
  }
}
