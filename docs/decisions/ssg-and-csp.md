# Static generation and strict CSP

## Decision

All public routes contain request-independent content and use complete SSG: the
homepage, the `/lernen` selection, the explanation/practice pairs under
`/lernen/bilderkennung` and `/lernen/q-learning`, and the three legal pages.
The pending Q-learning lesson and practice routes both use `noindex, follow` metadata.
Static errors `/404` and `/500` are protected too. Metadata routes and the social
image use native build-time conventions. Production has no ISR, PPR, private SSR
or CSP-only Proxy. Learning interactivity does not require request-time rendering:
models, camera images and classifier state belong only to the browser.

Development uses `src/proxy.dev.ts` for nonce-based CSP Report-Only diagnostics
and `no-store` document delivery. Native `pageExtensions` configuration discovers it
only during the development-server phase. Production retains standard extensions,
complete SSG and enforced hash CSP without a Proxy or root request dependencies.
The shared nonce policy builder also validates exact hashes supplied by the
development Proxy for the trusted theme bootstrap, transition styles and error-page
speculation rules. Application hashes come from the same constants as their rendered
output. The development hash for the installed Animate UI ThemeToggler stylesheet
is reviewed separately and checked against the rendered primitive when it changes.
Production authorization stays bound to the final build output.

`csp.config.mjs` enumerates the complete canonical route inventory. Adding,
renaming, removing or changing a page's rendering mode must update that inventory
in the same change. The static error bridge owns generated error copies; do not
expose ordinary screen files through the Pages Router.

## Build integration and provenance

The build tooling is adopted from the installed **Next.js plugin 1.9.5**, template
`templates/ssg-hash-csp/`. It has no independent template version. Its `csp/`
directory is copied to the repository root, including adapter composition, HTML
parser, policy, artifact binding, error-copy bridge, browser freshness and build
lifecycle modules. `parse5` uses the template's declared 8.1.1 dependency.

`next.config.mjs` wires the documented native adapter hook. Package lifecycle hooks
invalidate the previous marker before one native build and verify fresh output
afterward; native startup verifies it again. Referenced external scripts receive
SRI, inline trusted scripts/styles receive exact hashes, and the manifest binds
content, configuration, build ID and actual framework version. Unsupported or stale
artifacts fail closed. No framework version allowlist blocks normal compatible
updates. The project uses Next.js 16.4.6 and React 19.3.1; a provider adapter is
selected only from the actual deployment environment. The local adapter requires
the configured provider module to export an adapter with a callable
`onBuildComplete` hook. The provider's `modifyConfig` hook is optional.

Project adaptations include the public route selections, static error UI,
app-specific image and model origins, local data-image sources and central security
headers. The adapter also uses the native routing rules as the single CSP source
for regular static responses in builds without a provider adapter. Next.js appends
prerender metadata headers to routing headers. In native builds without a
provider adapter, the routing fallback also supplies the single CSP for unknown
URLs served by the verified `_not-found` copy. This strict policy includes the
trusted hashes from both static error documents. The adapter validates and binds
the native copy's HTML and metadata to the build manifest without adding a second
CSP header. Explicit error outputs and composed provider builds retain the
template's header persistence. The fallback route's source pattern excludes
native static assets. Next.js compiles the source at startup, so the manifest
regex carries the same exclusion for adapters that consume it directly.
Model weights require only connect access to the specific Google/TF Hub/Kaggle
origins. The decorative WebGL renderer permits the bundled same-origin worker
through `worker-src 'self'`. It needs no blob or remote worker source and no WASM
script permission.

Public HTML has `public, max-age=300, must-revalidate`. The explicit local `/404`
HTML response instead uses `Cache-Control: no-store`; the rule excludes RSC
requests. Five minutes balances browser reuse with content freshness; other native RSC/error/variant behavior remains
under its own owner. Keep referenced assets available across that interval and
rebuild HTML and CSP atomically for content or legal updates.

## Navigation and UI compatibility

Native Next links and React ViewTransition preserve same-document navigation.
Per-page inline bootstrap/JSON-LD hashes do not become permission for arbitrary
injected scripts. Destination RSC responses do not replace the current document's
CSP. All pages share the trusted runtime/script producers; browser verification
must cover direct entry, in-app legal/learning navigation and back/forward.

The static image-practice document includes its full initial consent. On
same-document reentry, the training provider restores the optional remembered
choice from document memory before paint. The 30-minute deadline governs reentry.
An active training visit can continue past that deadline. Leaving the document
clears the choice and workspace, including before the browser caches the document
for back or forward navigation. A reload or new document starts with fresh consent.
Training links complete setup on the source page before the native Flow transition.

SiteLogo reuses the shared animated Brain glyph; favicon and Apple
assets use the icon-format exception. Local user images remain in the browser and
bypass server optimization. The trusted, build-known theme bootstrap is included in
static output so its exact bytes receive a CSP hash. The Animate UI ThemeToggler
also emits its constant snapshot stylesheet in every static document, including
the native error document, so the same build hashes it. Its wipe runs only on a
user-initiated color change. No user-supplied script or style is authorized. Animate UI runtime styles and generated
icon/illustration markup must pass the same policy; library origin never permits
relaxing CSP. Document concrete supported integration boundaries in the
[design system](../design-system.md).

## Trade-offs and residual boundaries

Static pages update on a new build. There is no runtime content freshness promise
or server persistence. Strict hashing requires exact output verification; newer
framework/provider output shapes must pass real build/runtime checks. A local
server does not establish Vercel CDN headers, Function execution, provider bundle
contents, domain readiness or cost savings. These need the separately authorized
[deployment workflow](../deployment.md).
