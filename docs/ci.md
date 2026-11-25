# Continuous integration

The `CI` workflow validates pull requests targeting `main` against GitHub's simulated
merge commit. It uses the supported Node.js `26.x` major with `check-latest: true` and
installs the lockfile with `npm ci --no-audit`.

## Check selection

The dependency-free planner reads the complete merge-base-to-head Git diff. Renames
include both endpoints, and deletions remain part of the scope. Its plan records the
base, head and merge revisions. Consumers reject a different checked-out revision.

| Complete changed scope                                                                                 | Selected work                                                                                                   |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Nonempty diff of Markdown files under root `docs/` only                                                | Real successful final gate; no dependency installation, tests or build                                          |
| Only `*.test.ts`, `*.test.tsx` or `*.test.mjs` files under `test/unit/`                                | Static quality, production dependency audit and full unit coverage                                              |
| Only allowlisted local Lighthouse scripts, optionally with unit tests                                  | Static quality, production dependency audit and full unit coverage                                              |
| One eligible added or modified `test/e2e/*.spec.ts`                                                    | Full quality checks, native production build, five core browser specs, two core quiz cases and the changed spec |
| Application, test fixtures, browser tests, assets, configuration, dependencies, mixed or unknown scope | All quality checks, native production build and browser suite                                                   |
| Empty diff or unavailable Git history                                                                  | All checks                                                                                                      |

The local-tooling allowlist contains `scripts/check-lighthouse.ts` and
`scripts/lighthouse-runtime.ts`. Either or both can change with unit tests and
still select the quality job alone. Other mixed scopes select the full suite.
The Markdown rule uses the same path predicate as the Vercel build filter.
Other file types under `docs/` select full CI.

The single-spec selection applies only when the complete diff is one regular
added or modified `test/e2e/<lowercase-name>.spec.ts` file, the branch is up to
date with its base, and the verified simulated merge tree matches the PR head
tree. Other browser-test changes select the full browser suite. The five mandatory
core specs in `.github/scripts/browser-ci.ts` are `test/e2e/security-headers.spec.ts`,
`test/e2e/site.spec.ts`, `test/e2e/initial-content.spec.ts`,
`test/e2e/intent-navigation.spec.ts` and `test/e2e/training-bfcache.spec.ts`.
For an eligible single-spec change, CI runs those files, the changed spec and
two fixed `@ci` cases. `test/e2e/quiz.spec.ts` checks local answer explanations and
keyboard focus on reset. `test/e2e/knn-quiz.spec.ts` checks retries, voting limits
and new rounds. A changed file already in the selection runs once, and selecting
a quiz file runs its tagged case as part of that file. Discovery requires exactly
one runnable `@ci` case in each of the two quiz files and rejects the tag elsewhere.
Unfiltered Playwright discovery checks that every selected file contains runnable
tests. Each execution is checked against native discovery; missing, duplicate,
unexpected or unsuccessful results fail. A non-required test may be skipped only
with a documented reason. Invalid discovery fails the browser job. Deletions, renames, multiple changes
and missing eligibility evidence retain the full browser suite.

Selection and the final result gate use `ubuntu-slim`, as does Gitleaks. Their
Node.js setup disables the action's automatic package-manager caching with
`package-manager-cache: false`. Selected quality and browser jobs use regular
runners. Job-level conditions prevent allocation of unselected
substantive jobs. CI and Gitleaks each group new code and base-change runs by PR
number. GitHub cancels an in-progress run or replaces a pending run in the same
group when another run arrives. GitHub schedules by concurrency queue arrival,
which can differ from revision order. Required checks still apply to the current
revision. PR edits without a base change use a separate group for each simulated
merge revision, allowing a running check to finish. Explicit PR reruns use their
original run ID in a separate group and require fresh checks. A partial rerun
cannot approve a reuse plan from the first attempt. Manual Gitleaks scans use a separate
group per ref and supersede earlier manual scans on that ref.
The unconditional final `CI` check accepts successful selected jobs and explicitly
excluded skipped jobs only. Invalid plans, planning failures, cancellations and
unexpected skips fail.
The workflow, planner and final validation run from the simulated PR merge checkout.
After an edit limited to the title or description, CI and Gitleaks can each reuse
a successful result from the same repository, pull request and workflow for the
exact base, head and simulated merge revisions. The required job must contain
a successful verification step less than seven days old for those revisions, and
the workflow must still report the same successful attempt. A reuse step does not
extend that window.

A metadata run can wait within a bounded lookup budget for an active code run for
the exact pull request and revision set. It never waits for another metadata run.
A missing match gets a short initial retry. Missing, failed, expired or unavailable
evidence, including expiry of the lookup budget, falls back to ordinary check
selection or scanning. Changes to the base run the regular checks.

## Dependency cache lifecycle

PR quality and browser jobs restore only npm's `_cacache` content store.
`.github/scripts/cache.ts` computes the same install-input digest for PR jobs,
the producer and reconciliation from `.npmrc`, `package.json` and `package-lock.json`.
The `mlteaching-npm-v1-` prefix retains Linux x64, Node.js 26 and the active npm
major. Older keys with the same compatible prefix can still supply downloaded
packages. Every consuming job runs `npm ci --no-audit`, including on a cold cache.
PR jobs never save caches, and installed `node_modules`, build output and browser
profiles are not cached.

The separate `Dependency cache` workflow runs on trusted `main` when install
inputs or cache producer and lifecycle configuration change. Its manual entry
point also requires `main`. Changes confined to the PR CI workflow do not trigger
warming. An exact cache hit reuses the immutable cache. On a miss, the producer
restores a compatible fallback when available and installs locked dependencies.
It records the native producer identity without repeating application quality,
build or browser jobs.
Cache availability does not establish a hit-rate or duration improvement.

The `Dependency cache reconciliation` workflow checks the exact key daily at 11:23 UTC
without downloading the cache. It confirms an apparent miss against the current
`main` revision and cache inventory before dispatching the trusted producer. This
independent check covers changes for which GitHub suppresses a push-triggered
workflow after a `GITHUB_TOKEN` action.

`.github/cache-policy.json` declares the managed family, producer and input
boundaries. Cleanup runs from the current trusted `main` source after a successful
cache producer, closed pull requests or declared workflow completion. It verifies
replacement receipts and active runs, reads and validates the returned inventory pages,
and refreshes the inventory, active runs and trusted branch identity before
deletion. Each run deletes up to 100 revalidated cache IDs and checks the
inventory again to confirm their removal.
Inventory checks require complete counts and unique identities. Uncertain API
results stop the affected cleanup. Diagnostics include the operation and error
class without logging the underlying command or response.
After pull request cache cleanup, each group of up to 20 default-branch cache
deletions rechecks the cache inventory, replacement provenance, active workflow
runs and current default-branch revision.

For large inventories, the GitHub workflow run number rotates the window of
identities checked. Planning verifies up to 100 distinct pull requests and 25
CodeQL runs. A closed pull request that triggered cleanup has a reserved place
in the window if its cache exists. Before deletion, cleanup rechecks up to 100
pull request cache candidates. The summary counts deferred candidates separately
from unverified pull request identities and CodeQL runs. Later lifecycle events
plan from the current inventory and apply the same safeguards.

Workflow completions and PR closures can both resume deferred main rotation using
a verified producer receipt. Recovery queries each approved producer workflow
directly so other workflow runs cannot displace eligible receipts from the bounded
search. It prefers the current revision and checks that producer inputs are unchanged
before using an older receipt. An expired npm receipt leaves the npm generations in
place while independently verified closed-PR and CodeQL cleanup can proceed.
For main rotation, the active lifecycle workflow
can proceed past queued or pending runs with the same verified GitHub workflow
identity because the shared concurrency group serializes them. Other active runs
still block main rotation. PR cache checks consider all associated active runs.
Unknown legacy families have no automatic retirement mapping. The provider's
existing seven-day inactivity eviction and 10 GB repository limit remain unchanged.

PR cache configuration, restore and summary steps are optional; their failures
never suppress `npm ci`. Per-job summaries distinguish exact and compatible
restores, errors and unknown outcomes. A restore without a matched key is unknown,
even when the action reports success. After trusted `main` seeding,
the observation target is at least 95% confirmed restores over a rolling 30 days
of eligible PR install opportunities with unchanged compatible inputs. Exact and
compatible restores count as successes; error and unknown outcomes remain
in the denominator. Initial and dependency-changing installs are tracked separately.
This is a target, not a measured hit rate; retention and capacity remain unchanged
pending workload evidence, without a separate keepalive job or a paid increase.

The lifecycle engine in `.github/scripts/cache-lifecycle/` is based on the
GitHub plugin template with its upstream type declarations. The core adapts the
version 1.5.6 template for serialized cleanup recovery. Cleanup manages npm caches and
superseded CodeQL overlay database caches. A CodeQL replacement must be nonempty
and tied to a successful default-setup `Push on main` run at the current `main`
revision. Cleanup compares only caches in the same family, branch and cache
version. The local `.github/scripts/cache.ts` adapter uses the strict TypeScript
project. `tsconfig.cache-lifecycle.json` typechecks the CommonJS runtime with
`checkJs`, and Knip includes it in dead-code discovery. The runtime and adapter
retain the same file, function, complexity and duplication gates.

## Local interfaces and limits

`npm run ci` runs formatting, ESLint, Next.js route type generation and TypeScript,
source boundaries, file limits, Knip, duplication, the production dependency audit,
and unit coverage. These commands also remain available individually in
`package.json`. The production audit blocks high/critical production vulnerabilities
and audit execution failures; development dependencies remain installed. Before an
authorized integration, run the separate local `npm run audit`. It includes
development dependencies and reports findings at all severities. High and critical
findings cause a nonzero exit status. Review development-only findings as well.
The blocking typecheck also checks the Next.js configuration and hash-CSP build
tooling as JavaScript through `tsconfig.build-tooling.json`.

Application code, own tooling, root configurations and tests require at most
100 lines per function, 500 lines per source file including CSS,
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
rule is disabled. Hook ordering and dependency rules remain enforced. Knip checks
exports in the CSP runtime, including the nonce-policy module used by the
development Proxy.

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
server, including accessibility and keyboard contracts. The local command remains
unfiltered with `CI=true`. The browser job validates the plan, installs dependencies
and builds the application once. It runs Playwright with four workers for the full
suite and two for the selected-spec plan. Every execution must match its expected
test identities from native discovery.
The job installs both lockfile-matched Chromium variants for
[the browser tests](development.md#checks). Browser launch, host dependency
validation and the selected suite are blocking. Lighthouse runs locally as
described in the [performance audit decision](decisions/performance-audits.md).

## Security automation and release boundary

The required `gitleaks` check scans the checked-out tree and the complete introduced
Git range for PRs. A manual scan additionally covers all available history. Its exact
version and archive checksum live in `.github/gitleaks-version.json`. PR scans use
the base revision's manifest and policy, preserve default scanner rules and do not
accept PR-controlled ignore fingerprints.

`Update gitleaks version` checks for a new release monthly on the default branch
and proposes a manifest-only PR from `chore/gitleaks-<version>`. If the update
fails after pushing the branch, run the updater again on `main`. It leaves an open
matching PR in place and reuses an existing branch only after verifying that its
single change matches the expected version and upstream Linux archive checksum.
If the rerun still fails, inspect the PR and branch before taking manual action.
Open a missing PR from the existing branch only after verifying that its diff is
limited to the manifest and that the version and checksum match the upstream
release. If the branch differs, resolve the discrepancy before using it.

The regular `pull_request` trigger continues to run the required scanner check.
For PRs opened by the updater, GitHub places the resulting workflow runs in an
approval-required state because the updater uses `GITHUB_TOKEN`. The required
checks still gate the merge. [GitHub token behavior](https://docs.github.com/en/actions/concepts/security/github_token#when-github_token-triggers-workflow-runs)

GitHub Secret Scanning, repository push protection and CodeQL default setup are
enabled alongside the required Gitleaks check. Secret Scanning detects supported
secrets on GitHub, and push protection blocks supported secrets during pushes. The
[visibility decision](decisions/public-repository-visibility.md) records the
maintainer's decision to keep the repository public.

`Validate PR Title` checks Conventional Commit titles with the intentional Dependabot
actor exception. Dependabot auto-merge reads metadata without executing PR code and
enables ordinary protected squash auto-merge only for same-repository npm minor or
patch updates authored and triggered by Dependabot. Major and GitHub Actions updates
require manual integration.

The active GitHub rules require `CI`, `gitleaks` and `Validate PR Title`, enforce an
up-to-date branch and allow only squash integration. GitHub defaults to the
commit title for a single-commit squash merge and the pull request title for a
multi-commit squash merge. Actions policy requires full commit-SHA pinning. The
fork workflow approval policy is `all_external_contributors`. Approved fork
pull request workflows run with a read-only token and without repository secrets.
Repository Projects are disabled. These are saved provider controls; workflow
files alone do not activate them. Merging and publication still require explicit
authorization.
GitHub does not deploy or repeat application CI automatically after merging.
Vercel builds Production from eligible Git commits on `main`. Previews are
created manually through the Vercel CLI or REST API with explicit authorization.
Manual deployments, promotions and provider configuration require their own
authorization. See [the deployment guide](deployment.md).
