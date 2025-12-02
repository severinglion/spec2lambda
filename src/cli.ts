#!/usr/bin/env node
import { fileURLToPath } from "url";
import { initProject } from "./scripts/initProject.js";
import { defaultManifest } from "./scripts/packageTemplate.js";
import { runGenerateCLI } from "./runGenerateCLI.js";
import * as fs from "fs";
import { realpathSync } from "fs";
import { normalize, resolve } from "path";
import { logger } from './presentation/logger.js';

const CLI_DEFS = {
  usage: [
    'spec2lambda init <project-name>',
    'spec2lambda generate [--config <file>] [--dry-run] [--verbose]',
    'spec2lambda --help | -h',
    'spec2lambda --version | -v | version',
  ],
  commands: [
    {
      names: ['init', 'create-lambda-function'],
      desc: 'Scaffold a new Lambda service project',
    },
    {
      names: ['generate'],
      desc: 'Run codegen based on the OpenAPI spec',
    },
    {
      names: ['--help', '-h'],
      desc: 'Show usage information',
    },
    {
      names: ['--version', '-v', 'version'],
      desc: 'Show the current CLI version',
    },
  ],
  options: [
    {
      for: 'generate',
      opts: [
        {
          flag: '--config <file>',
          desc: 'Specify config file (YAML/JSON, autodetected if omitted)',
        },
        {
          flag: '--dry-run',
          desc: 'Show intended file writes and diffs, but do not write files',
        },
        {
          flag: '--verbose, -v',
          desc: 'Show extra diagnostic output',
        },
      ],
    },
  ],
  notes: [
    'The existing local-dev server is still used separately (e.g., npm run dev).',
    'All files in src/generated/ are always overwritten by codegen. Never edit these directly.',
    'Handler stubs are (re)generated as needed, but your handler logic is preserved.',
  ],
};

function renderHelp() {
  let out = 'spec2lambda - CLI\n\nUsage:';
  for (const line of CLI_DEFS.usage) {
    out += `\n  ${line}`;
  }
  out += '\n\nCommands:';
  for (const cmd of CLI_DEFS.commands) {
    const names = cmd.names.join(', ');
    out += `\n  ${names.padEnd(28)}${cmd.desc}`;
  }
  for (const optGroup of CLI_DEFS.options) {
    out += `\n\nOptions for '${optGroup.for}':`;
    for (const opt of optGroup.opts) {
      out += `\n  ${opt.flag.padEnd(16)}${opt.desc}`;
    }
  }
  out += '\n\nNotes:';
  for (const note of CLI_DEFS.notes) {
    out += `\n- ${note}`;
  }
  return out + '\n';
}


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
  logger = logger;

  run(argv: string[] = process.argv.slice(2)) {
    const [command, ...args] = argv;
    switch (command) {
      case "-v":
      case "--version":
      case "version": {
        try {
          const pkgPath = resolve(fileURLToPath(import.meta.url), '../../package.json');
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          this.logger.info(pkg.version);
        } catch (e) {
          this.logger.error('Could not read version:', e);
          process.exitCode = 1;
        }
        break;
      }
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
        runGenerateCLI(args, this.logger).catch((err) => {
          this.logger.error("[spec2lambda] Code generation failed:", err);
          process.exitCode = 1;
        });
        break;
      }
      case "--help":
      case "-h":
        this.logger.info(renderHelp());
        break;
      default:
        this.logger.info(`Unknown command: ${command}`);
        this.logger.info(renderHelp());
        process.exitCode = 1;
    }
  }
}
export function isMainModule(): boolean {
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