# Deployment boundaries

## Production target

The `boom-apps/ml-teaching` Vercel project serves `https://mlteaching.boomapps.de`
and is connected to `boommasterxd/ml-teaching`. `src/lib/site.ts` owns the public
identity used by metadata, robots, sitemap and llms.txt. The legacy Coolify app
has automatic deployments disabled.

## Native Vercel setup

The project uses the native Next.js preset and output, Node.js 26.x,
`npm ci --no-audit` for installation, `npm run build` for builds and `npm run dev`
for development. The native build uses Next.js's default Turbopack chunking.
Function defaults use Fluid Compute in Frankfurt (`fra1`) with
Standard resources and a 20-second timeout. The public pages are prerendered at
build time.

The CSP adapter reads `CSP_PROVIDER_ADAPTER` first and uses `NEXT_ADAPTER_PATH`
if the first variable is unset or empty. The selected value must be an absolute
path to the installed native provider adapter. The module must default-export an
adapter with a callable `onBuildComplete` hook. The `modifyConfig` hook is optional.
A missing or invalid adapter stops the Vercel build. Correct an invalid
`CSP_PROVIDER_ADAPTER` value or unset it to use `NEXT_ADAPTER_PATH`.
Never hardcode a global CLI installation or bypass `npm run build` with direct
`next build`. Verify provider hooks and output on the hosted deployment before
publication.

Vercel evaluates commits from protected squash merges into `main` for native
Production builds. Its Production Git policy allows the connected repository.
In normal operation, Vercel assigns the Production domains after a successful build.
Commits skipped by the Ignore Build Step leave the current deployment in service.
`vercel.json` limits automatic deployments to `main`, and Preview accepts only CLI
and REST API deployments. Manual
Preview and Production deployments require explicit authorization. GitHub Actions
runs the required pull request checks, including the production dependency audit.
Vercel owns publication, and GitHub Actions has no deployment workflow or token.

The project uses `node scripts/ignore-build.ts` as its Ignore Build Step. The script
compares `VERCEL_GIT_PREVIOUS_SHA`, the last successful deployment for that project
and branch, with `VERCEL_GIT_COMMIT_SHA`, which must match the checked-out `HEAD`.
It skips a build only when the verified, nonempty diff contains changes exclusively
within these categories:

- Markdown files anywhere under `docs/`, plus the root `README.md` and `AGENTS.md`.
- `.ts`, `.tsx` and `.mjs` files under `test/unit/` or `test/e2e/`, plus `test/setup.ts`.
- CI and tooling paths listed explicitly in the [build filter](../scripts/ignore-build.ts).
- `package.json` changes confined to script names on the build filter's allowlist.

A change to `SECURITY.md`, a non-Markdown file under `docs/`, or any other path
outside the allowlist triggers a build, even in a mixed diff. Changes to runtime,
build, dependency or engine settings also trigger a build. Missing history,
divergent ancestry, malformed input, an empty diff or any Git error also build.
Git reads have a five-second timeout and a bounded output buffer. Comparing the
entire deployment gap preserves runtime changes from skipped intermediate commits.

Keep the native Git checkout metadata available to the Ignore Build Step. Vercel
already excludes local `.git` metadata from CLI uploads by default.

The command logs one fixed decision code prefixed with `[ignore-build]`.
The codes distinguish missing revisions, checkout or ancestry problems, failed
diff or manifest checks, and the classification of a valid diff. The diagnostic
omits revision values, changed paths and Git error output.

Intentional provider-setting changes require the provider's Ignore Build Step
bypass when manually redeploying. The source script does not establish a saved
Ignore Build Step or other active project settings; verify both before relying on
the filter.

## Authorized manual Preview

Use an authenticated Vercel CLI in the checkout already linked to this project.

1. Confirm that the authorization covers the source to upload and the Preview
   environment. Check the revision with `git rev-parse HEAD`, review local
   changes and check the upload file set against [`.vercelignore`](../.vercelignore).
   Record the reviewed revision and any local changes included in the upload.
2. Run `vercel project inspect --scope boom-apps --non-interactive` in the project
   root. Proceed only if it resolves to `boom-apps/ml-teaching`.
3. Upload the reviewed source with
   `vercel deploy --project ml-teaching --scope boom-apps --environment preview --non-interactive`.
4. Inspect the returned deployment URL with `vercel inspect` and confirm the
   project, Preview target and Ready status. Record the deployment ID and URL
   together with the reviewed upload inputs. Use an authenticated browser to
   check prerendered content, delivered headers and the consent flow on that URL.

## Security and data

The central Next.js header configuration owns HSTS with a one-year lifetime,
`includeSubDomains` and `preload`, plus MIME, referrer, frame and permissions headers.
CSP is generated separately from final static output. No Project Routing Rule should
supply a second HSTS owner. A regular Next.js rule permanently redirects
slash-terminated public paths to their canonical form and excludes internal
`/_next` paths. Vercel can apply the shared headers before this regular redirect.
The native Next.js HTTP server omits configured headers on redirects. Verify
the full HSTS policy on hosted HTTPS redirects and their canonical targets,
including every covered subdomain.

There are no application mutation endpoints, image-upload API, auth flows or shared
databases. Native image optimization must remain outside custom restrictive WAF
rules. Vercel Bot Protection uses `challenge` without a separate AI-bot rule. The
[bot protection decision](decisions/discovery-bot-protection.md) records the
accepted challenge across public routes for scripted clients and the required
access for normal visitors and intended crawlers. Vercel Authentication protects deployment URLs while the custom domain
serves the public app. Do not add BotID solely because this is hosted on Vercel.

No application secrets are required. Never pull private environment values just to
verify setup. `.vercelignore` excludes local secrets and unnecessary development
content while keeping all native build/CSP inputs. Git delivery, CLI source uploads
and final deployed artifacts remain separate verification boundaries.
The root `.codex-attachments/` directory is excluded from both Git and Vercel uploads.

## Publication acceptance

Verify saved settings before releasing. Once the deployment is Ready, verify that
the Production domain points to the intended commit. Check the native adapter,
prerendered output, HTTPS, delivered headers, canonical URLs, RSC delivery and the
browser consent/training flow on that deployment.

## Production recovery

For an authorized rollback, use Vercel [Instant Rollback](https://vercel.com/docs/instant-rollback)
to select an eligible, verified deployment that previously served the Production
domain. Confirm the deployment and its commit before switching traffic. Verify the
Production domain serves the selected build and repeat the publication checks on it.
Use the complete deployment so HTML, CSP hashes, headers and assets come from the
same build. Retain referenced assets for the five-minute browser HTML freshness window.

Instant Rollback pauses automatic Production domain assignment. New builds from
`main` can finish without replacing the restored version. After verifying a fixed
Production deployment and obtaining release authorization, promote it in Vercel
or with [`vercel promote`](https://vercel.com/docs/cli/promote). Promotion restores
automatic assignment. Confirm the Production domain points to the promoted commit
and repeat the publication checks.
