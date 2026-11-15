# Repository instructions

## Scope and publication

- Product: ML Teaching. Intended canonical origin: `https://mlteaching.boomapps.de`.
- Keep this migration on `Codex/development-nextjs-ssg`. Do not merge to or push
  `main`, deploy, connect publishing integrations or change DNS without explicit
  authorization. The legacy host may still deploy `main`.
- Use English technical documentation and identifiers; German UI and legal text.
  Commits and PR titles use English Conventional Commits. No commit/push/PR is
  implied by source-edit authority. Authorized integration uses squash merge.
- Preserve unrelated work. Do not add databases, accounts, tracking, external fonts,
  client fingerprinting or paid services without a concrete requirement and authority.
- Every administrative write to an actual database needs direct user approval for
  the exact reviewed target and change. No migration/seed hook may run implicitly.
- Apply relevant installed domain guidance before work, respecting its scope.
  Read the project-local shadcn and Animate UI skills for selected UI work.

## Runtime and native framework

- Use the newest officially released Node.js LTS. The approved major is 26.x.
  Keep package engines, CI selectors and provider runtime aligned after a reviewed
  major update; verify current official releases instead of floating `lts/*`.
- Use npm and the generated lockfile. Reproducible installs use `npm ci --no-audit`;
  production auditing is a separate blocking CI gate, full auditing a local gate.
  `.npmrc` enforces the declared engine range; full auditing explicitly includes dev dependencies.
- Use native Next.js App Router with TypeScript and `src/`. Pages/layouts remain
  Server Components. All five public pages are SSG; browser ML stays behind explicit
  client boundaries. No Express, Vite, React Router, Docker or custom server.
  Production has no Proxy. Only `src/proxy.dev.ts` provides nonce-based Report-Only
  CSP during `next dev`; native development-only extension discovery excludes it
  from production without introducing request reads into the root layout.
- Consult the installed Next.js documentation under `node_modules/next/dist/docs/`
  before framework changes. Repository instructions remain explicitly maintained;
  `agentRules: false` prevents development startup from appending generated rules.
- Keep ordinary screen components in `src/screens/`. `src/pages/500.tsx` is the
  sole routed Pages Router compatibility entry for static error delivery; `_app`
  and `_document` share styles and the German document language.
- Preserve authorized initial content at build/server boundaries. New private flows
  would require a separately assessed SSR/auth/cache design; do not turn them into
  mount-fetch shells or add auth merely because the existing learning UI is interactive.
- TensorFlow, WebGL and models load only after consent, in the browser. Never upload
  training images/features. Stop camera tracks and dispose model/classifier resources
  on teardown. Bound training, uploads, retries and one-frame prediction work.
- TanStack Virtual owns thumbnail windowing. Local training data and one-time model
  assets do not justify server Query/Table/DB layers; reassess if actual server data
  or substantial shared-entity mutation is introduced.

## Build and security

- `npm run build` runs the CSP prebuild invalidation, one native `next build`, and
  postbuild verification. `npm start` verifies the same artifacts before native
  startup. Do not bypass lifecycle checks with direct delivery `next build`.
- Keep the adopted Next.js-plugin 1.9.5 CSP runtime together. Preserve artifact,
  policy, path, native-error, provider-composition and stale-build guards. No unsafe
  inline/eval, fixed nonce, version-only allowlist or permissive fallback.
- Maintain `csp.config.mjs` with every added/removed/renamed/rendering-changed public
  route and static error owner. Verify generated HTML and headers together.
- Keep central fixed security headers in `next.config.mjs`, including HSTS
  `max-age=31536000; includeSubDomains; preload`. No separate Project Routing Rule
  owner. Source is not proof of live TLS, hosted headers or provider configuration.
- Vercel releases are native and separate from GitHub quality. An explicit absolute
  native provider adapter must compose with the CSP adapter; missing composition
  fails closed. Manual Previews need explicit authorization. No provider secrets
  are required for the application; never pull credentials to inspect setup.
- Use WebP source assets and native AVIF-first/WebP image negotiation. Local user
  image data bypasses server optimization. Preserve the strict initial-style
  integrations and upstream UI license notices described in the design guide.

## UI and accessibility

- Preserve the established zinc/red/indigo educational design. Tailwind 4,
  shadcn/ui Radix/new-york and Animate UI form the selected bundle.
- Reuse shared wrappers in `src/components/ui/`, product Button/Dialog interfaces,
  central variants/tokens and native framework navigation. Consult official
  catalogs before introducing components or custom substitutes.
- Animate UI owns component motion; React ViewTransition owns native route
  continuity. Preserve reduced motion, immediate keyboard/focus behavior, one owner
  per property/lifetime, and no decorative replay from virtualized scroll admission.
- Keep responsive breakpoints and shared rules centralized. Test representative
  learning/legal/mobile behavior, production axe WCAG 2.2 A/AA and keyboard flows.
- Keep legal pages controlled, current and source-grounded. New controlled wording
  or omissions require exact approval; final legal integration requires independent
  review. Accessibility statements describe measures/current limitations, omit
  tools/scores/run history and preserve their actual historical creation date.

## Quality and tests

- `npm run ci` blocks on formatting, lint, full typechecking, syntax-aware source
  boundaries, file limits, dead code, duplication, production audit and unit coverage.
- Enforced application limits: 500 lines/file, 100 nonblank/noncomment lines/function,
  cyclomatic complexity 20, cognitive complexity 25, six parameters, nesting depth
  four, duplication at most 5% at 50 tokens, coverage at least 85% lines/statements/
  functions and 80% branches. Review triggers remain 300/50 lines, complexity15,
  four parameters and nesting three; justify focused structure instead of padding.
- Exact vendor exceptions: official generated Animate UI icon scaffolding is outside
  handwritten duplication; its unchanged Smartphone generator has the sole
  function-length exception. External `.agents/skills/` is upstream tooling.
  Application code, source boundaries, security and browser checks remain enforced.
- Apply complexity, size and function limits to own tooling, root configuration
  and tests too. Only direct suite callbacks bound to Vitest's named `describe`
  import are exempt from function length; test cases, helpers and lifecycle hooks
  remain limited. Preserve the delegated ESLint rule and its fail-closed fixtures.
- Unit coverage includes handwritten client components and the training screen
  alongside hooks/libraries. Exclude only declared static server shells and upstream
  registry producers; never omit interactive logic to satisfy thresholds.
- React Compiler is not enabled. Its incompatible-library advisory is inapplicable;
  ordinary hook correctness rules remain blocking, including for TanStack Virtual.
- `npm run test:e2e` uses native production output and starts only `npm start`.
  Unit/integration tests live under `test/unit/`, mirroring the application folders;
  browser tests and fixtures live under `test/e2e/`, shared setup under `test/`.
  Never place tests or test imports in `src/`; the boundary gate rejects them.
  Own CI and quality scripts use TypeScript and native Node.js type stripping,
  so the same strict typecheck includes their implementation.
  Keep test commands unfiltered locally even under `CI=true`. Use the cheapest
  reliable focused checks; do not repeat unrelated/full suites without cause.
- Test supported public behavior, security boundaries and resource/failure recovery;
  avoid cosmetic snapshots, manufactured unreachable states or coverage padding.
- PR-only workflow and final gate are both `CI`. It tests the simulated merge,
  binds the complete-diff plan to base/head/merge revisions and rejects malformed
  plans, failures, cancellations and unexpected skips. Keep Gitleaks and PR-title
  checks required too. Strict up-to-date branch enforcement is a provider requirement,
  not a source claim; do not change protection without authorization.
- Lightweight/no-work gates use Slim, substantive selected jobs regular runners.
  No duplicate automatic `main` quality workflow and no Actions deployment workflow.

## Documentation

Keep maintained technical Markdown under `docs/` with English kebab-case names,
except standard root documents. Describe current behavior and limitations, not audit
run histories. Record lasting architecture decisions in `docs/decisions/`.
Update the recursive index below and verify affected commands/links with every
maintained documentation change.

## Documentation Index

| Document                                                         | Purpose                                                         |
| ---------------------------------------------------------------- | --------------------------------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md)                   | Describes route, component and browser ML boundaries.           |
| [`docs/ci.md`](docs/ci.md)                                       | Explains protected PR planning, jobs and quality controls.      |
| [`docs/decisions/ssg-and-csp.md`](docs/decisions/ssg-and-csp.md) | Records static rendering and guarded CSP integration.           |
| [`docs/deployment.md`](docs/deployment.md)                       | Defines the prepared Vercel target and publication boundaries.  |
| [`docs/design-system.md`](docs/design-system.md)                 | Defines shared UI, motion, accessibility and integration rules. |
| [`docs/development.md`](docs/development.md)                     | Documents runtime, commands and local verification.             |
| [`docs/third-party-notices.md`](docs/third-party-notices.md)     | Documents upstream component and icon license notices.          |
