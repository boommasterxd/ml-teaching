# Static generation and strict CSP

## Decision

The five public routes `/`, `/lernen`, `/impressum`, `/datenschutz` and
`/barrierefreiheit` contain request-independent content and use complete SSG.
Static errors `/404` and `/500` are protected too. Metadata routes and the social
image use native build-time conventions. Production has no ISR, PPR, private SSR
or CSP-only Proxy. Learning interactivity does not require request-time rendering:
models, camera images and classifier state belong only to the browser.

Development uses `src/proxy.dev.ts` for nonce-based CSP Report-Only diagnostics
and private/no-store responses. Native `pageExtensions` configuration discovers it
only during the development-server phase. Production retains standard extensions,
complete SSG and enforced hash CSP without a Proxy or root request dependencies.

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
selected only from the actual deployment environment.

The runtime modules preserve the template's behavior. Project adaptations are the
five public route selections, actual static error UI, app-specific image and model
origins, local data-image sources and central security headers. No unsafe inline or
eval directives are introduced. Model weights require only connect access to the
specific Google/TF Hub/Kaggle origins. WebGL is selected, so no speculative WASM
script permission or worker source is added.

Public HTML has `public, max-age=300, must-revalidate`. Five minutes balances
browser reuse with content freshness; native RSC/error/variant behavior remains
under its own owner. Keep referenced assets available across that interval and
rebuild HTML and CSP atomically for content or legal updates.

## Navigation and UI compatibility

Native Next links and React ViewTransition preserve same-document navigation.
Per-page inline bootstrap/JSON-LD hashes do not become permission for arbitrary
injected scripts. Destination RSC responses do not replace the current document's
CSP. All pages share the trusted runtime/script producers; browser verification
must cover direct entry, in-app legal/learning navigation and back/forward.

SiteLogo uses native getImageProps and omits its initial placeholder style to avoid
a forbidden attribute while preserving native optimization. Local user images remain in the
browser and bypass server optimization. Animate UI runtime styles and generated
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
