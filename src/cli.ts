#!/usr/bin/env node

export async function main() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "init":
      console.log("[spec2lambda] TODO: implement project initialization");
      break;
    case "generate":
      console.log("[spec2lambda] TODO: implement code generation");
      break;
    case "--help":
    case "-h":
    default:
      console.log(`spec2lambda - CLI\n\nUsage:\n  spec2lambda init <project-name>\n  spec2lambda generate --config spec2lambda.config.mts\n\nCommands:\n  init         Scaffold a new Lambda service\n  generate     Run codegen based on the OpenAPI spec\n\nNote:\n  The existing local-dev server is still used separately (e.g., npm run dev).\n`);
      if (command && command !== "--help" && command !== "-h") {
        process.exitCode = 1;
      }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}