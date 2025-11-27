/* eslint-disable no-undef */
module.exports = {
  api: {
    input: {
      target: "./api/openapi.yml",
    },
    output: {
      // we only care about Zod schemas; no HTTP client needed server-side
      client: "zod",
      mode: "single",
      target: "./src/generated/schemas.zod.ts",
    },
  },
};
