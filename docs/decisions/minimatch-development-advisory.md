# Development-only minimatch advisory

The maintainer accepts [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
for the locked `minimatch` 10.2.6 copies under `@ts-morph/common`,
`eslint-config-next`, and `eslint-plugin-sonarjs`. These are transitive
development dependencies.

The advisory's patched version starts at 11.0.1, outside the affected parents'
declared version ranges. Keep the existing toolchain until a compatible upstream
update is available. The remaining risk is excessive resource use in local or
CI tooling if an affected matcher processes a crafted glob. The accepted scope
covers those development dependencies. The blocking production audit and the
separate full dependency audit remain part of the verification workflow.
