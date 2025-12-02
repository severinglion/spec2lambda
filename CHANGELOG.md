# Changelog

## [1.1.1](https://github.com/severinglion/spec2lambda/compare/v1.1.0...v1.1.1) (2025-12-02)


### Bug Fixes

* update README to include badges for npm version, downloads, GitHub repo, and license ([5488c43](https://github.com/severinglion/spec2lambda/commit/5488c43beeafc0306b3f5f2a45c205074c4a0e32))

## [1.1.0](https://github.com/severinglion/spec2lambda/compare/v1.0.0...v1.1.0) (2025-12-02)


### Features

* add code generation step to release workflow ([fa8c930](https://github.com/severinglion/spec2lambda/commit/fa8c9300a9202be86962b8099b6aee57f0ff9471))

## 1.0.0 (2025-12-02)


### Features

* add 'codegen:contracts' script and update generation logic to use it ([bc61afb](https://github.com/severinglion/spec2lambda/commit/bc61afb1c68758e0b82f508c7735e3baf06ae85c))
* add 'codegen:contracts' script and update generation logic to use it; update HttpRouter to adhere to verbose config, update unit tests accordingly ([de719f3](https://github.com/severinglion/spec2lambda/commit/de719f30e79af3466ac55f1d6872e0155f27dce5))
* add CI workflow for testing and validation, include type checking and linting steps ([b4465d8](https://github.com/severinglion/spec2lambda/commit/b4465d87f0858aaf74d7f8bc7833cc13589a55e2))
* add code generation step to CI workflow ([2f011b7](https://github.com/severinglion/spec2lambda/commit/2f011b753a733d7c6540667fc5336ee12cda2a3c))
* add initial CLI entry point and stub commands for spec2lambda ([452e40d](https://github.com/severinglion/spec2lambda/commit/452e40d41a7df92298bb0766f508f91fbbc6f33f))
* add initial CLI entry point and stub commands for spec2lambda ([df31738](https://github.com/severinglion/spec2lambda/commit/df317380a2ca7936e55e85c6a988403a07c344e8))
* add local development server with Swagger UI integration and OpenAPI spec serving ([a2351e3](https://github.com/severinglion/spec2lambda/commit/a2351e3436f86d3f1651aa371b2be3771ac435f8))
* add package template command to copy starter files and update b… ([a8aba4c](https://github.com/severinglion/spec2lambda/commit/a8aba4c1a171f55382a4ecbbc38659ddfb68fdd8))
* add package template command to copy starter files and update build process ([1c99aff](https://github.com/severinglion/spec2lambda/commit/1c99affd4362b51c557d37a77e5b2a01c4e4f943))
* add release automation with release-please and update release p… ([aa1c121](https://github.com/severinglion/spec2lambda/commit/aa1c121a9fabf59d1824fe1afc02dae3c8f31c39))
* add release automation with release-please and update release process documentation ([c2ff397](https://github.com/severinglion/spec2lambda/commit/c2ff397ed055d9f2cbf5a467433f134f5bc0ee3c))
* enhance logging in writeGeneratedFiles function and add unit tests for logging behavior ([0f594a9](https://github.com/severinglion/spec2lambda/commit/0f594a957a0437e43f31a4e58693c90965a43240))
* enhance OpenAPI spec with pagination and sorting parameters; re… ([24551c8](https://github.com/severinglion/spec2lambda/commit/24551c889723440583182296c37993b51201e3b3))
* enhance OpenAPI spec with pagination and sorting parameters; refactor handler types and introduce Runner for schema validation ([52694d5](https://github.com/severinglion/spec2lambda/commit/52694d57aec325f24d29d65ebe5024ea8f7c507c))
* enhance TDD agent documentation with detailed responsibilities and testing conventions ([4348da7](https://github.com/severinglion/spec2lambda/commit/4348da754480ebdeb46a7b4b24543fadb155f2b3))
* implement baseline generate command with CLI integration and detailed logging ([3cd109c](https://github.com/severinglion/spec2lambda/commit/3cd109c48fa02c6983ed3140b90523e835695bf8))
* implement HttpRouter and example handlers with unit tests, added an http adapter for the presentation layer ([11623f7](https://github.com/severinglion/spec2lambda/commit/11623f70934e0416a1e9141c1f198ac510480582))
* implement project initialization command and related tests ([ec031b7](https://github.com/severinglion/spec2lambda/commit/ec031b78c45d3d2887af38afa4ec3314b9925c7f))
* improve initialization command path resolution and update modul… ([23b98f3](https://github.com/severinglion/spec2lambda/commit/23b98f340fe7d1e0f6a2789381722eb1e3c34b49))
* improve initialization command path resolution and update module imports ([84ab33e](https://github.com/severinglion/spec2lambda/commit/84ab33eedc3df24fe2351f7b5366d62ab061eeda))
* initialize spec2lambda project with TypeScript template for AWS Lambda APIs ([ed021b8](https://github.com/severinglion/spec2lambda/commit/ed021b8d5ac156f842c4cde593249fa1ce230539))
* integrate custom logger and enhance CLI commands with version r… ([f10e581](https://github.com/severinglion/spec2lambda/commit/f10e581b882798ac1e93ab9ea1cd49cc30ec4d5a))
* integrate custom logger and enhance CLI commands with version reporting ([7544773](https://github.com/severinglion/spec2lambda/commit/75447731034fc137904686afe74175751c5c0209))
* refactor HttpRouter to use OpenAPI-style routing and enhance unit tests for improved coverage ([8322ba7](https://github.com/severinglion/spec2lambda/commit/8322ba74c76f7cc7a3f4e02231d0c0fe8a66475e))
* remove deprecated OpenAPI spec and add new CLI documentation ([8566a39](https://github.com/severinglion/spec2lambda/commit/8566a3968d5a151c358d696756f5bd48299018cb))
* update CLI documentation to clarify command usage and behavior ([c66eb0b](https://github.com/severinglion/spec2lambda/commit/c66eb0b434bc5753ba5c491b193e8baa01920c8b))
* update codegen script to use CLI for generation ([d0ebe52](https://github.com/severinglion/spec2lambda/commit/d0ebe52714de01c24fa971f7416c56c4722d818b))


### Bug Fixes

* correct case of CI workflow name in release-please configuration ([1d34ab8](https://github.com/severinglion/spec2lambda/commit/1d34ab88c947e2ca37e4f6d69385573086a0af00))
* update OpenAPI spec path in configuration and scripts to use the correct directory ([7e9c404](https://github.com/severinglion/spec2lambda/commit/7e9c404504bd075fa04368cbaae3d164af617940))
* update OpenAPI target paths and adjust codegen script for consistency, fix codegen errors ([0241ec3](https://github.com/severinglion/spec2lambda/commit/0241ec316be3fa8a19e12da0dba9e1fb9b18c62d))
* update release-please action to use googleapis and remove unnecessary parameters ([1ce37a7](https://github.com/severinglion/spec2lambda/commit/1ce37a7e0f169e017f9e17b25ec018a6e3afa750))
* update release-please workflow to trigger on CI completion instead of push ([1a7ab9e](https://github.com/severinglion/spec2lambda/commit/1a7ab9ef5eae248cf7c238616c1f125879b1a2e3))
