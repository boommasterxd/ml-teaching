# Deployment boundaries

## Prepared target

The intended host is Vercel and the intended canonical origin is
`https://mlteaching.boomapps.de`. `src/lib/site.ts` owns the public identity used by
metadata, robots, sitemap and llms.txt. This source migration does not establish DNS,
TLS, a Vercel project, domain ownership or a live deployment.

All work stays on `Codex/development-nextjs-ssg`. Do not merge to or push `main`,
activate an existing hosting integration, change DNS or publish without explicit
user authorization. Existing hosting can still react to `main`; keeping work on
the development branch is a release boundary.

## Native Vercel setup

After explicit provider setup authorization, verify the `boom-apps` team and create
or select the intended `ml-teaching` project. Inspect effective settings and active
GitHub protections before connecting a repository that can publish. Use native
Next.js detection with Node.js 26.x, install command `npm ci --no-audit`, and build
command `npm run build`. Do not override the native output directory. Use Frankfurt
(`fra1`) for any actually required compute in this database-free project; public
SSG does not need per-request rendering.

The CSP adapter composes the installed native provider adapter through an explicit
absolute `NEXT_ADAPTER_PATH` or `CSP_PROVIDER_ADAPTER`. A Vercel build without a
provider adapter fails closed. Never hardcode a global CLI installation or bypass
`npm run build` with direct `next build`. Verify actual provider hooks and output
before publication; local native output does not prove hosted adaptation.

`vercel.json` disables automatic Git deployments for all branches except `main`.
This source rule neither connects the repository nor authorizes publication from
`main`; provider setup and publication remain separate decisions. Automatic
feature-branch Previews are not part of this workflow. Manual Preview deployment
requires explicit authorization. Keep GitHub quality checks separate from native
Vercel publication; no Actions deploy workflow or token exists here. Do not set
repository duplicates of saved provider settings.

The prepared Ignore Build Step is `node scripts/ignore-build.ts`; it must be saved
in the intended provider project during authorized setup. The script compares
`VERCEL_GIT_PREVIOUS_SHA`, the last successful deployment for that project and
branch, with `VERCEL_GIT_COMMIT_SHA`, which must match the checked-out `HEAD`.
It skips only a verified, nonempty delta containing maintained Markdown, declared
test files, explicitly listed CI files or changes confined to the allowlisted
quality scripts in `package.json`. Runtime, build, dependency, engine and unknown
changes build. Missing history, divergent ancestry, malformed input, an empty diff
or any Git error also build. Git reads have a five-second timeout and a bounded
output buffer. Comparing the entire deployment gap preserves runtime changes from
skipped intermediate commits.

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
rules. Assess actual generated platform routes, bot management and method coverage
when provisioning, without introducing client fingerprinting or broad page/RSC
blocks. Do not add BotID solely because this is hosted on Vercel.

No application secrets are required. Never pull private environment values just to
verify setup. `.vercelignore` excludes local secrets and unnecessary development
content while keeping all native build/CSP inputs. Git delivery, CLI source uploads
and final deployed artifacts remain separate verification boundaries.

## Publication acceptance

Before an authorized release, verify saved settings, native adapter composition,
actual static deployment outputs, domain/TLS, delivered headers, canonical URLs,
RSC aliases and the browser consent/training flow on that exact deployment. Do not
infer these facts from a successful local build. Maintain the same HTML, hashes,
assets and headers during rollback, and retain assets for the configured five-minute
browser HTML freshness.
