# Continuous integration

The `CI` workflow validates pull requests targeting `main` against GitHub's simulated
merge commit. It uses the supported Node.js `26.x` major with `check-latest: true` and
installs the lockfile with `npm ci --no-audit`.

## Check selection

The dependency-free planner reads the complete merge-base-to-head Git diff. Renames
include both endpoints, and deletions remain part of the scope. Its plan records the
base, head and merge revisions; consumers reject a different checked-out revision.

| Complete changed scope                                                                         | Selected work                                                          |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Nonempty root `docs/` files only                                                               | Real successful final gate; no dependency installation, tests or build |
| Unit test files under `test/unit/` only                                                        | Static quality, dependency audit and full unit coverage                |
| Application, browser tests, shared assets, configuration, dependencies, mixed or unknown scope | All quality checks, native production build and full browser suite     |
| Empty diff or unavailable Git history                                                          | All checks                                                             |

Selection and the final result gate use `ubuntu-slim`. Selected quality and browser
jobs use regular runners; job-level conditions prevent allocation of unselected
substantive jobs. Superseded runs for the same PR are cancelled. The unconditional
final `CI` check accepts successful selected jobs and explicitly excluded skipped
jobs only. Invalid plans, planning failures, cancellations and unexpected skips fail.

## Dependency cache lifecycle

PR quality and browser jobs restore only npm's `_cacache` content store. Cache
identities include Linux x64, the approved Node.js major, the active npm major and
a hash of dependency and cache configuration inputs. Compatible prefix restores
can reuse downloaded packages; every job still runs `npm ci --no-audit`, including
on a cold cache. PR jobs never save caches, and installed `node_modules`, build
output and browser profiles are not cached.

The separate `Dependency cache` workflow produces caches from trusted `main` when
dependency, runtime or cache configuration inputs change. Its manual entry point
also requires `main`. It installs locked dependencies and records the native
producer identity; it does not repeat application quality, build or browser jobs.
Cache availability does not establish a hit-rate or duration improvement.

`.github/cache-policy.json` declares the managed family, producer and input
boundaries. Cleanup runs from the current trusted `main` source after a successful
cache producer, closed pull requests or declared workflow completion. It verifies
replacement receipts and active runs before deleting eligible obsolete caches,
rechecks the trusted branch identity and bounds deletion to 100 entries per run.
Unknown legacy families have no automatic retirement mapping. The provider's
existing seven-day inactivity eviction and 10 GB repository limit remain unchanged.

PR cache configuration, restore and summary steps are optional; their failures
never suppress `npm ci`. Per-job summaries distinguish exact and compatible
restores, cold caches, errors and unknown outcomes. After trusted `main` seeding,
the observation target is at least 95% confirmed restores over a rolling 30 days
of eligible PR install opportunities with unchanged compatible inputs. Exact and
compatible restores count as successes; cold, error and unknown outcomes remain
in the denominator. Initial and dependency-changing installs are tracked separately.
This is a target, not a measured hit rate; retention and capacity remain unchanged
pending workload evidence, without periodic keepalive or a paid increase.

The lifecycle engine in `.github/scripts/cache-lifecycle/` is the unchanged
canonical JavaScript runtime from the GitHub plugin 1.5.0's
`templates/cache-lifecycle/`, with its upstream type declarations. The local
`.github/scripts/cache.ts` adapter uses TypeScript and the strict project
typecheck. The runtime and adapter retain the same file, function, complexity and
duplication gates; there is no separate custom cache-deletion engine.

## Local interfaces and limits

`npm run ci` runs formatting, ESLint, Next.js route type generation and TypeScript,
source boundaries, file limits, Knip, duplication, the production dependency audit,
and unit coverage. These commands also remain available individually in
`package.json`. The production audit blocks high/critical production vulnerabilities
and audit execution failures; development dependencies remain installed. Before an
authorized integration, run the separate full local `npm audit --include=dev` and
review development-only findings.

Application code, own tooling, root configurations and tests require at most
100 lines per function, 500 lines per source file,
cyclomatic complexity 20, cognitive complexity 25, six parameters and nesting depth
four. Declarative callbacks passed directly to an imported Vitest `describe` are
exempt from function length only: their size groups separate test cases. Individual
test callbacks, nested helpers and lifecycle hooks retain the same limits. The
wrapper delegates the installed ESLint core rule and fails closed if that rule's
listener interface changes; fixtures protect the narrow exception.

Unit coverage includes all hooks, libraries, handwritten client components and
the training screen, native error recovery and the development-only CSP Proxy,
including modules without tests. Build-only public documents,
pure server shell components and upstream registry icons stay outside this unit
scope; native build and production browser checks cover their integration.
Coverage requires 85% lines, statements and functions, plus 80% branches.
Duplication covers application source, tests, own tooling and declared root
configurations; it may not exceed 5% with a minimum matching token length of 50. Inline
ESLint configuration cannot suppress the architecture rules.

Own CI, boundary, quality and Lighthouse scripts are TypeScript, included in the
strict application typecheck and executed with Node.js 26's native type stripping.
Root configurations also enter lint, size and duplication checks. `.npmrc` enforces
the approved engine range for npm operations.

Upstream skills under `.agents/` are vendored tooling documentation and do not enter
application lint or formatting. The registry's unchanged
`src/components/animate-ui/icons/smartphone.tsx` retains its static SVG geometry with
an exact-file exception to function length only; the other lint and security rules
still apply. Duplication excludes only the official generated registry icons under
`src/components/animate-ui/icons/`: repeated SVG/motion scaffolding belongs to that
upstream implementation. Handwritten adapters and application components retain
the 5% duplication limit. React Compiler is not enabled, so its incompatible-library adoption
rule is disabled. Hook ordering and dependency rules remain enforced. The CSP
template keeps its unused nonce-policy export for template fidelity; Knip ignores
only exported API usage in that exact vendor module, not application dead code.

The syntax-aware source boundary gate discovers root and nested App Router
`page`/`layout` modules. They remain Server Components. Native metadata/API entries
and the static Pages Router error bridge are additional server roots. Ordinary
helpers are not independently classified as server code. It follows runtime imports,
re-exports and literal dynamic imports through TypeScript's alias resolution, stops
at explicit client boundaries, and rejects browser ML imports from the server tree.
It also rejects transitive server-only imports from client components. Type-only
imports do not load runtime modules.
Tests live under `test/unit/` and `test/e2e/`. Test files under `src/`, application
imports from `test/` (including type-only imports), and application runtime imports
of local modules outside `src/` fail the boundary gate. Native root configuration
and the vendored CSP adapter remain outside the application import tree. The
development-only CSP Proxy has an exact exception for its imports of
`csp.config.mjs` and `csp/runtime/policy.mjs`; application and client imports of
that Proxy remain forbidden.

`npm run build` uses the native Next.js build and its CSP verification hooks.
`npm run test:e2e` runs the complete browser suite against the native production
server, including accessibility and keyboard contracts. It remains unfiltered with
`CI=true`. CI downloads only the lockfile-matched Chromium headless shell; browser
launch and host dependency validation stay blocking.

## Security automation and release boundary

The required `gitleaks` check scans the checked-out tree and the complete introduced
Git range for PRs. A manual scan additionally covers all available history. Its exact
version and archive checksum live in `.github/gitleaks-version.json`. PR scans use
the base revision's manifest and policy, preserve default scanner rules and do not
accept PR-controlled ignore fingerprints. The monthly updater proposes a normal PR
changing the scanner manifest.

`Validate PR Title` checks Conventional Commit titles with the intentional Dependabot
actor exception. Dependabot auto-merge reads metadata without executing PR code and
enables ordinary protected squash auto-merge only for same-repository npm minor or
patch updates authored and triggered by Dependabot. Major and GitHub Actions updates
require manual integration.

The active GitHub rules require `CI`, `gitleaks` and `Validate PR Title`, enforce an
up-to-date branch and allow only squash integration. Actions policy requires full
commit-SHA pinning. Workflows from private-repository fork pull requests require
administrator approval and receive neither write tokens nor secrets or variables.
Repository Projects are disabled. These are saved provider controls; workflow
files alone do not activate them. Merging and publication still require explicit
authorization.
GitHub does not deploy or repeat application CI automatically after merging.
Vercel's native Git integration owns Preview and Production builds; deployment,
promotion and provider configuration require their own authorization.
