# Design system

## Foundation

The interface keeps the existing German educational brief: zinc surfaces, red
landing-page calls to action, indigo learning actions, rounded cards, restrained
shadows and a system sans-serif font. It has one light theme. Colors and shared
component roles live in `src/index.css`; variants live in
`src/components/button-variants.ts`.

The selected foundation is Tailwind CSS 4, shadcn/ui's Radix/new-york structure and
Animate UI 2.4. `components.json` is the component/alias source of truth.
`src/components/ui/` contains shared catalog-backed wrappers, with the preserved
product variants. `Button`, `Dialog`, `ModalContent` and `PageHeader` retain the
product interfaces. Use shared controls rather than new copies of native controls.
Native markup inside catalog recipes, semantic content and Next.js navigation
links remain appropriate.

Shared Alert, Empty, Card, Badge, Field, Label and Separator wrappers own recurring
feedback, grouping and form semantics. Landing and training cards compose the same
CardHeader, CardTitle, CardContent and CardIcon recipes; explicit classification,
feature and explanation variants preserve their different content roles. Badges
cover counts, warnings, success and numbered steps. Consent groups and class-name
editors reuse FieldSet/Legend/Group/Label/Error as applicable, with shared Input
and DialogTitle variants. Semantic color and state tokens remain in `src/index.css`.
Neural demonstration actions use the shared demonstration size and variant, with
`data-signal`, `data-active` and `data-muted` selecting central diagram tokens.
Static and interactive controls share this composition.

Official project-local Codex guidance lives in `.agents/skills/shadcn/` and
`.agents/skills/animate-ui/`, installed from `shadcn/ui` (canonical upstream
`shadcn-ui/ui`) and `imskyleen/animate-ui`. `skills-lock.json` records provenance.
The local `shadcn`, `animate-ui` and `skills` executables provide discovery/audits;
do not install a second UI foundation.

## Layout and interaction

Tailwind's shared `sm`, `md` and `lg` breakpoints own responsive layouts. The
learning page changes to a seven/five-column workspace at `lg`; cards and legal
content keep the existing max-width containers. Thumbnail grouping reads the CSS custom property set by the same Tailwind
breakpoint variants; JavaScript has no independently duplicated breakpoint values.

Dialogs have constrained viewport height and scrollable content. Radix owns
focus trapping, Escape and inertness; react-remove-scroll owns scroll containment. Controlled dialog return
focus handles the absence of a trigger and avoids stealing focus from a following
consent/loading dialog. Immediate focus and status semantics never wait for motion.
Buttons share disabled, keyboard and touch behavior. Error messages, empty data,
loading state and deletion confirmations stay explicit.

## Motion ownership

- React 19.3 ViewTransition owns same-document route continuity. Shared shell and
  footer remain outside the content boundary. Reduced-motion CSS removes snapshot
  animations; unsupported browsers retain normal navigation.
- Animate UI owns action presses, dialog entry, checkbox indicators, progress and
  icon interaction. Shared `ActionFeedback` composes whole-control hover, tap and
  keyboard-focus icon triggers for Button and native Next.js `AnimatedLink`
  anchors. Disabled buttons suppress these triggers. Landing calls to action,
  the not-found action and page-header navigation use the shared link wrapper;
  ordinary footer text links retain native text-link behavior.
- The shared animated-list recipe owns class insertion, removal and positional
  reflow, using stable class IDs, reduced-motion configuration and hydration-safe
  initial markup. Exiting classes become inert and hidden from assistive technology
  immediately; focus moves to a remaining neighbor or the workspace heading.
  Supported `AnimatePresence mode="sync"` retains the fading exit in document flow,
  then Motion's `layout="position"` reflows the remaining classes. Motion 14.9.1's
  `popLayout` requires a runtime-injected empty style element, which the strict SSG
  hash CSP forbids. Sync presence preserves one motion owner without adding an
  empty-style hash, nonce, custom geometry engine or relaxed policy.
- The neural-network illustration uses Animate UI Effect and Presence. Its fixed
  pedagogical sequence selects logical layers; supported effects interpolate the
  visual properties. The domain timers do not interpolate geometry or retain exits.
- The gallery virtualizer owns placement. Scroll admission does not replay entry
  effects. The network is bounded to 18 nodes and 72 edges in one small surface,
  so culling or virtualization would not reduce meaningful offscreen work.

Old node-glow CSS and custom focus/scroll-lock implementations are removed. Avoid
competing CSS transitions on properties already owned by Animate UI.

## Explicit integration boundaries

The official animated Lucide catalog lacks the existing Brain, Car, Cat, Dog,
ImagePlus, Square, Stethoscope and SwitchCamera glyphs. They remain static Lucide
fallbacks through `src/components/icons.tsx`; do not replace their meanings with
unrelated symbols. Other matching icons use the official generated Animate UI
variants from `src/components/animate-ui/icons/`.

Generated registry scaffolding is vendor code. Duplication scanning excludes only
that directory; application code retains the five-percent threshold. The unchanged
Smartphone generator function has a narrow function-length exception. Other lint,
source-size, dependency-security and browser controls remain active. Unused public
registry exports are removed rather than silencing application dead-code checks.

Native Next getImageProps serves the small WebP logo with AVIF-first/WebP negotiation.
The shared SiteLogo omits its unnecessary initial transparent-color style so generated
static HTML remains compatible with `style-src-attr 'none'`. Camera captures and
locally selected images are already bounded data URLs and use unoptimized Next
Image; sending those private bytes to a server optimizer would violate the local
processing contract. Static social previews use Next's build-time image convention
and have the metadata-source format exception.

Animated icons initially emit Motion style attributes, which conflict with the
static HTML policy. Their shared hydration boundary renders the same static Lucide
glyphs and dimensions on the server, then uses the official Animate UI variants
after hydration. The neural illustration similarly preserves all 18 nodes, 72
edges and layer labels in static SVG before enabling its interactive component.
These are explicit integrations for the installed Animate UI 2.4.6 and Motion
14.9.1 producers, not permission to omit primary content or relax the CSP.

Shared `ActionFeedback` keeps AnimateIcon in a layout-neutral `display: contents`
parent and places ButtonPrimitive's press Slot directly on the native button or
navigation anchor.
`initial={false}` omits Motion's initial style from static HTML. After hydration,
the public style prop provides the explicit `transform: scale(1)` rest state;
the server snapshot omits it. This gives pressing and cancellation a truthful
return target instead of deriving `scale(0)` from the CSS value `none`. The same
Motion owner handles press and release; reduced motion disables the gesture.

Radix's overlay injects a viewport-dependent react-remove-scroll-bar stylesheet.
The shared dialog therefore composes Radix's modal Content with Animate UI Effect
for the separate background and the public react-remove-scroll API with
`removeScrollBar={false}` and `inert={false}`. This preserves supported wheel/touch
containment, pinch zoom and focus semantics without authorizing dynamic styles or
adding a custom scroll engine. The native scrollbar remains visible and does not
cause a layout shift. There is no second overlay animation owner.
The backdrop uses a translucent scrim without fullscreen backdrop filtering to
bound compositor work; Animate UI retains the fade and content animation.

The product Dialog uses the public native `RadixDialog.Portal` as its mount owner.
The installed Animate UI 2.4.6 Portal retains modal `hideOthers` semantics until
exit completes and exposes no public early-release API. Native portal unmounting
releases modality immediately on close and permits focus restoration; Animate UI
still owns entry. Content and backdrop therefore have no closing exit animation
in this scoped compatibility fallback. No vendor fork, DOM-unhiding workaround or
cleanup timer implements it.

[Third-party notices](third-party-notices.md) preserve upstream license conditions.
