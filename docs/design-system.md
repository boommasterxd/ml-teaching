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
The viewport-height shader hero is followed by a short AI introduction and the
project's educational purpose.
The two previews follow in one section, with centered illustrations and aligned
actions in shared rows at `lg`. On smaller screens each panel and its action stay
together. Each preview explains the goal and typical
learning process. The image preview uses the shared cat/dog photos and drawn
signal paths, with red frame outlines following the same
input-to-features-to-result sequence. Paths retain space from both adjoining frames.
Both previews ship complete, style-free static scenes with stable accessible
descriptions. The reward board starts with the agent at the starting position.
One cycle plays the dog classification, the star path, the cat classification,
then the treasure path. It runs in four-second turns while either
preview and the tab are visible. Only the current visible preview draws its
illustration, while the previous highlight fades to its neutral state.
System reduced motion and the shared homepage pause control stop the cycle.
The dog turn waits for its image to decode while the image preview is visible.
If loading fails, the cat classification remains available and the cycle continues.
The previews use small, fixed SVGs and require no ML model or simulation.
The homepage and learning hub share their topics and destinations through
`src/content/learning-areas.ts`; route actions use the native intent links.
On the homepage, `rewardPracticeComingSoon` in `home-learning-sections.tsx` controls
the translucent black overlay, diagonal availability label and disabled practice
button together. The underlying panel uses the page theme, and the reward board
continues the shared preview cycle beneath the label. Setting the flag to `false`
enables the practice link and removes the overlay.
The hero's fragment link focuses the combined experiments section and uses smooth
browser scrolling on activation. Reduced motion uses the native fragment jump.
The opportunities, limitations and entry questions follow the previews.
The reward practice page shares the preview's paths and adds controls for selecting
a reward and resetting the board. Feedback shows and announces the selected
goal, points and step count after a user action.
Below `sm`, public learning CTAs use the shared `mobile-action` full-width rule.
The `mobile-action-pair` rule gives related example actions equal-width columns
across the available space, with wrapping labels and 44px minimum touch height.
The reward experiment places its separate reset action across both columns.
Open editorial grids and separated reading rows vary the remaining text layout.
They reuse the central section spacing, theme background, Typography and ScrollReveal;
the final learning action retains the red glow.
The `/lernen` hub reuses `LearningAreas` with centered shared button links at the
bottom of both Cards. These links preserve native navigation and intent preparation;
their labels can wrap on narrow screens without extending beyond the Card padding.
Each area pairs a short task description with a decorative preview and its
destination. Image recognition links to training and offers a secondary explanation
link. The rewards card in the learning hub links to the practice page.
From `md`, native nested row subgrids align the headers, illustrations and footer
actions across neighboring Cards without fixed content heights
or JavaScript measurements. Below `md`, Cards stack at their natural heights.
These text-rich cards use the reading reveal, retaining full text contrast while
their entry position animates.
The shared header shows its learning-hub action outside `/lernen`; the hub and all
its descendants retain the brand and theme controls without that entry action.
The image explanation opens with an editorial hero and the shared example photos.
Its Animate UI scan loops while visible, stays within the illustration, and can be
paused. It respects reduced motion and document visibility. The title, photos and example
classification are static content. The hero action and final page action both lead
directly to the image-practice route with native intent preparation.
`ExamplePhoto` shares the existing generated cat/dog WebP assets and native
responsive delivery between the image-learning diagram and homepage illustrations.
Photographic inputs use these assets rather than animal glyphs; decorative SVG
scenes embed the same style-free image through a fixed-size foreignObject.
The image explanation keeps the original six-section learning journey below its
hero, with technique before the explanatory animation and training steps. Its workspace
lives on a separate practice route. The reserved Q-learning explanation renders
the shared shell. Its practice route hosts the fixed-path reward demonstration.
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
The shared DropdownMenuTrigger leaves keyboard activation with Radix and press
feedback with Motion. It ignores Motion's untyped, untrusted synthetic pointer
event before consumer handlers or Radix can treat it as pointer input; Radix handles
Enter. Native pointer input and intent preparation retain their handlers.
`LearningCard` composes the standard CardHeader, CardTitle, CardAction and
CardDescription for the three training steps. The badge aligns with the title row;
the description follows within the same header grid. The image explanation varies its
reading rhythm: after the hero, the technique explanation precedes its interactive
animation and the three training steps. The technique section pairs an editorial introduction with an open
ItemGroup, training tips use numbered Item rows in a full-width section, and
everyday examples form a quiz grid, followed by a KNN exercise. All six numbered section labels use the shared
muted Text variant without Badges. The final action starts directly with its heading.
All landing sections share the page's `--background` surface in both themes.
All numbered sections and the final call to action share the same block padding:
`clamp(4rem, 7vw, 7rem)` on each side, controlled by one rule in `hero.css`.
Spacing and typography separate sections without alternating background bands.
The final action retains its subtle red radial glow over the shared page background.
Technique columns use equal widths at the shared `lg` breakpoint and start at the
same top edge. The introduction and its Transfer Learning paragraph stay grouped
with the shared text gap; they do not distribute surplus column height between them.
Below `lg`, the columns stack at their natural content height.
Training-tip headings keep their introduction below the title at every width.
Each tip's counter, icon and title share one centered flex row. Descriptions move
beside that row at `md` and align on its center; below it they stack naturally.
The everyday quiz presents six choices in one column, two at
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
preparation controller is warranted for six visible choices and a bounded state set.
The 40-entry content pool supplies three matching and three nonmatching examples
per browser visit or replay. A stable server snapshot preserves hydration; a replay
changes the selection and restores focus to the new first choice after commit.
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

The KNN exercise uses the same dog circle, cat square, query diamond and drawn
selection rings as the explanatory diagram. Twelve separated targets keep the
whole plot operable on mobile without virtualization; a single bounded
SVG only draws accepted neighbor connections. The current K neighbors form an
isometric close group around the query, using the plot's shorter dimension.
Outer points occupy the full rectangle; extending its longer axis can only move
them farther from the query. The logical neighbor set therefore remains the
visually closest set, with at least 16 percentage points of the shorter dimension
separating their radius from the outer points. Native container units position the
close group and its query-centered square connection layer without resize observers
or state resets. Changing K resets the arrangement and selections
while retaining the input image. Standard Button hit areas remain separated and
44px wide; the glyph inside owns the official Animate UI field-error shake recipe.
Wrong-point tooltips survive focus scrolling and dismiss on Escape, blur or an
outside press; a subsequent valid selection clears the previous mistake.
Animate UI Effect owns path drawing and its reduced-motion alternative; placement
and Button press feedback remain separate properties/surfaces. The shared shadcn
Slider uses Animate UI Radix primitives for K=1/3/5, defaulting to 3; its accessible
label/value belong to the actual thumb. Input/settings, plot and class actions stack
in that order below `lg`, with a plot that fills the Card's content width and caps
only its height at 24rem, a 64px input image and compact spacing. The Card always
fills its section's content width; standard side padding is retained.
At `lg`, a centered layout limits controls to 18rem and
gives the plot up to 42rem across both control rows. The Card header shares its
reading edges with this inner layout.
The retryable exercise chunk loads near the viewport, with shared intent warming.
Its placeholder retains reading instructions in SSG; random data and hidden
interactive controls initialize only when that local exercise mounts.
The compact Footer contains the brand, copyright and information links. Below `md`,
all three groups stack and center, including wrapped information-link rows. Consent
withdrawal belongs below the training workspace and inside the model-loading dialog.
Both reuse `TrainingWithdrawal` and its native document reload, discarding the
in-memory workspace and presenting consent again. The consent dialog and privacy
policy retain the local-processing disclosures.
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
Legal pages use a shared document title role and the same heading recipes for
controlled semantic HTML. `PageLayout` pairs a sticky utility navigation with the
document at `lg`. Its sticky offset shares the document's block-padding token and
the header's height/border tokens, keeping the initial navigation position while
the document scrolls. Gavel, LockKeyhole and Accessibility identify the three legal
destinations in both navigation variants. Below `lg`, a single toolbar pairs Startseite with an
Informationen dropdown. The mobile back link offsets its unchanged hit area into
the gutter so the arrow aligns optically with the document's left text edge.
The dropdown's three native links use the shared Animate UI menu, including
current-page semantics, shared intent-based native route prefetching and whole-control icon
feedback. The three static menu items reuse primitives already loaded by the header;
a separate lazy chunk would add a loading boundary without deferring a meaningful
workload. The portal mounts only on activation, preserving menu entry and focus.
`PageContent` composes Card, CardHeader and CardContent around one semantic article
and one h1. Below `lg`, the document uses the page background without a border,
shadow or additional horizontal padding. Privacy-policy paragraphs and lists use
justified text with German automatic hyphenation; headings remain left-aligned.
The legal text remains visible in SSG, with no collapsed sections or
decorative content entrance. Document typography, reading width and spacing live
in `src/components/legal.css`; route transitions retain the existing native owner.

Official project-local Codex guidance lives in `.agents/skills/shadcn/` and
`.agents/skills/animate-ui/`, installed from `shadcn/ui` (canonical upstream
`shadcn-ui/ui`) and `imskyleen/animate-ui`. `skills-lock.json` records provenance.
The local `shadcn`, `animate-ui` and `skills` executables provide discovery/audits;
do not install a second UI foundation.

## Layout and interaction

Tailwind's shared `sm`, `md` and `lg` breakpoints own responsive layouts. The
learning page changes to a seven/five-column workspace at `lg`; cards and legal
content use bounded reading containers. Thumbnail grouping reads the CSS custom property set by the same Tailwind
breakpoint variants; JavaScript has no independently duplicated breakpoint values.
Hero CSS uses the same Tailwind `lg` and `max-sm` variants; parallax depth comes
from a central CSS custom property rather than a separate JavaScript breakpoint.

The persistent SiteHeader contains the shared brand, learning action and theme
control. At the top of the home page, the decorative hero backdrop extends behind
the transparent header within the existing navigation and hero geometry. Pointer
input in the free space reaches the hero, while the header controls remain operable.
A separate surface fades in once the page scrolls and fades out at the top. It is solid on
other routes and without scripting. Reduced motion switches the surface immediately.
ThemeProvider and the shared header/footer sit outside the route
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

`EntryReveal` composes Animate UI `Effect` for first arrival and one-time scroll
admission. Shared roles use 6 px for reading/shell, 8 px for navigation, 10 px for
text and 16 px for surfaces. Small peer groups stagger by 80 ms, capped at 160 ms;
long lists never accumulate a page-length delay. Initially visible content remains
opaque and readable and only shifts briefly. Primary page headings stay static.
Hero supporting content uses a stationary 2 px-to-zero blur entrance. Its initial
blur is present in the external stylesheet and SSG markup before hydration when
scripting and motion are enabled. Animate UI continues from that computed filter
without restarting it. No-script, reduced-motion and focused content remains sharp;
internal navigation leaves the entrance to Flow. The SSG position remains its
painted position throughout hydration and highlight startup.
Offscreen surfaces may fade and clear a 2 px blur; reading groups only move gently.
Reduced motion and keyboard focus reveal immediately without spatial movement.
SSG and hydration start with visible content and no initial style attributes.
The installed Animate UI Effect remounts its descendants when its reduced-motion
setting changes. `EntryTarget` therefore isolates only that motion boundary with a
fixed setting and restores the actual inherited Animate UI/Motion preference below
it. EntryReveal applies the user's preference itself and retires completed load
keyframes. The hero retains an explicit zero-blur target after completion, so
retiring its keyframes cannot restore a blurred base value. Changing the preference
neither remounts controls nor replays an entrance.

The persistent PageTransition tracks document arrival versus subsequent pathname
changes. Flow owns the initially visible content of internal navigation, so local
entries do not replay over its snapshots. Offscreen groups still reveal on first
scroll admission. Initial viewport classification follows the native transition's
completion and Next.js scroll restoration; content stays visible and usable during
that preparation. No animation adds a navigation delay or mounts destination pages
speculatively. Header/footer have one independent shell admission; theme changes
do not remount them or replay entries.

Landing supporting hero copy, step cards, demonstrations, quiz cards, guidance
rows and the closing action use the shared roles. Legal text is grouped at existing
h2/h3 boundaries without changing controlled copy, while its H1 stays visible.
Training panels enter after the consent-gated model is ready; their mounted controls,
camera/model lifetime and existing class-list reflow remain independent. Virtual
thumbnails and live prediction updates never replay decorative entries. Dialogs,
success feedback, icons and the educational sequence retain their existing owners.

Quiz completion and KNN answer feedback share `AnimatedFeedback`. Animate UI's
`AutoHeight` owns expansion and collapse, including the space above the Alert;
`Effect` owns its short fade and upward entrance. Presence retains outgoing content
until exit finishes, while immediately hiding it from assistive technology. KNN
answer corrections replay the content entrance without replacing the height owner.
Reduced motion uses the library's instant height change and opacity feedback.

- The official Animate UI `PageTransition` registry component owns same-document
  route continuity through Motion `AnimateView` and React 19.3 ViewTransition.
  The shared root layout selects `flow` for every pathname change: a 30% horizontal
  shift and blur, with a 350 ms entrance and 250 ms exit. Explicit return links use
  `nav-back` to mirror the direction. Header, footer and ThemeProvider remain outside
  this single boundary. Query/hash changes do not replace it. Browser back/forward
  navigation remains native and does not promise the Flow animation in Next.js.
  Reduced-motion CSS disables native snapshot animations; the component also selects
  Animate UI's non-spatial Fade preset instead of Flow. Unsupported browsers retain
  normal navigation. The consent-withdrawal
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
  The registry adaptation retains only the selected Flow and reduced-motion Fade
  presets. Unused shared-element and pointer/frame machinery is omitted. The
  rectangular page surface uses external CSS for its view-transition class,
  clipping and theme background instead of dynamic inline styles. Motion's exact
  constant reset style is emitted during SSG so the existing hash-CSP build also
  authorizes the runtime producer; a security contract test compares those bytes
  with the installed upstream hook. No request-time nonce or dynamic rendering is
  needed. The root route owner must be ready before first navigation; destination
  preparation remains native Next Link prefetching rather than hidden page mounts.
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
  transform-only parallax layers. The static poster uses `public/hero-contours.webp`,
  an alpha capture of the same shader's first frame at a 5120 by 2160 CSS-pixel
  surface. Eight alpha levels reduce transfer size, stored as lossless WebP.
  Below the shared `md` breakpoint, `hero-contours-mobile.webp` crops the same frame
  to a 1024 by 1536 CSS-pixel area, avoiding the full desktop download.
  Native image preload links prioritize only the matching mask before CSS discovery.
  Their HTML media queries mirror Tailwind's default `md` value of `48rem`; HTML
  media attributes cannot resolve CSS theme variables, so breakpoint changes must
  update these two preload conditions together with the theme.
  Its CSS mask retains that scale and top-left origin instead of stretching
  the terrain to each viewport, so its hills match the live field. It repeats beyond
  that captured area. The mask uses the shared line-color token for both themes;
  it deliberately bypasses photographic image optimization to preserve contour alpha.
  The first successful GPU draw hides the poster without an extra entrance fade.
  Visibility and intent share one renderer import promise. The resolved component
  mounts directly on the client without an additional dynamic/Lazy/Suspense boundary,
  so preparing the decorative enhancement does not trigger a page update transition.
  The poster returns on reduced motion, hidden or offscreen state, unsupported WebGL
  or context loss. These states unmount the enhancement
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
  All internal route links compose `IntentLink`: pointer entry, focus and pointer
  down warm the native route cache without changing the Link's prefetch mode,
  key or motion owner. The target is not mounted during preparation; modal focus,
  entry playback and consent-dependent effects remain tied to navigation.
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
  preview and deferred animation. The `network-demo` inline-size container owns its
  responsive layout: below 34 rem it uses a compact vertical sequence; from 34 rem
  it follows a two-by-two serpentine (01 right to 02, down to 03, left to 04);
  from 64 rem all four steps share a row. The DOM retains the numerical order.
  Full labels and captions remain available. Connectors and traveling signals turn
  together inside the reserved gutters, with no duplicated animation owner. Connectors are clipped
  inside reserved gaps, outside all labels and readouts.
  Each connection draws its shaft over the first 70% of the existing stage interval;
  both arrowhead wings then grow from the tip over the remaining 30%. The moving
  packet follows the shaft timing. Reduced motion draws the complete arrow at once.
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
  Below-fold reveals use `EntryReveal`; Effect measures the actual content surface,
  outside display-contents icon wrappers. ScrollReveal keeps the shared whole-group
  icon hover context and delegates entry to this composition.
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
`src/components/network/examples.ts` uses Next.js `getImageProps` for responsive
optimizer URLs and AVIF-first negotiation. Its shared `exampleImageProps` helper
omits the native transparent-color style so CSS owns image appearance, preserving
strict SSG `style-src-attr 'none'`. `ExamplePhoto.tsx` renders these prepared props
through the shared img element; its exact ESLint exception permits that native element.
Initial-markup tests retain both style prohibition and optimizer-source checks.

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
static HTML policy. Each icon has its own client entry under `src/components/icons/`.
The shared `client-icon.tsx` hydration helper renders the same static Lucide glyphs
and dimensions on the server, then uses the official Animate UI variants after
hydration. Production consumers import the concrete icon entries directly so
unrelated glyphs and animation producers stay out of their route graph. The
server-neutral `icons.tsx` facade preserves the named import API for compatibility.
Pure icon factory annotations permit unused producers to be removed without
changing the mounted components or their motion owners.
The educational illustration preserves its example image,
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
