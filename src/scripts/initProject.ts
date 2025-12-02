import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { Manifest } from "./packageTemplate.js";
export type { Manifest };

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
      codegen: "spec2lambda generate",
      "codegen:types": "openapi-typescript ./api/openapi.yml -o ./src/generated/openapi.types.ts",
      "codegen:zod": "orval --config orval.config.cjs",
      "codegen:contracts": "npm run codegen:types && npm run codegen:zod"
    },
    type: "module",
    devDependencies: {
      spec2lambda: "latest",
      "openapi-typescript": "^7.10.1",
      "orval": "^7.17.0"
    }
  };
  const pkgPath = `${rootFolder}/package.json`;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  created.push(pkgPath);
  logger?.info?.(`Created: ${pkgPath}`);

  // Add .gitignore file from array of lines
  const gitignoreLines = [
    'node_modules/',
    'src/generated/',
    '.vscode/',
    '.env',
    '.env.local',
    '',
    '# OS-specific files',
    '.DS_Store',
    'Thumbs.db',
    '',
    '# Log files',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    '',
    '# Build artifacts',
    'dist/',
    'build/',
    'coverage/',
    '',
    '# Test output',
    '*.lcov',
    '',
    '# IDE/editor files',
    '.idea/',
    '.history/',
    '',
    '# Misc',
    '*.tgz',
    '*.swp',
    '*.swo',
    '',
    '# Test output',
    'test-project/'
  ];
  const gitignorePath = `${rootFolder}/.gitignore`;
  fs.writeFileSync(gitignorePath, gitignoreLines.join('\n'));
  created.push(gitignorePath);
  logger?.info?.(`Created: ${gitignorePath}`);

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
