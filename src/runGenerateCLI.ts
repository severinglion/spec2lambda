import * as jsYaml from "js-yaml";
import * as fs from "fs";
import { spawn } from "child_process";
import { diffLines } from "diff";
import { generate } from "./scripts/generate.js";

// Helper to promisify child_process spawn for processRunner
function runProcess(cmd: string, args: string[], opts: Record<string, unknown>): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    // Always use shell: true for npm scripts (cross-platform)
    const child = spawn(cmd, args, { ...opts, shell: true });
    let stdout = "";
    let stderr = "";
    if (child.stdout) child.stdout.on("data", (d) => (stdout += d));
    if (child.stderr) child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr, code });
      else reject(new Error(stderr || `Process exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

// Diff summary helper

import type { Change } from "diff";
function diffSummary(oldStr: string, newStr: string): string {
  const changes: Change[] = diffLines(oldStr, newStr);
  return changes
    .map((part) => {
      if (part.added) return `+${part.value.trim()}`;
      if (part.removed) return `-${part.value.trim()}`;
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

import { logger } from './presentation/logger.js';

export async function runGenerateCLI(args: string[], injectedLogger = logger) {
  const verbose = args.includes("--verbose") || args.includes("-v");
  const dryRun = args.includes("--dry-run");
  const configPathArg = args.find((a) => a.startsWith("--config"));
  const configPath = configPathArg ? configPathArg.split("=")[1] : undefined;
  await generate(
    {
      fs: {
        existsSync: (p: string) => fs.existsSync(p),
        readFileSync: (p: string, enc: BufferEncoding) => fs.readFileSync(p, { encoding: enc }),
        writeFileSync: (p: string, c: string, enc: BufferEncoding) => fs.writeFileSync(p, c, { encoding: enc }),
      },
      logger: injectedLogger,
      yaml: jsYaml,
      processRunner: runProcess,
      diff: diffSummary,
    },
    { verbose, args, dryRun, configPath }
  );
}
