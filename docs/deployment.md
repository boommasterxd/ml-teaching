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
Vercel automatically assigns the Production domains after a successful build.
Commits skipped by the Ignore Build Step leave the current deployment in service.
`vercel.json` limits automatic deployments to `main`, and Preview accepts only CLI
and REST API deployments. Manual
Preview and Production deployments require explicit authorization. GitHub Actions
runs the required pull request checks, including the production dependency audit.
Vercel owns publication, and GitHub Actions has no deployment workflow or token.

The project uses `node scripts/ignore-build.ts` as its Ignore Build Step. The script compares
`VERCEL_GIT_PREVIOUS_SHA`, the last successful deployment for that project and
branch, with `VERCEL_GIT_COMMIT_SHA`, which must match the checked-out `HEAD`.
It skips only a verified, nonempty delta containing maintained Markdown, declared
test files, explicitly listed CI files or changes confined to the allowlisted
quality scripts in `package.json`. Runtime, build, dependency, engine and unknown
changes build. Missing history, divergent ancestry, malformed input, an empty diff
or any Git error also build. Git reads have a five-second timeout and a bounded
output buffer. Comparing the entire deployment gap preserves runtime changes from
skipped intermediate commits.

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

## Security and data

The central Next.js header configuration owns HSTS with a one-year lifetime,
`includeSubDomains` and `preload`, plus MIME, referrer, frame and permissions headers.
CSP is generated separately from final static output. No Project Routing Rule should
supply a second HSTS owner. Hosted HTTPS delivery and every covered subdomain must
be verified before declaring HSTS readiness; this source does not enroll a preload
list or prove live headers.

There are no application mutation endpoints, image-upload API, auth flows or shared
databases. Native image optimization must remain outside custom restrictive WAF
rules. Vercel Bot Protection uses `challenge`. AI bots remain subject to general
bot protection without an additional AI-bot rule. Vercel Authentication protects
deployment URLs while the custom domain serves the public app. Do not add BotID
solely because this is hosted on Vercel.

No application secrets are required. Never pull private environment values just to
verify setup. `.vercelignore` excludes local secrets and unnecessary development
content while keeping all native build/CSP inputs. Git delivery, CLI source uploads
and final deployed artifacts remain separate verification boundaries.
The root `.codex-attachments/` directory is excluded from both Git and Vercel uploads.

## Publication acceptance

Verify saved settings before releasing. Once the deployment is Ready, verify that
the Production domain points to the intended commit. Check the native adapter,
prerendered output, HTTPS, delivered headers, canonical URLs, RSC delivery and the
browser consent/training flow on that deployment. Keep HTML, hashes, assets and
headers from the same build during rollback, and retain assets for the configured
five-minute browser HTML freshness.
