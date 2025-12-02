import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { Manifest } from "./packageTemplate.js";
export type { Manifest };
// Manifest-driven project initializer for Lambda function scaffolding
// All dependencies are injected for testability


// ...existing code...

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

  // Always resolve dist/starter-template relative to the actual package location
  const starterTemplateRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../dist/starter-template");
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
    const sourcePath = resolve(starterTemplateRoot, entry.path);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Starter template file does not exist: ${sourcePath}`);
    }
    const content = fs.readFileSync(sourcePath);
    fs.writeFileSync(outPath, content);
    created.push(outPath);
    logger?.info?.(`Created: ${outPath}`);
  }
  return created;
}
