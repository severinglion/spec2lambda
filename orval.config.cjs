/* eslint-disable no-undef */
module.exports = {
  accountService: {
    input: {
      target: "./docs/openapi-participant-service.yml",
    },
    output: {
      // we only care about Zod schemas; no HTTP client needed server-side
      client: "zod",
      mode: "single",
      target: "./src/generated/participant-api.zod.ts",
    },
  },
};
