# Development

## Runtime and installation

Use Node.js 26.x, the current approved LTS major, with npm 11 or npm 12 and the
committed lockfile. TypeScript 6.0 satisfies the installed lint toolchain's upper peer bound
of 6.1. The lockfile selects ESLint 10.15.0 because
[ESLint 9 is end of life](https://eslint.org/version-support/).
[Next.js 16.4.6 tests its lint configuration with ESLint 10.11.0](https://github.com/vercel/next.js/blob/v16.4.6/test/production/eslint-config-next/eslint-config-next.test.ts).
npm 12 installs the locked tree with peer warnings for `eslint-plugin-import`,
`eslint-plugin-jsx-a11y` and `eslint-plugin-react`, whose declared ranges end at
ESLint 9. These peer gaps remain a compatibility risk. Keep the blocking lint
check when changing any part of the toolchain.
Install the locked dependencies with `npm ci --no-audit`. Run dependency audits
separately. `npm run audit:production` blocks high and critical production
findings, and `npm run audit` also checks development dependencies. Review
dependency changes for compatibility before applying audit fixes. No application
secrets or environment file are required. Standard Next.js `PORT` and CLI
hostname/port options are sufficient.

`npm run dev` starts native Next.js development. `src/proxy.dev.ts` supplies a fresh
cryptographic nonce and CSP Report-Only header for development document requests.
The policy also authorizes the exact trusted theme bootstrap, transition styles and
error-page speculation rules by hash. Document responses use `no-store` delivery
without an external report collector. Incoming nonce and
CSP headers are overwritten. `next.config.mjs` enables the `dev.ts` extension only
for the development-server phase; production does not discover this Proxy and
retains SSG with enforced hash CSP. Report-Only does not block development scripts;
production security claims must use the production build.

Local interactive previews, including Tailscale browser tooling, use `npm run dev`.
`npm start` always serves a production build with enforcing CSP, even on localhost
or behind a private tunnel. Report-Only violations in development remain observable
but do not block injected tooling scripts or styles; production retains enforcement.
For a tunnel, set `NEXT_DEV_ALLOWED_ORIGIN` to its exact hostname, without a scheme
or port. This server-only optional setting configures Next.js `allowedDevOrigins`
only during development, permitting that host's dev assets and Hot Reload socket.
Unlisted origins remain blocked; no production origin or CSP allowance is added.

```bash
NEXT_DEV_ALLOWED_ORIGIN=machine.example.ts.net npm run dev -- --hostname 127.0.0.1 --port 3100
```

`agentRules: false` preserves the maintained repository instructions during native
development startup. Consult the installed version's framework documentation under
`node_modules/next/dist/docs/` before changing Next.js behavior.

## Appearance and optional clients

ML Teaching's shared light/dark tokens live in `src/site-foundation.css`, with landing rules
in `src/components/hero/hero.css`. `src/lib/fonts.ts` loads the committed local Geist
WOFF2 asset; no font account, key or runtime font service is required. Its notices
are in [third-party notices](third-party-notices.md).

Without a saved choice, appearance follows the operating system. The theme menu
offers an explicit remember control; ordinary toggles do not create a storage key.
Disabling remembering removes that enum preference. Browser-denied storage has
visible recovery feedback, and it never affects ML consent or workspace lifetime.
Keep ThemeProvider outside the route boundary and preserve the trusted static
theme bootstrap in CSP-verified HTML, including native errors. The decorative
wipe mounts on user-initiated appearance changes as described in
[Motion ownership](design-system.md#motion-ownership).

Optional theme settings load on intent and mount their portal on opening. The
network demo can prepare a hidden React Activity after intent. Its persistent dog/cat
Buttons start the selected example once its diagram is visibly ready; there is no
separate activation step. The decorative hero enhancement is visibility, pause and
reduced-motion gated and retains its static poster without WebGL. Initial model
consent and its small shared dialog compositions stay eager; no ML resource is
prefetched before consent. See the [design system](design-system.md) for ownership.

## Checks

| Command                     | Purpose                                                                  |
| --------------------------- | ------------------------------------------------------------------------ |
| `npm run format:check`      | Prettier for maintained source and documentation.                        |
| `npm run lint`              | ESLint, React and enforceable complexity limits.                         |
| `npm run typecheck`         | Generate isolated route types and check app, tests and tooling projects. |
| `npm run check:boundaries`  | Parse server/client route and transitive import boundaries.              |
| `npm run check:quality`     | Enforce the source file-size limit.                                      |
| `npm run check:dead-code`   | Discover unused files, dependencies and public exports.                  |
| `npm run check:duplication` | Check handwritten source duplication at 50 tokens.                       |
| `npm test`                  | All core Vitest unit and integration tests.                              |
| `npm run test:e2e`          | Required browser suite against the existing native production build.     |
| `npm run audit:lighthouse`  | Mobile/desktop lab metrics with a production server on port 3100.        |
| `npm run audit:production`  | Blocking high/critical production dependency audit.                      |
| `npm run audit`             | Full local dependency audit including development tooling.               |
| `npm run ui:audit`          | Inspect actual animation owners without changing source.                 |
| `npm run ui:info`           | Inspect the configured shadcn foundation.                                |
| `npm run skills:list`       | List project-local Codex skills.                                         |

Core unit and integration tests are grouped in `test/unit/learning/`,
`test/unit/training/` and `test/unit/tooling/`. Playwright specs and synthetic
model fixtures live under `test/e2e/`. Keep tests outside `src/`.
To run one unit group, use `npm test -- --project training` with the appropriate
project name. For a single production test file, use
`npm run test:e2e -- test/e2e/delivery.spec.ts`. See [CI](ci.md#check-selection)
for the automatic selection and its fallback.

The training browser tests use full Chromium in headless mode for genuine
back-forward cache restoration. Install the locked version with
`npx playwright install chromium --no-shell`. Set up OS libraries only if
Playwright reports missing dependencies. The HTTP-only delivery spec requires
no browser binary. Playwright starts `npm start` on 127.0.0.1:3100 and
requires the port to be free.

Run all core tests from an installed checkout with the following commands.
They discover the same tests under `CI=true`.

```sh
npm run build
npm test
npm run test:e2e
```

`npm run ci` adds the quality and production dependency checks to `npm test`.
Verify ordinary UI and accessibility changes directly in the running app. Use
the production server for browser behavior involving CSP or static hydration.
Use a scoped browser trace or profiler for changes that affect performance.

### Check the model download

Open `/lernen/bilderkennung/ausprobieren` on the running local app in a fresh
browser profile with WebGL enabled. In DevTools, open the Network panel and
confirm that no model request starts while consent is pending. Select both
required checkboxes and choose **Zustimmen**. Confirm the download starts and
the camera choice appears. Select **Ohne Kamera fortfahren** and check that the
collection controls are usable. No camera or personal images are needed.
If the download fails, inspect the failed model request, restore connectivity
if needed, and select **Erneut versuchen**. The automated training flow uses a
synthetic model fixture to exercise application behavior independently of the
external provider.

### Check accessibility in the production build

Use `npm run build` and `npm start`, or reuse the running production build for the
same source. Exercise the affected states at the relevant viewport sizes with
keyboard, touch or pointer input. Check focus, labels and operation manually.
Use a screen reader when spoken names or announcements change.

For a targeted scan, get the path to the lockfile-installed axe-core script
from Lighthouse's dependency tree:

```sh
node -p 'require("node:module").createRequire(require.resolve("lighthouse/package.json")).resolve("axe-core/axe.min.js")'
```

Copy that local script into a [Chromium DevTools snippet](https://developer.chrome.com/docs/devtools/javascript/snippets)
and run it on the local page. Open each affected state, such as a menu, dialog
or recovery view, then run this in the DevTools Console:

```js
await axe
  .run({ runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] })
  .then(({ violations, incomplete }) => ({ violations, incomplete }));
```

Run the snippet again after a full page load. Investigate violations and check
incomplete results manually. Report the states checked and any remaining gaps
alongside the manual findings.

### Audit performance with Lighthouse

For local Lighthouse audits, install the version-matched Chromium Headless Shell
with `npx playwright install chromium --only-shell`, then build the site. Start the native
production server in a separate terminal.

```sh
npm start -- --hostname 127.0.0.1 --port 3100
```

The audit resolves Lighthouse through the active npm's global package
root, verifies the package, Node.js engine compatibility and native CLI version,
and reuses that absolute CLI for both mobile and desktop profiles. A present but
invalid or incompatible global installation fails without a silent fallback.
When no global installation exists, the command checks the registry's latest
stable version and accepts the existing project-local Lighthouse only when its
version matches. A missing, outdated or incompatible fallback fails with an error;
the command does not install or update tools. Prepare any required local fallback
separately under the repository's installation controls.
With `--locked`, the fallback verifies the installed package against
`package-lock.json` without querying the registry. The flag retains global-first
selection and the Node.js and native CLI checks.
The command audits the homepage by default. To diagnose a specific public route,
pass its path, for example `npm run audit:lighthouse -- --route /lernen`.
It runs mobile and desktop profiles against the selected route and checks the
actual document status, including the native 404 and 500. Public pages report
Performance, Accessibility, Best Practices and SEO. Error documents report
Performance. The command saves homepage reports under `test-results/lighthouse/`
and other routes under `test-results/lighthouse/routes/`. Performance must exceed
95 points in both profiles.
The report output includes the browser version, throttling profile, CPU benchmark,
Largest Contentful Paint and Total Blocking Time. A missed budget also prints the
available LCP phases and up to five long tasks.

Each route and device profile is handled independently. A document-status or
Lighthouse/report error marks the affected profile failed, removes its stale or
partial report where possible, and allows the remaining profiles and routes to
run. A document-status failure applies to both profiles for that route. Low or
invalid scores retain their reports for inspection. Chromium closes after the audit. A failed profile or missed Performance budget
produces a nonzero exit code.

## Build and recovery

Run `npm run ci` before the final production build. It includes `npm run typecheck`,
which is also available as a targeted standalone check. The command uses
`scripts/generate-route-types.ts` to generate Next.js route types in a separate
temporary project for each invocation. It checks the repository's TypeScript
inputs against those generated types and then removes the temporary project.
The repository's `next-env.d.ts` and production build output stay available.

Do not substitute a direct `next typegen` invocation when preserving a verified
production build matters. Without the wrapper's isolated configuration, Next.js
loads the production-build configuration and can invalidate the existing CSP
success marker. `npm start` validates that marker before native `next start` and
refuses stale or missing build evidence; rebuild with `npm run build` if it was
invalidated.

`npm run build` invalidates any old CSP success marker, runs one native `next build`
and verifies the resulting manifest. The production build uses
`tsconfig.build.json` for application code, build configuration, CSP declarations
and generated Next.js types. It inherits the project compiler options. The
blocking `npm run typecheck` uses `tsconfig.typecheck.json` for application code,
tests and TypeScript tooling. It uses `tsconfig.build-tooling.json` to check the JavaScript
types in the Next.js configuration and hash-CSP build tooling, and
`tsconfig.cache-lifecycle.json` for the CommonJS cache runtime. `npm start` verifies
the manifest again before native `next start`. A failed or modified build cannot
reuse a previous manifest. Rebuild from source after changing the content,
runtime, lockfile or configuration.

Do not deploy generated `.next/` files separately from their matching source,
headers and assets. Rollbacks must keep that set together. Browser HTML freshness
is five minutes, so retain referenced hashed assets across releases.
