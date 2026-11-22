# Design system

## Foundation

ML Teaching uses red primary actions and rounded glass surfaces. Light mode pairs
dark text with an off-white background and white panels. Dark mode uses light
text, a black background and smoked glass panels. Local Geist defines both headings
and interface text. `src/lib/fonts.ts` preloads its Latin WOFF2 asset through
`next/font/local`, without a remote font request. An optional display policy
keeps the fallback readable and prevents a late font swap during a slow visit.
Shared colors, type and shell styles live in `src/site-foundation.css`. The App
Router's `src/index.css` adds the content styles. The native 500 stylesheet
`src/pages-error.css` scopes Tailwind detection to its error scene and shared shell,
including the navigation and deferred appearance menus. Update its source globs
when those components start using utilities from a new source file. Action
variants live in `src/components/button-variants.ts`.
The shared `--glass-surface`, `--glass-highlight` and `--glass-radius` tokens
define panel backgrounds, edge highlights and corner radii.
The shared shadcn `Card` has a neutral one-pixel glass rim with white and silver
reflections. The closing actions on the homepage and the image lesson use
`<Card rim="ruby">` for a ruby reflection and a soft red glow in the lower corner.
Hover and focus within the Card intensify the reflection. Reduced motion makes
this change immediate, and forced colors use the native border.
Font-role aliases also resolve on `.app-body`, where `next/font` exposes the local
font variable; resolving that body-scoped variable only on `:root` would fall back
to the browser's inherited font.
The homepage hero pairs its headline and actions on
the left with a luminous glass loop on the right. On narrow screens the loop
sits above the centered headline. Red accents connect the typography and actions
to the concentrated light inside the loop. Neutral white reflections define the
curved glass. The surrounding glow fades into the page background beyond the artwork.

The introduction pairs the AI question with its definition. The educational
purpose and the opportunities comparison each use one neutral Card. The purpose
Card includes one decorative waveform made of twelve curves. The complete
drawing is present in static HTML. On first viewport entry an Animate UI clip
passes across it once. Reduced motion and the homepage pause control leave the
complete drawing visible.

Homepage experiments and learning hub topics use the same shadcn Card, glass
surface and title styles. Each homepage Card groups its illustration and
explanation in CardContent and its practice question and action in CardFooter.
Shared rows align their actions at `lg`. On smaller screens each
illustration, explanation and action stay together. Each preview explains the goal and typical
learning process. The image preview uses the shared cat/dog photos and drawn
signal paths. Direction arrows remain visible at rest, and highlights follow the
input-to-features-to-result sequence.
Both previews ship complete, style-free static scenes with stable accessible
descriptions. The playback controller and animated SVGs load after scroll
approach or keyboard focus. Intent on the hero's mini-experiments link starts
loading the same module and preparing the alternate photo in parallel. The cards
and their actions retain their identity as the
graphics switch to playback. On the reward board a ring marks the start, dotted guides show the
two possible paths and hatching marks obstacles. A single Motion timeline advances
the solid trail and samples that same rounded SVG path for the red agent's position.
When the point reaches the destination, that tile darkens and the shared Animate UI
Check draws in green. The tile and check fade out with the route as the turn ends.
The learning hub shows the route to the star as a static scene.
At `lg` and above, the previews alternate in four-second turns: dog classification,
star path, cat classification, then treasure path. After each highlight fades, the
other preview waits one second before starting. A lone visible preview uses each
turn. Below `lg`, the stacked previews loop independently whenever visible. Each
starts a fresh turn on entry and restarts 150 ms after its highlight fades.
System reduced motion and the shared homepage pause control stop the cycle.
Both cycles stop in hidden tabs. The desktop dog turn waits for its image to decode.
On mobile, the next available cat or dog example is selected at the start of each turn.
Photo, feature pattern and result crossfade together. Signal outlines and connectors
draw with overlapping starts using the Animate UI fill curve. The completed highlight
fades as a group before the next draw starts.
If loading fails, the cat classification remains available and the cycle continues.
The previews use small, fixed SVGs and require no ML model or simulation.
The homepage and learning hub share their topics and destinations through
`src/content/learning-areas.ts`; route actions use the native intent links.
The homepage and learning hub use `LearningPracticeAction` for both subjects.
A pending exercise displays “Coming Soon” as the visible name of a disabled button.
On the homepage, both actions follow the question “Willst du es selbst ausprobieren?”.
The reward board remains visible during the shared preview cycle.
The hero's fragment link focuses the combined experiments section and uses smooth
browser scrolling on activation. Reduced motion uses the native fragment jump.
The opportunities, limitations and entry questions follow the previews.
The shared `rewardPracticeComingSoon` flag in `src/content/learning-areas.ts`
also controls the practice route. Direct visits show the notice and a link back
to the learning hub while the exercise is pending.
Below `sm`, public learning CTAs use the shared `mobile-action` full-width rule.
The learning hub links share available space and wrap at their card's content
width. Stacked links fill narrow cards. Their 20rem maximum width also applies
to the unavailable action. The one-column mobile layout centers these controls
in their cards.
The homepage hero actions sit side by side with room to wrap. The primary pill
uses a red fill and the secondary pill uses a translucent surface.
The default red Button has a one-pixel white highlight along its inside top edge.
Outline Buttons use a thin border and a subtle neutral shadow. Shared controls use
a solid keyboard focus outline, with the system Highlight color in forced colors.
Quiz cards inset the outline to keep it visible within clipped surfaces; thumbnails
add a contrasting edge against image content.
The `mobile-action-pair` rule gives related example actions equal-width columns
across the available space, with wrapping labels and 44px minimum touch height.
The reward experiment places its separate reset action across both columns.
Each comparison topic groups its heading, opportunity and accessible caution.
From `lg`, the three topics share grid rows so wrapped text keeps the columns
aligned. On narrower screens each topic stacks at its natural height.
Entry questions and answers remain fully visible. These
sections use theme-aware text, translucent surfaces and the shared Typography
and ScrollReveal components. The final learning action uses the shared Card
with a centered title and a footer link to the hub.
The `/lernen` hub introduces labeled examples and rewards, then presents the two
experiments. A reading section below them suggests changing the background of the
training photos and comparing the paths with an imagined cost per step.
The hub reuses `LearningAreas` with leading-aligned actions at the bottom of both
cards. Labels can wrap on narrow screens. Image recognition offers training and
explanation links with native navigation and intent preparation.
From `md`, native nested row subgrids align the headers, illustrations and footer
actions across neighboring Cards without fixed content heights
or JavaScript measurements. Below `md`, Cards stack at their natural heights.
These text-rich cards use the reading reveal, retaining full text contrast while
their entry position animates.
The shared header offers the same navigation on learning, information and home pages.
The image explanation opens with the shared example photos on a borderless stage.
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
lives on a separate practice route. The hub displays one inactive Coming Soon action
for Q-learning while its explanation and practice are pending.
The shared Lucide Brain glyph defines the brand. Its stroke uses the local primary color.
The SVG favicon has light/dark variants and the PNG Apple icon uses the same glyph.

The selected foundation is Tailwind CSS 4, shadcn/ui with Base UI and Animate UI 2.4.
`components.json` selects the official `base-nova` registry and shared aliases.
The wrappers in `src/components/ui/` retain the product's geometry, tokens and variants.
`Button`, `Dialog`, `ModalContent` and `PageHeader` retain shared product interfaces.
Use shared controls rather than new copies of native controls.
Native markup inside catalog recipes, semantic content and Next.js navigation
links remain appropriate.

Shared Alert, Empty, Card, Badge, Field, Label and Separator wrappers own recurring
feedback, grouping and form semantics. Landing and training cards compose the same
CardHeader, CardTitle, CardContent, CardAction and CardFooter parts. Do not recreate
feature, explanation or open Card variants. For a card-shaped list or navigation
landmark, use Card on the matching semantic element. Training previews use Dialog.
Destructive training confirmations use the Base Nova Alert Dialog with Animate UI.
DialogFooter groups the actions and ModalContent sets the product width.
The consent footer uses equal columns when each action has room for 7.5rem
and stacks them when the available dialog width is smaller.
DialogTitle places optional 1rem icons beside the first line of the heading.
Confirmations use muted icons. Model loading, training and the appearance menu use
the shared shadcn Spinner with its Animate UI glyph. Retryable gallery and example
loading errors use the shared Alert, as does the training-panel retry fallback.
The everyday quiz composes standard
Cards, whole-card answer Buttons and contextual Alerts, including its feedback retry fallback.
Notices use Alert. Badges use default, secondary, outline and
destructive variants for their roles. Consent groups and class-name
editors reuse FieldSet/Legend/Group/Label/Error as applicable, with shared Input
and DialogTitle variants. Semantic color and state tokens live in `src/site-foundation.css`.
FieldLabel keeps descendant links underlined, including the required consent links,
so they remain distinguishable without relying on color.

Global notifications use the shared shadcn Toast composition through Animate UI.
Its single viewport appears at the top center on mobile and at the bottom right
from the desktop breakpoint. Toast code is prepared on training consent and
mounted on the first notification. Camera failures in the training workspace
use this viewport. Image upload and camera retry remain in the workspace, and
the toast does not move focus. The provider owns announcements, timers and
dismissal. If the viewport chunk fails, pending notices use a lightweight alert
and another notification retries the same module. Field errors, exercise results
and recovery for a blocked step stay with their controls.

The standalone appearance switch and consent checkboxes use Base UI Toggle
with their respective switch and checkbox semantics. The Base UI 1.9 form
primitives emit an inline-styled hidden input, which the static CSP rejects.
The shared wrappers keep each button stable through hydration and preserve the
animated thumb and checkmark. These controls update local React state.
Dropdown menu items retain full opacity while Animate UI staggers their translation
and blur in the legal dropdown. The shared content wrapper fixes enabled-item
opacity with an important utility to preserve text contrast during entry. Disabled
items retain their separate opacity state.
Base UI owns keyboard activation in dropdowns. Animate UI owns popup entry,
exit and pointer feedback. A closing popup immediately becomes inert during exit.
The appearance menu uses the same popup fade and scale as the header navigation
at both breakpoints. The installed Animate UI primitive exposes no row-stagger
option, so scoped styles keep the rows sharp and stationary inside the popup
and show its label and separator with it. All rows share the same inset and leading
icon alignment. The remember option shows an X when off and a check when on. The
selected appearance and the checked remember option each keep semibold red text and a
background that blends the shared highlight color into the popup surface. One
red highlight glides over the rows with hover or keyboard focus.
`LearningCard` composes CardHeader, CardTitle and CardDescription for each of
the three training steps. A red icon and step number share a row above the title.
The image explanation presents the technique before its interactive animation
and training steps. The technique section groups MobileNet and KNN in a single
glass panel with a divider. From `lg`, it places the introduction beside the
panel and the training-tip introduction beside its numbered list. Smaller screens
stack these sections. Each tip groups its number, icon and title above the description.
The chapter's six numbered section labels use the shared Text component with red
type. Everyday examples form a quiz grid, followed by a KNN exercise. The final
training link sits in a rounded glass panel with a red glow.
The everyday quiz presents six choices in one column, two at
`md` and three at `lg`. Each is a one-shot answer action, not a persistent toggle
or submitted questionnaire. The official Questionnaire/ToggleGroup catalogs own
multi-step forms and switchable selections; ordinary Buttons fit this reveal flow.
Each Card's initial surface has one overlaid native Button using the central
`quiz-card` variant and size and a stable accessible answer name. The animated
icon sits beside the heading and responds to card hover, press, and answer focus.
Each choice takes the height of its content and uses equal top and bottom
padding. The animated result overlays the card. Inline feedback can reserve
extra space when a retry is needed.
The lightweight local answer state remains with the required triggers; closed
explanations and their motion mount only on activation. No separate import or
preparation controller is warranted for six visible choices and a bounded state set.
The 40-entry content pool supplies three matching and three nonmatching examples
per browser visit or replay. A stable server snapshot preserves hydration; a replay
changes the selection and restores focus to the new first choice after commit.
A shared result component dims the entire Card, including its one-pixel glass rim,
with an 82% black overlay. A green Check or red X sits above it. Its `quiz-result`
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
selection rings as the explanatory diagram. In both diagrams each line ends at
the near edge of its neighbor's ring. Twelve separated targets keep the
whole quiz plot operable on mobile. Native container units scale every point's
distance to the query by the shorter side of the plot and size each line to the
selected point's ring. Changing K clears selections and feedback within the
same point arrangement and input image. A new round generates a new arrangement.
Standard Button hit areas remain separated and
44px wide; the glyph inside owns the official Animate UI field-error shake recipe.
Wrong-point tooltips survive focus scrolling and dismiss on Escape, blur or an
outside press; a subsequent valid selection clears the previous mistake.
Animate UI Effect owns path drawing and its reduced-motion alternative; placement
and Button press feedback remain separate properties/surfaces. The shared shadcn
Slider uses Animate UI Base UI primitives for K=1 through 10 in steps of one,
defaulting to 3. The thumb owns the accessible label and value. The answer
controls include a tie for equal vote counts. Feedback sits beside the answer
controls when their shared container can fit both columns, and below them in
narrow containers. Input/settings, plot and class actions stack
in that order below `lg`, with a plot that fills the Card's content width and caps
only its height at 24rem, a 64px input image and compact spacing. The Card always
fills its section's content width; standard side padding is retained.
At `lg`, a centered layout limits controls to 18rem and
gives the plot up to 42rem across both control rows. The Card header shares its
reading edges with this inner layout.
The retryable exercise chunk loads near the viewport, with shared intent warming.
Its placeholder retains reading instructions in SSG. Intent can prepare the
synthetic exercise in a hidden React Activity, which keeps effects inactive.
On activation the visible exercise takes focus from its placeholder action when
that action still owns focus.
The compact Footer contains the brand, copyright and information links. Below `md`,
the groups stack and center, including wrapped information-link rows. While training
consent is active or remembered, the footer offers the labeled training settings.
From `2xl`, the same settings are also available from the shield in the lower-left
gutter. The footer provides an unobstructed action at smaller widths. The settings
dialog separates camera shutdown from full withdrawal. Model loading also provides
withdrawal, which cancels setup on the source page or clears the training workspace.
The consent step and privacy policy explain local processing.
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
destinations in both navigation variants. The current link and its icon use
the primary color. On desktop each link fills the menu's inner width. The vertical
shadcn Navigation Menu shares the header's moving Animate UI highlight across
the full row. The links' hit areas meet between rows so crossing the spacing
keeps the highlight moving directly between destinations. Base UI's `render`
prop composes the links with native anchors and their current-page semantics.
The desktop links and highlight items share a client boundary so Animate UI can
attach its row refs during hydration. The surrounding layout renders on the server.
Below `lg`, the toolbar pairs the back action with the Informationen dropdown.
Back traverses the previous browser entry when available and uses the homepage for a direct entry.
The dropdown's three native links use the shared Animate UI menu, including
current-page semantics, shared intent-based native route prefetching and whole-control icon
feedback.
Pointer, keyboard focus and touch intent prepare the three legal items through
one retryable module. The portal mounts on opening and owns focus and exit.
The appearance menu loads its popup and choice
components on intent through a separate entry point from the shared trigger.
`PageContent` composes Card, CardHeader and CardContent around one semantic article
and one h1. The reading column has a bounded width. Documents use the neutral
Card. Privacy-policy paragraphs and lists are left-aligned with automatic German
hyphenation.
The legal text remains visible in SSG. Heading-led reading groups keep full
opacity as they enter. Document typography, reading width and spacing live
in `src/components/legal.css`; route transitions retain the existing native owner.

The static 404 and 500 documents and the App Router recovery screen share
`PublicErrorScene`. Status text and recovery actions remain visible in the initial
render. The 404 uses three separately modeled glass digits in the shared
Topography renderer. The 500 and recovery screen use its ring. Like the homepage,
both static error pages reserve the artwork area and start playback automatically
when the artwork is visible. The shared Spinner appears only after 500 ms of active
waiting and clears when the first frame is ready or loading stops.
Pointer and keyboard intent prepare the shared renderer. An optimized responsive
poster covers reduced motion, disabled scripting and unavailable WebGL.
The App Router recovery screen renders the poster immediately and loads the
playback component when the recovery screen mounts. If playback fails to load,
the poster and recovery actions stay available. Visible artwork or pointer
intent prepares the shared renderer.
Visible scenes support pointer, touch and keyboard impulses and a pause control.
The [playback and menu-loading decisions](decisions/error-artwork-and-menus.md)
record why these interactions share their implementations.

Official project-local Codex guidance lives in `.agents/skills/shadcn/` and
`.agents/skills/animate-ui/`, installed from `shadcn/ui` (canonical upstream
`shadcn-ui/ui`) and `imskyleen/animate-ui`. `skills-lock.json` records provenance.
The local `shadcn`, `animate-ui` and `skills` executables provide discovery/audits;
do not install a second UI foundation.

## Layout and interaction

The image-training workspace mounts one step at a time on the same route. It starts
with the class collection, whose Cards share equal-height rows in two columns from
Tailwind's `lg` breakpoint and stack on narrower screens. Training and prediction each use the
full workspace width when selected. Switching steps preserves class data and the
current model and stops any running prediction when leaving its step.
Each class reserves space for its gallery toolbar and scrollable
thumbnails from the empty state onward. With the camera enabled, the gallery and the capture
surface share one row and height from 36 rem of class-card width. Narrower cards stack the
two surfaces. The stacked gallery keeps room for two full rows of thumbnails at phone
widths. The capture toggle spans the width below the video. A click, tap or keyboard
activation toggles capture. Holding the touch button records until release or gesture
cancellation. Capture ends when the document is hidden.
The collection requirements keep their space when training becomes available so
the camera controls stay in place during capture.
Adding or removing images leaves the surrounding controls in place. Container queries set
thumbnail columns from the gallery's own width. TanStack Virtual reads the same CSS column count.
It retains the focused row and mounts only the current window with overscan.
Browser Find cannot locate gallery items whose rows are unmounted. Scroll the
gallery to bring those rows into view.
The homepage hero places the glass beside the text at `md`. The loop and droplets
share one scroll-parallax layer.

The persistent SiteHeader places the brand and theme controls on either side of the centered
navigation. The desktop shadcn Navigation Menu groups explanations and practice routes by
subject under Lernlabor and collects the three information pages under Rechtliches.
The lab overview precedes a single column of topics. Each topic lists its explanation
before its exercise. Section labels align with the leading edge of the Animate UI
icons. A lightbulb marks each explanation. Exercises use icons for their respective activities.
Link text starts in the next column and availability occupies the trailing column.
Enabled rows trigger their icon on hover, keyboard focus and press. The current
page or section owns the red label and icon. A single Animate UI Highlight
follows the pointer or keyboard focus in each menu and returns to the current item
when idle. Menus with no current item show the highlight during interaction.
The header, legal navigation and appearance menu share the theme's `--primary-soft`
highlight color.
Each desktop panel opens from the center of its trigger. The 32 px trigger pills
have a 44 px pointer target. Menu rows use compact spacing for mouse input and
retain their larger touch targets on coarse-pointer devices.
Below `md`, one Menü trigger exposes the same destinations. Unavailable learning items
show their availability without a navigable URL. Enabled links use native intent preparation.
Both lightweight trigger lists are delivered in static HTML and CSS selects the
visible list at the shared breakpoint. The shared navigation control uses a Base
UI button for the initial trigger. It shares its label, chevron and styles with
the trigger inside the interactive menu. Once the browser resolves the viewport,
it mounts just the matching navigation tree. Focus carries over from the initial triggers.
Crossing the breakpoint closes the old panel.
Base UI owns keyboard navigation and the trigger-to-panel relationship.
Animate UI owns the panel transitions and the moving row highlight.
Each header trigger uses the shared Animate UI chevron with a static glyph through
hydration. Its rotation follows popup state and reduced-motion rules.
The header keeps its Base UI triggers and positioning shell stable. Pointer,
keyboard and touch intent load the shared module for the navigation rows and
their icons. Opening before it arrives shows a loading status in the existing
popup. The popup supports dismissal while loading and retry after a failure.
Link intent prepares destination routes.
The header list applies isolation through CSS because Animate UI's list would
emit an inline style in the static document.
Header, footer and legal pages share the legal destinations.
ThemeProvider and the shared header/footer sit outside the route
ViewTransition. Theme changes update the root appearance without remounting the
learning workspace. Three buttons mark the current training step and focus the
new section heading on activation. The two collection continue buttons require
enough images in distinctly named classes. Prediction unlocks after successful
training. On narrow screens the step buttons share the full width. Each step's
visible surface, label, and number scale together inside a 44 px minimum touch
target. The add-class action is below the last card, beside the bottom continue
button. On small screens the add action fills the remaining width and the continue
button uses a compact text style. Animate UI Auto Height follows the class grid as
rows appear or disappear, moving the actions and footer with the list. Reduced
motion applies the new height immediately. Adding a class preserves the page's
scroll position. Keyboard activation focuses the new name field without scrolling.
The class name fills the card header beside
the compact, vertically centered image count. An invalid name uses the field's error border and
an anchored Animate UI tooltip on focus or hover. The field retains a live error
description. The training status reserves space for its wrapped messages. A
full-width row groups upload, reset and removal.
Narrow cards retain more space for the upload label and show reset and removal
as icons with accessible names. The gallery's fixed-height area includes its
selection controls so collecting the first image keeps the card height stable.
A persistent live status announces the selected image count during selection mode.
Holding a thumbnail enters selection mode and toggles that image. A short press
opens its preview outside selection mode and toggles it inside selection mode.
The toolbar also opens selection mode for keyboard and pointer users. The selected
thumbnail uses the same primary red for its border and plain Animate UI checkmark.
A neutral backing keeps the checkmark readable on arbitrary photos. The class
marker and empty gallery illustration use the theme-aware class accent.
Class names identify each group. Class counters show
progress toward the training minimum, then the collected total.
Each class card has a camera preview, including before camera permission is granted.
Capture and prediction previews share the same controls. Play and pause
share the lower-left button, and the camera switch sits in the lower-right corner.
An inactive preview centers the animated VideoOff glyph and retains a screen-reader
status. The icon plays once when the inactive preview comes into view.
A connecting preview centers the shared spinner with a screen-reader status.
Failed connection attempts keep the pending state for at least two seconds.
Successful connections display the live preview as soon as the stream is ready.
An unavailable camera centers its status text below a white Animate UI alert icon.
Both buttons stay mounted in place during stream changes. Pause releases
the stream and withdraws camera consent. Play opens the camera choice when consent
is missing and retries a failed connection while consent is active. Recording
requires a live stream. During training or when no preview can turn
off the camera, the same action is available in the training settings.
Local image uploads remain available.
With camera consent, live prediction starts when the trained prediction step opens.
The prediction card keeps its camera frame and result areas in place, and confidence
bars are empty until results arrive.
The camera and confidence readout share a row when the card is wide enough.
The PCA diagram reserves its plot and legend below the
confidence bars before prediction starts.
During live prediction, it shows a scatter plot with one point per training image
and a diamond for the current camera frame. When the panel uses two columns, the
camera frame stretches to the bottom of the legend. The title identifies the 2D
projection, and the figure caption explains the edge marker for assistive technology.
Point positions are visual only. The predicted class and confidence values are
available as text above the plot.
The plot reuses the lesson's diamond, class palette and typography. Training
classes use circles, squares and triangles in sequence. When shapes repeat, the
live legend lets users isolate one class via pressed-state buttons and select it
again to restore all points. Filtering keeps the camera marker and projection
scale stable. A packed SVG path per class keeps the point cloud separate from
the Animate UI marker motion.
The workspace panels, dialogs, gallery and camera preview use shared theme and media tokens.
SiteBrand is a small client boundary so Animate UI's press Slot receives a concrete
Link element. Passing the server-produced Link through that Slot can resolve to an
opaque child during development and omit the brand. Header and Footer remain server
compositions; header actions keep their logical end alignment independently.
On the homepage, the brand clears any fragment and scrolls to the top. Reduced
motion uses an immediate scroll. From other App Router pages, the brand opens
the homepage with the shared backward Flow transition.

The shared dialog surface fits the dynamic viewport height (`dvh`), including
when browser toolbars reduce the available space. The heading and actions stay
visible while `DialogBody` scrolls. Base UI and the initial native dialog handle
focus and Escape. React Remove Scroll contains scrolling.
The training setup focuses each new step's title and announces loading progress
in place. On narrow screens the consent text uses the available width inside the
dialog, which retains vertical scrolling for short viewports and zoom.
Controlled dialogs restore focus when they close.
The gallery, dialog bodies, and menus share Animate UI's Scroll Fade. The fade
appears at the edges with more content. The scroll containers keep their CSS
overflow, scrollbars, and keyboard behavior. Only the content viewport fades,
so surrounding surfaces and dialog scrims stay separate. The gallery also applies
a slight blur to mounted thumbnails near the scroll edge. Its scroll viewport
reaches the bottom edge, where the gallery's rounded corners clip the thumbnails.
Buttons share disabled, keyboard and touch behavior. Error messages, empty data,
loading state and deletion confirmations stay explicit.

## Theme and optional interfaces

The default follows the operating system. Light, dark and system selections remain
temporary unless the user explicitly enables remembering for future visits. Only
the enum selection is stored under `ml-teaching-theme`. Training consent has
its own optional tab-local record. Training data remains in memory. System changes, storage events and invalid values never
write defaults. Blocked reads fall back to the system; failed writes or deletion
produce an honest status message. The trusted build-known bootstrap and the
upstream ThemeToggler wipe style are rendered in static HTML for exact CSP hashing.
Both document owners declare light and dark color schemes so the browser can
match the system canvas while the stylesheets load.
The public theme-wipe callbacks are serialized so the latest selection wins.
The favicon link precedes the trusted bootstrap in both document owners. Before
hydration, the bootstrap creates the browser theme-color meta tag and sets its
color and the favicon for the resolved theme. The default favicon SVG also
follows the OS color scheme. An explicit
theme wipe updates both when its existing completion applies the theme.

The static switch takes its initial position, track color and glyph from the
bootstrapped root theme. React adopts that position as it reads the preference.
The shared switch thumb and icons prepare Motion on pointer, touch or focus
intent in the appearance controls. Press feedback and the switch node stay stable.
The lightweight switch and menu trigger remain available initially. Pointer/focus
intent prepares one deduplicated, retryable menu content module. The Base UI
trigger opens on mouse hover with the same short delay as the desktop navigation.
Hover leaves keyboard focus in place and allows the pointer to cross into the
popup. Click, touch and keyboard activation also open it. The portal mounts the
content on opening. Below `md` the menu matches the glass header's width and aligns
with its outer edges. From `md` it anchors to the shared button and uses the same
`13rem` minimum width as the legal dropdown.
The menu trigger sets the shared Button's Animate UI tap scale to 1 so Base UI
positions the panel against a stable rectangle during pointer and keyboard press.
The toolbar centers the brand mark and appearance trigger in the rounded ends.
Their inline insets derive from the toolbar radius and each element's size.
The mobile and desktop menu offsets align the appearance menu with the navigation
flyouts.
Direct-entry consent remains part of the static document. Training links prepare
the shared setup dialog on pointer, focus and touch intent. On activation, source-page
setup uses one dialog for consent, model loading and the camera decision. Intent on a confirmation or image-preview trigger
prepares one shared module. The workspace mounts one active dialog at a time and
supports cancelling a pending first opening with Escape. Upload and capture
intent warm the thumbnail module. Its virtualizer mounts when there are images
to display. Play intent can prepare the local prediction space. The video attaches
when the trained prediction step is active and the authorized stream is ready.
TensorFlow and model imports remain consent-gated and are never prepared on intent.

## Motion ownership

`EntryReveal` composes Animate UI `Effect` for first arrival and one-time scroll
admission. Shared roles use 6 px for reading/shell, 8 px for navigation, 10 px for
text and 16 px for surfaces on initial entry. Small peer groups stagger by 80 ms
on entry and 50 ms on scroll, each capped at two steps. Initially visible content
remains opaque and readable and only shifts briefly. Primary page headings stay static.
The homepage headline, supporting text and actions remain sharp and in place
from the first paint through hydration and highlight startup.
On first arrival from below, cards and navigation surfaces fade in with a short
14–16 px slide. Standalone text, reading groups and the footer stay opaque during
scroll reveals. The shared header stays in place from the first paint through
hydration. Legal documents reveal by heading-led group, and
the training and prediction sections enter independently after workspace setup.
Virtualized thumbnails keep their existing list lifecycle.
Reduced motion and keyboard focus reveal immediately without spatial movement.
SSG and hydration start with visible content and no initial style attributes.
The installed Animate UI Effect remounts its descendants when its reduced-motion
setting changes. `EntryTarget` therefore isolates only that motion boundary with a
fixed setting and restores the actual inherited Animate UI/Motion preference below
it. EntryReveal applies the user's preference itself and retires completed load
keyframes. Changing the preference preserves controls and completed entries.

The persistent PageTransition tracks document arrival versus subsequent pathname
changes. Flow owns the initially visible content of internal navigation, so local
entries do not replay over its snapshots. Offscreen groups still reveal on first
scroll admission. Initial viewport classification follows the native transition's
completion and Next.js scroll restoration; content stays visible and usable during
that preparation. No animation adds a navigation delay or mounts destination pages
speculatively. The footer has one independent shell admission. Theme changes
preserve the shared header and footer instances and completed entries.

Landing supporting hero copy, step cards, demonstrations, quiz cards, guidance
rows and the closing action use the shared roles. The learning hub groups each question
with its answer for scroll admission. Its main heading is stationary, and its
introduction uses the reading role.
Legal text is grouped at existing
h2/h3 boundaries without changing controlled copy, while its H1 stays visible.
The training workspace keeps its geometry through setup and becomes interactive
when the model is ready and the first dialog closes. Panels below the viewport
admit scroll reveals once the workspace is ready. Training settings remain
available while consent is active or remembered. Their Alert Dialog pairs the
footer shield with the title and gives each action a full-width row on narrow
screens. The actions sit side by side from `sm`. The initial focus goes to Close.
Later camera prompts retain the workspace layout. Virtual thumbnails and live
prediction updates never replay decorative entries. Dialogs,
success feedback, icons and the educational sequence retain their existing owners.
During classifier training, the progress bar and the converging paths in the
illustration follow the number of training images registered with the classifier.
Successful training changes the end node to the shared Animate UI CircleCheckBig
glyph and announces completion in the persistent status region. The same glyph
marks completed image counts, correct answers, quiz completion, reward arrival
and consent withdrawal. The success state stays visible until the next action.
Reduced motion applies progress updates without interpolation.

Quiz completion and KNN answer feedback share `AnimatedFeedback`. Animate UI's
`AutoHeight` owns expansion and collapse, including the space above the Alert;
`Effect` owns its short fade and upward entrance. Presence retains outgoing content
until exit finishes, while immediately hiding it from assistive technology. KNN
answer corrections replay the content entrance without replacing the height owner.
The correct class earns a mint seal. A single ripple expands around its drawn
check and two glints fade. Reduced motion shows the finished seal immediately.
The vote sentence stays visible and the persistent status region announces it
with the success title.
Reduced motion uses the library's instant height change and opacity feedback.

- The shared adaptation of Animate UI's `PageTransition` uses React 19.3
  ViewTransition directly so that snapshot eligibility follows the navigation
  type. Next links tag forward navigation with `nav-forward`. The Flow keyframes
  use Animate UI's 30% horizontal slide, 12 px motion blur and opacity fade.
  Content enters in 350 ms and exits in 250 ms. The registry component emits
  inline styles and writes runtime rules into a style element. This integration
  keeps the animation rules in external CSS for the static site's strict hash CSP.
  Explicit return links use `nav-back` to mirror the direction. Header, footer
  and ThemeProvider remain outside this persistent boundary. Query/hash changes and subsequent updates leave
  the main content out of capture. Eligible browser Back and Forward traversals
  use the Navigation API's precommit support when available; the legal Back control
  also applies Flow layers to native history traversal. The browser owns this capture
  because a cached history restore can bypass React's view transition. Capture
  follows the matching history entry and rendered route commit. Interruption,
  failed navigation or browser cancellation releases the pending capture.
  Reduced motion opts out of page capture. Unsupported browsers retain
  normal navigation. Full withdrawal clears the remembered consent and discards
  the in-memory workspace. The confirmation uses the red primary action to return
  from training to the homepage with `nav-back`. On other pages, the gray secondary
  action dismisses the confirmation in place.
  Concurrent theme, menu and route updates can supersede a pending native snapshot.
  React may skip that visual transition to preserve synchronous interaction; do not
  delay navigation or focus to serialize decorative work.
  Source-page training setup uses its own dialog exit. Flow starts only after the
  portal has left the DOM, so the page snapshot contains the workspace alone.
  Direct entry opens the inline dialog immediately when consent is required.
  History navigation waits for route capture to settle before opening a fresh dialog.
  The native 500 document and the homepage opt in to the browser's document
  transition for recovery. The shared fade captures the main content, with the
  shell outside the capture. Every App Router document includes the same hashed
  stylesheet in its head, so its document CSP permits the rule across client
  navigation. A media condition enables it only on the homepage or native 500
  document and when motion is allowed. Initially visible homepage content skips
  the additional component entrance after a 500 recovery.
  During the Animate UI theme wipe, only the theme Switch receives a separate
  named live capture. Its old capture is transparent and its group has no independent
  animation, so the existing Animate UI thumb spring remains visible immediately
  in both directions. The Base UI switch retains its DOM node and thumb spring
  during the theme update. Native document capture continues to intercept pointer
  clicks during the wipe; keyboard selection and state updates remain immediate.
  Each pathname change alternates the main content's capture name. This keeps
  the departing and arriving pages at their own sizes and scroll positions.
  External CSS animates their opacity, horizontal translation and blur and excludes
  the document root from route captures. Motion's exact constant reset style
  is emitted during SSG for the shared legal selection and covered by the hash CSP.
  Destination preparation uses the native Next router cache.
- The hero adapts the Animate UI Topography WebGL renderer. The first pass computes
  the loop's reflections and refraction. Its front-surface search is bounded to the
  ring and its soft edge. The two ellipsoid droplets use direct ray intersections
  and surface normals. The second pass resolves edge coverage at output resolution.
  Desktop homepage playback starts at up to 2× display
  scaling, 300,000 field texels and 4,147,200 output pixels. Mobile and error artwork
  start at up to 1.5× display scaling, 150,000 field texels and 2,073,600 output pixels.
  Sustained frame cadence can raise
  both passes to 3× display scaling, 600,000 field texels and 8,294,400 output pixels,
  subject to GPU dimension limits. Sustained slow frames can lower the renderer
  to 0.8× display scaling, 40,000 field texels and 256,000 output pixels.
  After a reduction, six stable measurement windows allow
  the next higher tier to be tried again. Quality changes retain the Canvas
  and animation time.
  The loop's cross-section varies gently around its circumference. Its mobile
  and desktop WebP posters in `src/assets/hero/` show the shader's resting pose.
  They preserve the alpha channel so the themed stage shows through the glass.
  Next.js generates responsive optimizer URLs for the homepage, 404, 500 and
  in-app recovery posters. The static pages select the still through the browser's
  reduced-motion media query or the scripting-disabled fallback. The in-app
  recovery screen preloads the same candidates used by its `<picture>`.
  Both themes use the same ruby glass material. The loop turns and the droplets
  drift with moving highlights at up to 30 frames per second during autonomous
  playback. Each droplet follows its own path with a visible gap from the loop.
  Hover and light pulses use the available display cadence.
  Hovering pulls the glass toward the pointer. Clicking or tapping
  a droplet intensifies its light and motion; the loop carries a light pulse
  from the chosen angle. Overlapping pulses finish their full 2.6-second circuit.
  The shader runs up to 32 at once within the GPU's uniform budget. Further
  activations start as slots become free, including repeated taps at the same pixel.
  The artwork itself accepts Enter and Space and keeps
  the normal pointer cursor. The only separate control pauses or resumes playback.
  A shared Spinner glyph is visible in the initial HTML and Animate UI takes
  over its motion after hydration. The first successful draw removes it.
  Where parallel compilation is available, the renderer checks the readiness of
  both GPU programs on its frame loop.
  Visibility and intent share one renderer import promise. The homepage and the
  static error pages start preparing the renderer after the visible artwork has
  had a chance to paint, even while the document is still loading.
  The in-app recovery artwork keeps its static poster while playback loads.
  The resolved component mounts directly on the client after any incoming page
  transition.
  The poster is used for reduced motion, unsupported WebGL or context loss.
  Reduced motion, a hidden tab or a lost context unmounts the enhancement and
  disposes its renderer.
  The homepage and error artwork pause the render loop when the artwork leaves
  the viewport and retain a single bounded canvas for the active page. Scrolling
  back resumes the same frame without reinitializing WebGL. Explicit pause retains the current GPU image,
  stops frame, pointer-spring and ripple playback, and freezes parallax. Pausing
  or scrolling away detaches the parallax scroll subscription. On resume, the
  current scroll position updates the retained offset and playback continues at
  the same animation time. Resizing can redraw the paused image without
  advancing time. No CPU animation fallback runs. The scene performs
  no ML inference or external data request.
  The artwork responds to a completed tap and leaves touch scrolling available.
  The headline pairs light type with a red accent. Its full text is visible in
  static HTML.
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
- Training step activation uses the native Flow keyframes from route changes
  with a shorter glide and a crossfade for the workspace. Explicit step changes
  from the step bar or panel actions capture the outgoing and incoming panels
  separately. The snapshots glide across the workspace gutters to the viewport
  edges. The outgoing panel's snapshot fades out while only the new panel
  is interactive and its heading takes focus. The heading scrolls into view when
  needed. Prepared panels stay hidden until activation, and any remaining module
  update commits with the selection. Reduced motion and unsupported browsers
  switch without capture.
- The shared animated-list recipe owns class insertion, removal and positional
  reflow, using stable class IDs, reduced-motion configuration and hydration-safe
  initial markup. Exiting classes become inert and hidden from assistive technology
  immediately; focus moves to a remaining neighbor or the workspace heading.
  Supported `AnimatePresence mode="sync"` retains the fading exit in document flow,
  then Motion's `layout="position"` reflows the remaining classes. Motion's
  `popLayout` appends a style element at runtime before inserting the positioning rule.
  The strict SSG hash CSP blocks that style element. Sync presence preserves one
  motion owner without adding an empty-style hash, nonce, custom geometry engine
  or relaxed policy.
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
  The result Alert presents the recognized class and vote sentence immediately.
  Beside them, the three neighbors retain their circle or square shapes. Their
  paths converge into one line that reveals the winning animal in a ruby seal.
  Animate UI draws this sequence once per prediction. Reduced motion shows the
  completed diagram immediately. The painted Alert owns hover and tap feedback
  for the animal icon, and the outer status region announces the text. The
  footer reserves space across replay states.
  Below-fold reveals use `EntryReveal`; Effect measures the actual content surface,
  outside display-contents icon wrappers. ScrollReveal keeps the shared whole-group
  icon hover context and delegates entry to this composition.
  Primary headings and actions remain visible in static HTML.
- The home experiments keep the static SVGs in the initial HTML. The shared
  preview loader prepares playback as the cards approach the viewport or when a
  relevant control receives focus. Intent at the mini-experiments link also
  prepares the example image. The everyday image-recognition
  quiz prepares its optional feedback controls on choice intent and mounts the
  explanation tooltip only after an answer.
- The gallery virtualizer owns placement. Scroll admission does not replay entry
  effects. The illustration is bounded to two 6-by-6 feature maps, six vector bars,
  18 synthetic points, three neighbor connections and two readout bars. Finite user-triggered sequences
  need no virtualizer, continuous rendering loop or scene engine.

Old node-glow CSS and custom focus/scroll-lock implementations are removed. Avoid
competing CSS transitions on properties already owned by Animate UI.

## Explicit integration boundaries

The MobileNet feature maps and KNN neighborhood are explanatory SVG illustrations,
not measured model activations or an interactive statistical chart. The official
[Chart catalog](https://ui.shadcn.com/docs/components/base/chart) has no algorithm
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
ImagePlus, Square, Stethoscope, SwitchCamera and VideoOff producers. Their original Lucide
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
These integrations preserve the initial content and the existing CSP with
the installed Animate UI and Motion components.

Shared `ActionFeedback` keeps AnimateIcon in a layout-neutral `display: contents`
parent and places ButtonPrimitive's press Slot directly on the native button or
navigation anchor.
`initial={false}` keeps static HTML style-free. The numeric `whileTap.scale`
uses the existing Animate UI press token and spring. Motion resolves the
untransformed state to a scale of 1, so release and cancellation restore the
control without a post-hydration style write. The shared reduced-motion
preference disables the press transform.

The shared dialog uses Animate UI for the popup and scrim and React Remove Scroll
with `removeScrollBar={false}`, `inert={false}` and pinch zoom enabled.
The translucent scrim uses a flat color and keeps the native scrollbar visible.
The regular dialog applies the scrim on opening before the popup becomes
visible. Animate UI owns the popup entrance and the scrim's exit.

Base UI's Popup requires a portal, which is mounted in the browser. The shared
Dialog's `initialContent` variant renders an open native HTML dialog inline at build
time. Hydration promotes the existing element to modal with `showModal()` before
paint. The original node remains mounted across the setup steps. The inline
dialog and its scrim fade together on close through the Animate UI Effect.
The final setup content remains visible until exit completes, then the workspace
can show the camera-error toast.
Consent, model loading and the optional camera choice share one surface and scrim.
Each step change focuses the incoming heading. The outgoing panel becomes inert
as it slides out of the layout. The incoming Animate UI Effect uses a short
horizontal offset for the step change.
A measured height animation follows the active panel and can be interrupted by
the next step. This preserves natural height in static HTML and bypasses the
initial zero height of Animate UI's AutoHeight. Reduced motion skips both movements.
Later-opening product dialogs use Animate UI's portal for entry and exit. Closing
releases modality and restores focus to the appropriate workspace control while
the inert visual exit completes.

[Third-party notices](third-party-notices.md) preserve upstream license conditions.
