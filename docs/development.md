# Development

## Runtime and installation

Use Node.js 26.x, the current approved LTS major, with npm and the committed
lockfile. TypeScript 6.0 is selected because the installed Next.js lint integration
requires a TypeScript version below 6.1; the inherited TypeScript 7 setting is not
compatible with that peer contract. ESLint 9.39 is the newest compatible major for
the installed Next.js React, import and accessibility lint plugins. ESLint 10 is
currently outside those plugins' declared peer ranges, so it is not forced into
the toolchain. Update these coordinated versions when their peer contracts permit.
Transitive low/moderate advisories remain in development lint and UI tooling.
npm's proposed forced fixes replace the selected tools with incompatible major
versions, so they are not applied automatically. The separate
production audit remains blocking. `npm ci --no-audit` is the reproducible installation command; dependency
auditing is enforced separately. No application secrets or environment file are
required. Standard Next.js `PORT` and CLI hostname/port options are sufficient.

`npm run dev` starts native Next.js development. `src/proxy.dev.ts` supplies a fresh
cryptographic nonce and CSP Report-Only header for development document requests,
with private/no-store delivery and no external report collector. Incoming nonce and
CSP headers are overwritten. `next.config.mjs` enables the `dev.ts` extension only
for the development-server phase; production does not discover this Proxy and
retains SSG with enforced hash CSP. Report-Only does not block development scripts;
production security claims must use the production build.

`agentRules: false` preserves the maintained repository instructions during native
development startup. Consult the installed version's framework documentation under
`node_modules/next/dist/docs/` before changing Next.js behavior.

## Appearance and optional clients

Neural Field's shared light/dark tokens live in `src/index.css`, with landing rules
in `src/components/hero/hero.css`. `src/lib/fonts.ts` loads committed local WOFF2
fonts; no font account, key or runtime font service is required. Their notices
are in [third-party notices](third-party-notices.md).

Without a saved choice, appearance follows the operating system. The theme menu
offers an explicit remember control; ordinary toggles do not create a storage key.
Disabling remembering removes that enum preference. Browser-denied storage has
visible recovery feedback, and it never affects ML consent or workspace lifetime.
Keep ThemeProvider outside the route boundary and preserve the static trusted
bootstrap and upstream wipe style in CSP-verified HTML, including native errors.

Optional theme settings load on intent and mount their portal on opening. The
network demo can prepare a hidden React Activity after intent; it starts effects
only after activation. The decorative hero enhancement is visibility, pause and
reduced-motion gated and retains its static poster without WebGL. Initial model
consent and its small shared dialog compositions stay eager; no ML resource is
prefetched before consent. See the [design system](design-system.md) for ownership.

## Checks

| Command                     | Purpose                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| `npm run format:check`      | Prettier for maintained source and documentation.                 |
| `npm run lint`              | ESLint, React and enforceable complexity limits.                  |
| `npm run typecheck`         | Generate route types and check all application/test TypeScript.   |
| `npm run check:boundaries`  | Parse server/client route and transitive import boundaries.       |
| `npm run check:quality`     | Enforce the source file-size limit.                               |
| `npm run check:dead-code`   | Discover unused files, dependencies and public exports.           |
| `npm run check:duplication` | Check handwritten source duplication at 50 tokens.                |
| `npm run test:coverage`     | All unit/integration tests with blocking coverage.                |
| `npm run test:e2e`          | All browser tests against the existing native production build.   |
| `npm run test:lighthouse`   | Mobile/desktop lab metrics with a production server on port 3100. |
| `npm run audit:production`  | Blocking high/critical production dependency audit.               |
| `npm run audit`             | Full local dependency audit including development tooling.        |
| `npm run ui:audit`          | Inspect actual animation owners without changing source.          |
| `npm run ui:info`           | Inspect the configured shadcn foundation.                         |
| `npm run skills:list`       | List project-local Codex skills.                                  |

Unit/integration tests mirror the application under `test/unit/hooks/`,
`test/unit/lib/`, `test/unit/components/` and `test/unit/screens/`. Tooling gate
fixtures also live under `test/unit/`; browser tests and their isolated model
fixture live under `test/e2e/`. Keep tests outside `src/`. Native Node.js 26 runs
the own TypeScript CI/quality scripts directly; the application typecheck also
checks these scripts.

Use focused Vitest paths for local changes. `npm run ci` runs the combined quality
and unit-coverage gates; native builds and browser checks remain explicit. Do not
run tests or source refactors to satisfy a counter without a real behavioral risk.

Browser tests use the version-matched Chromium Headless Shell. Install it with
`npx playwright install --only-shell chromium`; OS dependency setup is separate and
must respond to actual missing requirements. Playwright starts `npm start` on
127.0.0.1:3100 and refuses to reuse an unrelated server. Build once first.

The Lighthouse command expects a separately started native production server on
that same port. It saves ignored lab reports under `test-results/lighthouse/`.
Scores are measurements, not accessibility or ranking guarantees.

## Build and recovery

Run `npm run ci` and standalone `npm run typecheck` before the final production
build. Native `next typegen` loads the production-build configuration, so the
adapter conservatively invalidates an existing CSP success marker. It does not
produce a publishable build; rebuild before starting production afterward.

`npm run build` invalidates any old CSP success marker, runs one native `next build`
and verifies the resulting manifest. `npm start` verifies it again before native
`next start`. A failed or modified build cannot reuse a previous manifest. Rebuild
from source after changing the content, runtime, lockfile or configuration.

Do not deploy generated `.next/` files separately from their matching source,
headers and assets. Rollbacks must keep that set together. Browser HTML freshness
is five minutes, so retain referenced hashed assets across releases.
