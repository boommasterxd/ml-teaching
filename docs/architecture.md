# Architecture

ML Teaching is a German educational platform for learning about machine learning.
Image classification is implemented. The homepage previews learning through rewards.
Next.js App Router renders public content and metadata at build time. It has no Express server,
React Router, API routes, database or authentication layer.

## Source boundaries

- `src/app/`: Server Component route entrypoints, shared layout, native metadata,
  robots, sitemap, static social image and error boundaries.
- `src/screens/`: page compositions; only the learning workspace is a client root.
- `src/components/`: shared product UI and the local shadcn/Animate UI compositions.
- `src/components/hero/`: static landing posters and optional decorative/demo clients.
- `src/components/icons/`: per-icon client entries with a shared style-free SSG fallback.
- `src/components/theme/`: persistent appearance state and intent-loaded settings.
- `src/content/`: static educational and controlled legal content.
- `src/hooks/`: browser workspace, consent, class, camera, model and prediction logic.
- `src/lib/`: browser ML imports, image processing and shared site configuration.
- `src/app/fonts/`: local font assets loaded through `src/lib/fonts.ts`.
- `csp/`: the adopted guarded native build adapter and artifact verifier.

The only routed Pages Router entry is `src/pages/500.tsx`, a CSP-compatible native
error output required by the adopted error integration. Its `_document.tsx`
keeps the shared German document language. Its `_app.tsx` loads `pages-error.css`
with the shared site foundation and the styles for the header, footer and
error scene. Ordinary screen components live in `src/screens/` to avoid
exposing them as Pages Router entries.

## Shared shell and progressive enhancement

The homepage links to the learning-area selection at `/lernen` and offers
two automatic previews and a direct link to image training. The learning hub
links to image training and its explanation. Both screens read the reward
practice availability from `src/content/learning-areas.ts`.
`/lernen/bilderkennung` contains the image-learning explanation, demonstrations and
quizzes; `/lernen/bilderkennung/ausprobieren` owns the existing browser training
workspace. See [Browser ML flow](#browser-ml-flow) for training entry, consent
and resource cleanup.
`src/lib/learning-paths.ts` centralizes these destinations for navigation.
`/lernen/q-learning` shows the German title “Q-Learning verstehen”, an availability
notice for the upcoming introduction and a link back to the learning hub.
`/lernen/q-learning/ausprobieren` shows the availability notice and a link
back to the hub while the exercise is pending. Both pending routes carry
`noindex, follow` and are omitted from the sitemap and the links in `llms.txt`.

The root Server Component renders the shared header, main content and footer.
Shared CSS tokens supply the light and dark backgrounds, glass surfaces and red
accent colors for the learning, practice, legal and error pages.
`ThemeProvider` manages appearance. It wraps `TrainingEntryProvider`, which
manages the in-memory training session outside the shared Flow `PageTransition`.
The training workspace owns its local state and stays mounted across theme changes.
A persistent React ViewTransition applies the Animate UI Flow preset to the main
content on typed route changes. Public pages remain complete SSG documents; the
transition wrapper is a small client boundary without request-time reads. A trusted
static bootstrap applies a valid remembered light/dark/system selection or the
operating-system preference. Only explicit remembering writes the single enum key;
there is no theme service or server personalization. The local font and brand
assets require no external font provider.

Entry reveals, the Flow transition, the homepage header surface and glass
artwork share one browser listener for the operating-system reduced-motion
preference. They still resolve local Animate UI overrides before applying it.

Shared `IntentLink` keeps native Next.js links and a fixed `prefetch={false}`
while mouse or pen intent and keyboard focus call `router.prefetch` for other
same-origin routes. Sustained touch preparation starts after 80 ms, so a short tap
can navigate without a parallel prefetch. Training links prepare on touch-down
because setup precedes navigation. Native router caches reuse prepared work.
Activation stays immediate if preparation is still pending, when Next.js can
make a full request. After 100 ms of pending native navigation, the activated
link shows a spinner in place of its action icon or before its label when it has
no icon. Animate UI opens the spinner space before an iconless label, with an
immediate change under reduced motion. A visually hidden live region outside the link announces the status
without changing the link name. Focus stays on the active control while waiting.
The feedback clears when navigation settles. Intent warming alone leaves the
indicator hidden. Training setup uses the same icon slot with its own pending state.
There is no second cache or automatic invalidation loop.
Viewport admission alone does not load another page. Caller event handlers,
refs, modified clicks and route transition types remain native. Current
path/search and fragment-only navigation do not prepare another route.

The current complete static routes have no loading-only prefetch boundary. Native
preparation includes the route tree, leaf page and build-time initial content.
Direct-entry setup's cancel action and the model-error return action warm the same
image explanation route through native router prefetch. Their activation uses the
existing backward transition type. Next.js can restore cached history entries synchronously,
outside React's view transition. Where the Navigation API supports precommit interception,
eligible same-document Back and Forward traversals use a browser-owned Flow capture;
Next.js still restores the original entry. A training dialog needed after history
navigation opens after route capture settles. The legal sidebar's Back link also
supports browser-owned capture and exposes the previous
same-origin address, including query and fragment, when available. Intent-based
route preparation runs for the fallback homepage link. Actual history traversal
reuses the browser's entry and the router's stored state.

For App Router destinations, intent warms the build-rendered RSC payload and
the modules referenced by it. The homepage still is prepared for reduced motion.
It and the image explanation photos use the same responsive asset selection
during intent and destination rendering.
React Flow creates the destination's browser tree
on actual navigation within the current document. Browser speculation prerenders
a separate document, which cannot supply that same-document transition. Training
links open setup outside the page capture. Flow starts after the dialog exits.

The Pages Router's static 500 document shows the same inline feedback after link
activation. It uses build-rendered Speculation Rules
covered by its hash CSP. Pointer entry, focus or pointer down selects at most
one canonical same-origin homepage, learning or legal link. A supporting
browser can prerender the selected document. The image practice page follows the
[Browser ML flow](#browser-ml-flow) on direct entry. Activation uses normal browser
navigation when preparation is unsupported or incomplete.
The homepage waits for its static main content to be parsed before the browser
can capture the incoming view of the document transition. This render hint
applies when motion is allowed and does not wait for hydration or artwork.
App Router recovery renders its text, actions and static poster immediately.
It loads the optional animated artwork when the recovery screen mounts, then
uses the shared visibility-gated artwork lifecycle.

The first stylesheet includes the small shared surface rules and homepage layout
rules. Bundling them together avoids separate render-blocking requests on the
homepage and shares the stylesheet across internal navigation. Tailwind derives
its utilities from application sources under `src/`. Next.js uses the default
Turbopack chunking rules in local and Vercel builds. Optional menus, experiments
and WebGL remain dynamically loaded.

The homepage and static error pages deliver their headings, actions and reserved
artwork area in static HTML. A responsive preload starts the optimized poster
request below the shared medium breakpoint, and the static picture can paint
before hydration. When the artwork and document are visible and motion is
allowed, the client can load
the shared module while waiting for paint. GPU setup begins on mount. Automatic
startup on the native 500 page also waits for document load and, where supported,
an idle opportunity. Pointer or keyboard intent can prepare the same module sooner.
The loading indicator appears after 500 ms of active waiting. A two-second
first-frame deadline ends waiting if the renderer has yet to draw. The resolved
component mounts directly on the client without a second Lazy/Suspense reveal
that could trigger a page update transition. On wider screens the poster loads
on demand, including for reduced motion, disabled scripting and renderer failure.
A successful first draw takes over the same artwork area without replacing the
responsive picture.
Static asset imports give the native optimizer versioned poster URLs that the
browser can reuse across visits. Each source uses the first candidate that reaches
its native resolution, so equivalent optimizer requests share a cache entry.
During playback, elapsed time turns the loop and moves the two droplets along
separate paths outside it.
Local input deforms their surfaces and lights the glass. Explicit pause or scrolling
the artwork out of view freezes playback on the retained canvas. These conditions
also detach the homepage's parallax scroll subscription. Scrolling back resumes
from the same animation time. Leaving the page, hiding the tab or requesting
reduced motion releases the canvas and renderer. See the
[playback decision](decisions/error-artwork-and-menus.md#shader-playback).
This renderer is independent of consent-gated ML WebGL and processes no training
data. The educational illustration starts with a server-rendered empty image placeholder,
labeled feature maps, neighbor points and class labels. Intent loads its animation module, prepares a
hidden React Activity and warms the selected native optimized image. Persistent
dog/cat Buttons record the choice; the sequence starts after image decoding and
the visible commit without moving focus. Learning steps advance only while the
diagram intersects the viewport and the document is visible. The sequence
continues from the current step when visibility returns. Public image
preparation is deduplicated, bounded to two assets and an eight-second
failure deadline, with explicit retry. The four-stage illustration uses synthetic
two-dimensional coordinates from `src/lib/network-demo.ts`. It computes both sets
of three nearest neighbors once and derives the highlighted points, votes and
output from the same examples. Its Euclidean plot is a simplified teaching schema;
the live classifier uses the installed library's normalized feature similarity.
The illustration never invokes the actual model or processes user images.
The shared header renders its triggers and prepares one module for the navigation
and appearance menus on pointer entry, focus or pointer down. After hydration,
a coarse pointer (`any-pointer: coarse`) also starts preparation. Both menus
open on interaction. While the module loads, navigation shows feedback beside
its trigger and the appearance button shows a spinner. Base UI positions the
loaded popups. Animate UI owns entry and exit. The mobile panel takes its initial
width from the toolbar anchor.
Enabled rows prepare their destinations on navigation intent. The appearance
popup anchors to the header on mobile and to its shared button on desktop. The
button retains its role across loading, focus and dismissal.

The everyday recognition quiz renders the same three matching and three nonmatching
examples before and after hydration. Replay selects a different set from the 40-entry
pool in `src/content/recognition-examples.ts` through `src/lib/recognition-quiz.ts`.
Small local React state tracks unique attempts and correct selections; explanations
mount only after an answer. It does not invoke ML, request a camera, send answers,
persist state or create a learning profile. Reset and document reload discard the
quiz state independently of model consent, theme preferences and the learning lab.

The KNN exercise opens automatically near the viewport. Pointer, focus and touch
intent can start the same retryable import. Each round generates twelve separated
synthetic points with a bounded random construction and ranks them once. Changing
K clears the previous answer and selection within that round. The explanatory
animation and exercise share ranking and voting in `src/lib/knn.ts` and point
glyphs. Children select the nearest 1 to 10 points before choosing the majority
class or a tie. Mistakes remain retryable. The exercise uses synthetic features
and keeps selections in memory.

## Public discovery

ML Teaching is a free, ad-free learning site. The learning hub publishes
`CollectionPage` structured data that references the available image recognition
lesson and practice by their canonical `LearningResource` identifiers. The
homepage's JSON-LD graph identifies the publisher by name and links to the
canonical imprint.

The image recognition lesson and training page render breadcrumbs at build time.
Both paths start at the learning hub. The training path also links back to the
lesson. The shared route list drives the visible breadcrumbs and the matching
`BreadcrumbList` JSON-LD with absolute canonical URLs. The static CSP includes
the hash of the rendered JSON-LD. On the training page, the breadcrumbs sit
inside the workspace and are inert while the consent dialog is open.

The generated `robots.txt` uses a wildcard allow rule for all paths and lists the
sitemap. Where services honor it, the rule allows search crawlers, model-training
crawlers and user-initiated fetchers. Search indexing also depends on page-level
robots metadata. Vercel bot protection and firewall rules apply independently.
[Google-Extended](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers#google-extended)
controls training and grounding for specified Gemini and Vertex AI services. It
does not affect inclusion or ranking in Google Search.

## Browser ML flow

The [children's consent decision](decisions/children-training-consent.md) records
how Article 8 GDPR applies to the current private educational offer.

1. Pointer entry, keyboard focus or pointer down on a training link prepares the
   static route, setup dialog, interactive workspace module and browser resource host.
   Activating the link opens setup on the source page. Cancel keeps that page open.
   Direct entry renders its initial consent dialog and inert collection frame in
   static HTML. Hydration makes the same dialog element modal when consent is needed.
   Base UI powers dialogs opened later. Declining direct-entry consent returns to the
   image explanation. The frame and active collection share card and gallery markup.
   When both required choices are selected, intent on the consent action prepares
   the workspace module and resource host. The provider mounts the host
   after model consent is granted or valid remembered consent is restored.
   Opt-in remembering keeps the choices in the current document's memory for up
   to 30 minutes. The deadline governs reentry
   through same-document navigation. Leaving the document clears consent and
   the workspace before the browser can cache the document for history traversal.
   Reloads, new documents and new tabs ask again. Within the document, the current
   workspace stays active until withdrawal or exit.
   Form, upload and gallery state mount in the interactive workspace after consent.
   Source-page setup waits for the workspace module before navigation. Setup
   shows a separate workspace loading or retry step when that module is pending or
   unavailable. Retrying it reuses the initialized model and camera.
   No TensorFlow runtime, model weights or camera stream is needed for initial HTML.
2. After model consent, the same dialog shows loading progress while the browser
   initializes TensorFlow.js and loads the KNN module. It downloads the MobileNet v2
   graph, warms it and extracts features in the browser. The resource host holds
   the WebGL backend for the active training session. Model loading, feature
   extraction, training and prediction keep it available until their in-flight
   work settles. Session cleanup releases the host's hold and retires the models.
   After the last hold ends, TensorFlow.js removes the backend. A later session
   initializes it again if it was released, using the already loaded code. The
   model error step can retry the resource host import or restart model loading.
   Same-document reentry with valid remembered consent opens on the loading step.
   Consent can be withdrawn during loading, after a model error or at the camera
   choice, including on direct entry. Withdrawal uses the shared cleanup and
   confirmation flow.
3. When the models are ready, the dialog presents the optional camera choice.
   Camera access starts only after separate camera consent and browser permission.
   The resource host stays mounted when source-page setup hands off to the training
   route, carrying over the initialized model, backend and any active stream. Remembered
   consent restores camera use only after the browser reports that permission is
   still granted. The visible
   collection step and the trained prediction step request the stream while camera
   consent is active and the workspace is unpaused.
   Selected local files and captures are resized for local feature extraction.
   The import rechecks class capacity after acquiring the shared upload slot and
   stops the batch before reading another original if the class is full.
   Import failures use the shared notification viewport and remain available until
   dismissed, superseded by a completed import, or cleared with the class or workspace.
4. Training requires complete selected upload batches and no active image work.
   New capture and file selection are disabled during training. It creates a
   replacement KNN classifier from one normalized feature matrix per class. A stale
   or abandoned training run cannot publish its result. Retired classifiers and
   models are disposed after their active users release them.
5. Prediction processes one frame at a time. Pausing the camera or hiding the
   document stops inference and releases the stream. Switching directly between
   collection and prediction reuses the stream, while entering training releases
   it. Route cleanup stops camera tracks and disposes classifiers and models.

Full training withdrawal clears the remembered choice, resets the workspace and
releases training resources. The confirmation opens after the preceding dialog
closes. Its single action returns visitors from the training workspace to the
homepage. Outside the workspace, the action dismisses the confirmation and keeps
the current page. A separate training entry starts fresh consent.

Activating the live view or expressing intent through its Play control can prepare
a local PCA projection of the normalized training features in interruptible batches.
Play intent alone never requests a camera stream. The fitted axes and projected
examples are reused while the ordered class IDs and their image arrays are
unchanged, including across name edits.
While visible, the plot samples the same embedding already produced for live
classification and moves its marker independently from the classifier, which uses
the full feature vector. At most one optional embedding read can be active. It
retains the tensor and WebGL backend until it settles, without delaying the next
classification frame.
Images, features, class names and classifier state are never sent to an app server.
Local file preparation shares one global FIFO slot across classes, with at most
15 waiting files. Before native decoding, bounded file bytes and header dimensions
must satisfy 32 MiB, 64 million pixels and 16,384 pixels per axis; decoded dimensions
are checked again. PNG, GIF and WebP dimensions use at most the first 40 bytes;
JPEG and ISO-based formats can require reading the bounded original file.
Header reading and decoding have a combined 15-second deadline
after admission. The slot remains occupied through the existing feature-extraction
pipeline, and errors release it so later valid files can continue. Object URLs,
readers and image handlers are cleaned up on completion or cancellation. These
limits bound input admission, not the browser's total memory or immediate native
codec cancellation. Local imports support JPEG, PNG, GIF, WebP, AVIF, HEIC and
HEIF. Each format requires a compatible native browser decoder.

A model download is a consent-gated one-time asset load. TanStack Virtual owns
thumbnail windowing. Empty galleries keep their server-rendered scroll region and
hint. Pointer entry, keyboard focus and touch intent on the upload and capture
controls prepare the shared row module. Direct file selection and the first
collected image also start or reuse the same import. With images available,
virtual row geometry and scroll position stay available. Thumbnail nodes and
fade effects appear near the page viewport or while focus is in the gallery.
Capture and image-removal callbacks read current class and dialog state without
changing identity on each gallery update.

Prediction attaches its video once the stream and active prediction are ready.
Live inference and video attachment pause outside the prediction viewport. The
authorized stream stays connected so both can resume when the panel returns.
Collection previews attach video while visible or while a capture is active.
Hiding the document stops capture and releases the camera tracks. Pause releases the
tracks and keeps camera consent. The pause persists across training steps until Play
restarts the stream. The settings action to turn off the camera withdraws consent.
Play then opens the camera choice while retaining the local training workspace.
The browser enforces its own camera permission when a stream opens. A superseded
camera request stops any tracks it receives late. A capture finishing after its
stream becomes inactive or its class is reset is discarded.
Touch-and-hold capture buffers completed images locally until the user releases
on the capture button. Cancellation discards the batch. An ended gesture cannot
publish late frames. Normal release checks the current class, stream and capacity
before adding the ready images together.

Training and prediction panels prepare on user intent. Failed panel loads offer a
retry. A failed chunk that requires a document reload warns that in-memory training
data will be lost.
When the camera can start automatically, prediction intent also prepares the local
feature projection in parallel with the panel. The workspace shares one preparation
across intent and opening, reuses it after class renames, and discards it when the
trained image set changes or the workspace ends.
There are no shared server entities, reactive joins or SQL operations
that justify TanStack DB, Table, Drizzle or Turso. React Hook Form keeps the
class-name fields in memory, and a shared Zod schema validates them before training.

## Delivery

All nine public routes use SSG and fixed hash CSP. The [Browser ML flow](#browser-ml-flow)
describes the training route's static content and browser-only runtime. The native
production server and Vercel adapter own delivery.
Development alone discovers `src/proxy.dev.ts` for nonce-based CSP Report-Only diagnostics with
no-store delivery, as described in [development](development.md).

[SSG and CSP](decisions/ssg-and-csp.md) describes the atomic build/header contract.
[Deployment](deployment.md) separates prepared source from provider activation.
