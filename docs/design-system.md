# Design system

## Foundation

Neural Field uses red primary actions, warm ivory light surfaces and graphite dark
surfaces for the German educational interface. Local Space Grotesk defines display
headings; local Geist defines interface text. `src/lib/fonts.ts` loads the two
Latin WOFF2 assets through `next/font/local`, without a remote font request. Colors,
theme pairs, typography, shared site/legal roles and media surfaces live in
`src/index.css`; action variants live in `src/components/button-variants.ts`.
`src/components/hero/hero.css` extends these tokens for the landing composition.
The original geometric ML SVG mark, SVG favicon and PNG Apple icon share the brand.

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
feature, explanation and open variants preserve their different content roles.
Process steps and everyday examples use open cards; technique and data-quality
guidance use boxed cards. Badges
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
Hero CSS uses the same Tailwind `lg` and `max-sm` variants; parallax depth comes
from a central CSS custom property rather than a separate JavaScript breakpoint.

The persistent SiteHeader contains the shared brand, learning action and theme
control. ThemeProvider and the shared header/footer sit outside the route
ViewTransition. Theme changes update the root appearance without remounting the
learning workspace. The training pipeline is an ordered readiness list, not route
navigation; panel, modal, gallery and video states reuse shared theme/media tokens.

Dialogs have constrained viewport height and scrollable content. Radix owns
focus trapping, Escape and inertness; react-remove-scroll owns scroll containment. Controlled dialog return
focus handles the absence of a trigger and avoids stealing focus from a following
consent/loading dialog. Immediate focus and status semantics never wait for motion.
Buttons share disabled, keyboard and touch behavior. Error messages, empty data,
loading state and deletion confirmations stay explicit.

## Theme and optional interfaces

The default follows the operating system. Light, dark and system selections remain
temporary unless the user explicitly enables remembering for future visits. Only
the enum selection is stored under `ml-teaching-theme`; ML consent and training
data are independent. System changes, storage events and invalid values never
write defaults. Blocked reads fall back to the system; failed writes or deletion
produce an honest status message. The trusted build-known bootstrap and the
upstream ThemeToggler wipe style are rendered in static HTML for exact CSP hashing.
The public theme-wipe callbacks are serialized so the latest selection wins.

The lightweight switch and menu trigger remain available initially. Pointer/focus
intent prepares one deduplicated, retryable ThemeMenu module; the supported public
portal mounts its content only when opened. No hidden portal prerender is assumed.
Initial learning consent remains eager. Closed camera, confirmation and image
preview wrappers are small element trees with no unique heavy dependency or active
effect/subscription; their shared UI is already required by consent and galleries.
TensorFlow and model imports remain consent-gated and are never prepared on intent.

## Motion ownership

- React 19.3 ViewTransition owns same-document route continuity. Shared shell and
  footer remain outside the content boundary. Reduced-motion CSS removes snapshot
  animations; unsupported browsers retain normal navigation. The consent-withdrawal
  link deliberately reloads the document to discard the in-memory workspace. It
  does not opt into cross-document snapshots of training images or predictions.
  Concurrent theme, menu and route updates can supersede a pending native snapshot.
  React may skip that visual transition to preserve synchronous interaction; do not
  delay navigation or focus to serialize decorative work.
- The hero adapts the official Animate UI Topography WebGL renderer in a bounded
  decorative surface capped at 1.5 device pixels per CSS pixel. Motion owns its
  frame, pointer hill, bounded ripples and two
  transform-only parallax layers. A static server-rendered contour poster remains
  until the first successful draw and returns on reduced motion, hidden or offscreen
  state, unsupported WebGL or context loss. These states unmount the enhancement
  and dispose its renderer. Explicit pause instead retains the current GPU image,
  stops frame, pointer-spring and ripple playback, and freezes parallax. Resuming
  continues the same animation time; theme or resize changes can redraw the paused
  image without advancing time. No CPU animation fallback runs. The scene performs
  no ML inference or external data request.
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
  The server-rendered preview and active demo share `NeuralNetFrame` for their
  dark surface, input row, diagram and action row, keeping following content stable
  during activation.
  Pointer/focus intent prepares the deduplicated optional demo module and React
  Activity's hidden render; effects and focus activate only after the explicit
  start action. Below-fold reveals use the shared official Effect composition;
  primary headings and actions remain visible in static HTML.
- The gallery virtualizer owns placement. Scroll admission does not replay entry
  effects. The network is bounded to 18 nodes and 72 edges in one small surface,
  so culling or virtualization would not reduce meaningful offscreen work.

Old node-glow CSS and custom focus/scroll-lock implementations are removed. Avoid
competing CSS transitions on properties already owned by Animate UI.

## Explicit integration boundaries

The official animated Lucide catalog lacks the existing Brain, Car, Cat, Dog,
ImagePlus, Square, Stethoscope and SwitchCamera producers. Their original Lucide
geometry lives in `src/components/animated-icon-glyphs.ts`;
`src/components/animated-icon-fallbacks.tsx` composes the public Animate UI
IconWrapper, context, variants and Motion SVG APIs. They receive the same
whole-control interaction, tempo and reduced-motion behavior. They retain static
matching glyphs only in the server/hydration snapshot. Both handwritten adapter
files remain inside all application quality gates. Other matching icons use
official generated variants from `src/components/animate-ui/icons/`.
`src/components/animated-sun.tsx` maps a data array of the original eight rays
instead of copying their markup, preserving geometry and animation. This adapted
producer remains outside vendor exclusions, with no additional size exception.

Generated registry scaffolding is vendor code. Duplication scanning excludes only
that directory; application code retains the five-percent threshold. The unchanged
Smartphone generator function has a narrow function-length exception. Other lint,
source-size, dependency-security and browser controls remain active. Unused public
registry exports are removed rather than silencing application dead-code checks.

The original SiteLogo is an inline SVG using shared theme colors. The SVG favicon
and PNG Apple icon use the icon-format exception. Camera captures and locally
selected images are already bounded data URLs and use unoptimized Next
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

The initial consent uses the shared Dialog's `initialContent` variant: public native
`RadixDialog.Content` renders inline in SSG and retains the same dialog node through
hydration. Radix owns focus, modality and dismissal; the existing RemoveScroll
composition owns scrolling. Already visible initial content has no entrance replay.
Animate UI 2.4.6's Content always supplies hidden initial motion targets and its
Effect emits an initial style even with `initial={false}`. The native content and
static scrim are the scoped initial-content integration; later openings retain
Animate UI entry. Checkbox and Switch render matching style-free button semantics
for the server/hydration snapshot, then use their Animate UI Radix primitives;
Radix's initial form assumption otherwise emits inline-styled BubbleInputs.
The controls retain replayed selections and transfer focus during the primitive
upgrade only when the retired control held focus and no other control has taken it.
React schedules the Switch upgrade without blocking the initial input replay.

Later-opening product dialogs use public native `RadixDialog.Portal` as mount owner.
The installed Animate UI 2.4.6 Portal retains modal `hideOthers` semantics until
exit completes and exposes no public early-release API. Native portal unmounting
releases modality immediately on close and permits focus restoration; Animate UI
still owns entry. Content and backdrop therefore have no closing exit animation
in this scoped compatibility fallback. No vendor fork, DOM-unhiding workaround or
cleanup timer implements it.

[Third-party notices](third-party-notices.md) preserve upstream license conditions.
