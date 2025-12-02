#!/usr/bin/env node
import { fileURLToPath } from "url";
import { initProject, defaultManifest } from "./scripts/initProject.js";
import { runGenerateCLI } from "./runGenerateCLI.js";
import * as fs from "fs";
import { realpathSync } from "fs";
import { normalize, resolve } from "path";


export class Cli {
  initProject = initProject;
  manifest = defaultManifest;
  // Adapter to match the expected fs interface
  fs = {
    existsSync: fs.existsSync,
    mkdirSync: (path: string, opts?: { recursive?: boolean }) => fs.mkdirSync(path, opts),
    readFileSync: (path: string) => fs.readFileSync(path, 'utf8'),
    writeFileSync: (path: string, content: string) => fs.writeFileSync(path, content, 'utf8'),
  };
  logger = console;

  run(argv: string[] = process.argv.slice(2)) {
    const [command, ...args] = argv;
    switch (command) {
      case "init":
      case "create-lambda-function": {
        const projectName = args[0];
        if (!projectName) {
          this.logger.error("You must provide a project name. Usage: spec2lambda init <project-name>");
          process.exitCode = 1;
          break;
        }
        try {
          this.initProject(this.manifest, { fs: this.fs, logger: this.logger }, projectName);
          this.logger.info("Project initialized.");
        } catch (e: unknown) {
          if (e && typeof e === 'object' && 'message' in e) {
            this.logger.error((e as { message: string }).message);
          } else {
            this.logger.error(String(e));
          }
          process.exitCode = 1;
        }
        break;
      }
      case "generate": {
        // Use the new runGenerateCLI for dependency-injected, robust codegen
        runGenerateCLI(args).catch((err) => {
          this.logger.error("[spec2lambda] Code generation failed:", err);
          process.exitCode = 1;
        });
        break;
      }
      case "--help":
      case "-h":
        this.logger.info(`spec2lambda - CLI\n\nUsage:\n  spec2lambda init <project-name>\n  spec2lambda generate [--config <file>] [--dry-run] [--verbose]\n\nCommands:\n  init         Scaffold a new Lambda service\n  generate     Run codegen based on the OpenAPI spec\n\nOptions for 'generate':\n  --config <file>   Specify config file (YAML/JSON, autodetected if omitted)\n  --dry-run        Show intended file writes and diffs, but do not write files\n  --verbose, -v    Show extra diagnostic output\n\nNote:\n  The existing local-dev server is still used separately (e.g., npm run dev).\n`);
        break;
      default:
        this.logger.info(`Unknown command: ${command}`);
        this.logger.info(`spec2lambda - CLI\n\nUsage:\n  spec2lambda init <project-name>\n  spec2lambda generate [--config <file>] [--dry-run] [--verbose]\n\nCommands:\n  init         Scaffold a new Lambda service\n  generate     Run codegen based on the OpenAPI spec\n\nOptions for 'generate':\n  --config <file>   Specify config file (YAML/JSON, autodetected if omitted)\n  --dry-run        Show intended file writes and diffs, but do not write files\n  --verbose, -v    Show extra diagnostic output\n\nNote:\n  The existing local-dev server is still used separately (e.g., npm run dev).\n`);
        process.exitCode = 1;
    }
  }
}
function isMainModule(): boolean {
  try {
    const modulePath = normalize(realpathSync(fileURLToPath(import.meta.url)));
    if (!process.argv[1]) return false;
    const argvPath = normalize(realpathSync(resolve(process.argv[1])));
    return modulePath === argvPath;
  } catch {
    return false;
  }
}
const isEntry = isMainModule();
if (isEntry) {
  new Cli().run();
}