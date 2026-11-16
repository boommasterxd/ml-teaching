# Design system

## Foundation

Redline uses red primary actions, neutral light surfaces and near-black dark
surfaces for the German educational interface. Local Geist defines both headings
and interface text. `src/lib/fonts.ts` loads its Latin WOFF2 asset through
`next/font/local`, without a remote font request. Colors,
theme pairs, typography, shared site/legal roles and media surfaces live in
`src/index.css`; action variants live in `src/components/button-variants.ts`.
Font-role aliases also resolve on `.app-body`, where `next/font` exposes the local
font variable; resolving that body-scoped variable only on `:root` would fall back
to the browser's inherited font.
`src/components/hero/hero.css` extends these tokens for the landing composition.
The shared Lucide Brain glyph defines the brand. Its red stroke follows the theme;
the SVG favicon has light/dark variants and the PNG Apple icon uses the same glyph.

The selected foundation is Tailwind CSS 4, shadcn/ui's Radix/new-york structure and
Animate UI 2.4. `components.json` is the component/alias source of truth.
`src/components/ui/` contains the official component geometry and standard variants.
`Button`, `Dialog`, `ModalContent` and `PageHeader` retain shared product interfaces.
Use shared controls rather than new copies of native controls.
Native markup inside catalog recipes, semantic content and Next.js navigation
links remain appropriate.

Shared Alert, Empty, Card, Badge, Field, Label and Separator wrappers own recurring
feedback, grouping and form semantics. Landing and training cards compose the same
CardHeader, CardTitle, CardContent, CardAction and CardFooter parts. Do not recreate
feature, explanation or open Card variants. The everyday quiz composes standard
Cards, whole-card answer Buttons and contextual Alerts; notices use Alert. Badges use default, secondary, outline and
destructive variants for their roles. Consent groups and class-name
editors reuse FieldSet/Legend/Group/Label/Error as applicable, with shared Input
and DialogTitle variants. Semantic color and state tokens remain in `src/index.css`.
FieldLabel keeps descendant links underlined, including the required consent links,
so they remain distinguishable without relying on color.
Switch and Checkbox compose the installed public Radix Provider/Trigger parts
through Animate UI so their interactive DOM node remains stable across hydration.
Their optional indicator and form bridge use a shared client hydration snapshot;
no transition replaces a pending input target. The inline-styled native BubbleInput
is omitted from server HTML and mounted only for named, required or form-associated
client controls. Current appearance and consent controls have no form submission.
A shared imperative ref bridge preserves forwarded-ref cleanup without restoring focus.
The public parts omit the Root-only thumb press stretch; thumb sliding and shared
control press feedback remain. Add an explicit name or form association before
reusing these controls for native form submission.
Dropdown menu items retain full opacity while Animate UI staggers their translation
and blur. The installed primitive exposes no item-opacity option, so the shared
content wrapper fixes enabled-item opacity with an important utility to preserve
text contrast during entry. Disabled items retain their separate opacity state.
`LearningCard` composes the standard CardHeader, CardTitle, CardAction and
CardDescription for the three introductory steps. The badge aligns with the title row;
the description follows within the same header grid. The landing page varies its
reading rhythm: the technique section pairs an editorial introduction with an open
ItemGroup, training tips use numbered Item rows on a muted full-width band, and
everyday examples form a quiz grid. Plain section labels replace repeated
Badges in the later sections. The final action starts directly with its heading.
Technique columns use equal widths at the shared `lg` breakpoint. The introduction
and two-row ItemGroup stretch to the same height, with their text starting and ending
at aligned edges. Below `lg`, they stack at their natural content height.
Training-tip headings keep their introduction below the title at every width.
Each tip's counter, icon and title share one centered flex row. Descriptions move
beside that row at `md` and align on its center; below it they stack naturally.
The everyday quiz presents six required build-time choices in one column, two at
`md` and three at `lg`. Each is a one-shot answer action, not a persistent toggle
or submitted questionnaire. The official Questionnaire/ToggleGroup catalogs own
multi-step forms and switchable selections; ordinary Buttons fit this reveal flow.
Each Card's initial surface has one overlaid native Button using the central
`quiz-card` variant and size, with a matching animated
icon and a stable accessible answer name. There is no separate visible answer button.
The shared minimum surface height aligns the choices. Answers never expand the card;
title and icon positions remain anchored at its top.
The lightweight local answer state remains with the required triggers; closed
explanations and their motion mount only on activation. No separate import or
preparation controller is warranted for six fixed choices and a bounded state set.
A shared result component mounts an Animate UI Effect dimmer and a plain green Check
or red X, without an additional circle or inline explanation. Its `quiz-result`
Button opens the standard shared shadcn Tooltip with Animate UI primitives on hover,
focus or tap. Escape, blur and outside interaction dismiss the explanation. Tooltip
content mounts on demand and respects available viewport width.
The result glyph combines the Card's existing AnimateIcon context with its own
Button context: entering any part of the card starts the icon animation, while
keyboard focus and pressing the result control retain the same feedback. Moving
from the card to its result icon does not restart the active animation. The Tooltip
remains tied to the result Button.
The shared Tooltip
retains Animate UI's scale spring with instantaneous opacity to preserve text contrast.
Its portal surface uses presence to become inert and hidden from assistive technology
as soon as an exit begins; Animate UI retains ownership of visual exit and cleanup.
The `success-on-scrim` and `destructive-on-scrim` colors keep the unframed result
icons visible over the dimmed surface in either theme.
The dimmed copy is hidden from the accessibility tree; the original answer Button
retains its name and focus. Decorative preference remounts stay below the stable
Tooltip trigger so changing reduced motion preserves its focus. Reduced motion
shows the result immediately. Presence owns dimmer exit on reset; departing result
controls become inert and their Tooltip closes immediately. One persistent
polite status region announces
each answer. Answers and score remain in memory; the quiz sends no answers and
writes no browser storage.
Footer withdrawal keeps its full-document behavior in a centered row below the brand
and local-processing explanation.
Badge icons inherit the surrounding Card or control's AnimateIcon context instead
of introducing a nested provider that would restrict their hover trigger to the badge.
Destructive Buttons and Badges use the theme's foreground/background pair without
the upstream translucent dark fill, keeping text contrast in rest and hover states.
Neural demonstration actions use standard outline/default Buttons and the large
size. Static and interactive controls share the same Card and input-row geometry.
The gallery alone retains a thumbnail Button variant for image preview/selection;
it preserves asset framing and virtualized keyboard focus rather than restyling
ordinary actions. Typography composes the official h1/h2/h3/h4, paragraph, lead and
muted recipes in `ui/typography.tsx`; the hero has an explicit large display role.
Legal pages apply the same heading recipes to controlled semantic HTML.

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
SiteBrand is a small client boundary so Animate UI's press Slot receives a concrete
Link element. Passing the server-produced Link through that Slot can resolve to an
opaque child during development and omit the brand. Header and Footer remain server
compositions; header actions keep their logical end alignment independently.

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
The favicon link precedes the trusted bootstrap in both document owners. Bootstrap
and `applyTheme` select its resolved light/dark asset without another subscription
or storage entry; the default SVG also follows the OS color scheme. An explicit
theme wipe updates the favicon when its existing completion applies the theme.

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
  During the Animate UI theme wipe, only the theme Switch receives a separate
  named live capture. Its old capture is transparent and its group has no independent
  animation, so the existing Animate UI thumb spring remains visible immediately
  in both directions. The same Radix control, thumb spring and hydration/focus
  bridge remain in place. Native document capture continues to intercept pointer
  clicks during the wipe; keyboard selection and state updates remain immediate.
  Ordinary route transitions retain their existing owner.
- The hero adapts the official Animate UI Topography WebGL renderer in a bounded
  full-width surface behind the hero content. A two-pass renderer computes the
  noise field at approximately one texel per four CSS pixels, capped at 600,000
  field texels. A separate antialiased contour pass uses up to 1.5 device pixels
  per CSS pixel, capped at 8,294,400 raster pixels and the GPU's dimension limits.
  This keeps expensive noise work separate from line sharpness on 4K and ultrawide
  displays. The intermediate RGBA8 texture preserves a packed 16-bit scalar field;
  interpolation decodes samples before blending to avoid color-byte boundaries.
  Textures are reused between frames and resized only when required. Motion owns its
  frame, pointer hill, bounded ripples and two
  transform-only parallax layers. A static server-rendered contour poster remains
  until the first successful draw and returns on reduced motion, hidden or offscreen
  state, unsupported WebGL or context loss. These states unmount the enhancement
  and dispose its renderer. Explicit pause instead retains the current GPU image,
  stops frame, pointer-spring and ripple playback, and freezes parallax. Resuming
  continues the same animation time; theme or resize changes can redraw the paused
  image without advancing time. No CPU animation fallback runs. The scene performs
  no ML inference or external data request.
  A static contrast veil protects the headline and controls; passive pointer input
  stays inside the hero and never captures scrolling or interactive targets. Text
  selection is disabled only within the hero so repeated background gestures do not
  select its copy; the remaining page retains native text selection.
  The headline uses the official HighlightText effect while keeping its entire
  required text visible in static HTML.
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
- The educational illustration has four ordered stages: an Input placeholder replaced by a 112px image after selection,
  labeled conceptual feature maps, a nearest-neighbor diagram and a separate vote
  readout. Animate UI Shine scans the selected example; Effect reveals edges,
  patterns and a feature vector, draws neighbor connections and introduces the result.
  The three nearest synthetic points determine both highlighted neighbors and the
  shared Progress vote bars. No invented confidence percentage is shown.
  Domain timers select nine finite stages rather than interpolating geometry. Sequence identities
  restart only the decorative surfaces, preserving genuine Buttons and focus.
  Reduced motion omits the scan and traveling pulse and changes feature states
  without interpolation. The same `NetworkScene` reserves geometry in the SSG
  preview and deferred animation. Below `lg`, the four steps form a vertical sequence
  with full labels and captions. Desktop uses four columns. Connectors are clipped
  inside reserved gaps, outside all labels and readouts.
  Pointer, focus and touch intent warm the optional module and selected image;
  a hidden React Activity prepares the visual tree. The sequence starts after
  image decoding and visible commit. Image failures and the eight-second deadline
  offer explicit retry. No real inference or user-image processing occurs here.
  A full-width shared Alert result variant presents the recognized class and its
  neighbor-vote explanation, with a larger animated animal icon. The painted alert
  owns its hover/tap icon triggers; the outer status region owns the polite
  announcement. Reserved footer height keeps normal replay states stable.
  Result feedback enters by position without fading its text/background contrast.
  Effect owns entry separately; dedicated hover/tap icon triggers keep the first
  interaction independent of entrance playback.
  Below-fold reveals use the shared official Effect composition;
  Effect retains its own measured element so display-contents icon wrappers never
  become the visibility observer's target.
  Primary headings and actions remain visible in static HTML.
- The gallery virtualizer owns placement. Scroll admission does not replay entry
  effects. The illustration is bounded to two 6-by-6 feature maps, six vector bars,
  18 synthetic points, three neighbor connections and two readout bars. Finite user-triggered sequences
  need no virtualizer, continuous rendering loop or scene engine.

Old node-glow CSS and custom focus/scroll-lock implementations are removed. Avoid
competing CSS transitions on properties already owned by Animate UI.

## Explicit integration boundaries

The MobileNet feature maps and KNN neighborhood are explanatory SVG illustrations,
not measured model activations or an interactive statistical chart. The official
[Chart catalog](https://ui.shadcn.com/docs/components/radix/chart) has no algorithm
primitive for the feature-map pipeline, query marker, nearest-neighbor connections
and synchronized selection. These bounded illustrations reuse Animate UI Effect;
Card, Button, Typography and Progress remain the shared shadcn interfaces.

The demonstration portraits were generated with OpenAI ImageGen rather than
downloaded from an external photo provider. They are versioned native static WebP imports.
`NetworkScene` uses Next.js `getImageProps` for responsive optimizer URLs and
AVIF-first negotiation. CSS owns image appearance after removing the native
transparent-color style, preserving strict SSG `style-src-attr 'none'`. The exact
ESLint exception for this file permits the native API's underlying img element;
initial-markup tests retain both style prohibition and optimizer-source checks.

The official animated Lucide catalog lacks the existing Brain, Calculator, Car, Cat, Dog,
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

SiteLogo reuses the shared animated Brain producer and its style-free server glyph.
The SVG favicon
and PNG Apple icon use the icon-format exception. Camera captures and locally
selected images are already bounded data URLs and use unoptimized Next
Image; sending those private bytes to a server optimizer would violate the local
processing contract. Static social previews use Next's build-time image convention
and have the metadata-source format exception.

Animated icons initially emit Motion style attributes, which conflict with the
static HTML policy. Their shared hydration boundary renders the same static Lucide
glyphs and dimensions on the server, then uses the official Animate UI variants
after hydration. The educational illustration preserves its example image,
labeled feature maps, neighbor points, connecting paths and class labels before enabling its
interactive component.
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
Animate UI entry. Checkbox and Switch retain the same style-free Radix trigger
through server rendering and hydration; only optional graphics and form bridges
are admitted on the client. Their first replayed input and focus stay on that
original trigger, without a primitive replacement or focus transfer.

Later-opening product dialogs use public native `RadixDialog.Portal` as mount owner.
The installed Animate UI 2.4.6 Portal retains modal `hideOthers` semantics until
exit completes and exposes no public early-release API. Native portal unmounting
releases modality immediately on close and permits focus restoration; Animate UI
still owns entry. Content and backdrop therefore have no closing exit animation
in this scoped compatibility fallback. No vendor fork, DOM-unhiding workaround or
cleanup timer implements it.

[Third-party notices](third-party-notices.md) preserve upstream license conditions.
