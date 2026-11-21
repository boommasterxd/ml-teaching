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
workspace and its consent flow. The header menu links to the image explanation.
Declining consent also returns there. Consent withdrawal reloads the practice URL as a new document.
`src/lib/learning-paths.ts` centralizes these destinations for navigation.
`/lernen/q-learning` shows a static availability notice for the upcoming lesson.
`/lernen/q-learning/ausprobieren` shows the availability notice and a link
back to the hub while the exercise is pending. Both pending routes carry
`noindex, follow` and are omitted from the sitemap and the links in `llms.txt`.

The root Server Component renders the shared header, main content and footer.
Shared CSS tokens supply the light and dark backgrounds, glass surfaces and red
accent colors for the learning, practice, legal and error pages.
ThemeProvider encloses them outside the shared Flow PageTransition. A persistent
React ViewTransition applies the Animate UI Flow preset to the main content on
typed route changes. Public pages remain
complete SSG documents; the transition wrapper is a small client boundary and does
not add request-time reads. ThemeProvider preserves both
appearance and private in-memory training state across theme changes. A trusted
static bootstrap applies a valid remembered light/dark/system selection or the
operating-system preference. Only explicit remembering writes the single enum key;
there is no theme service or server personalization. The local font and brand
assets require no external font provider.

Entry reveals, the Flow transition, the homepage header surface and glass
artwork share one browser listener for the operating-system reduced-motion
preference. They still resolve local Animate UI overrides before applying it.

Shared `IntentLink` keeps native Next.js links and a fixed `prefetch={false}`
while pointer entry, keyboard focus and pointer down call `router.prefetch` for
other same-origin routes. Native router caches reuse in-flight and prepared work;
there is no second cache or automatic invalidation loop. Viewport admission alone
does not load another page. Caller event handlers, refs, modified clicks and route
transition types remain native. Current path/search and fragment-only navigation
do not prepare another route.

The current complete static routes have no loading-only prefetch boundary. Native
preparation includes the route tree, leaf page and build-time initial content.
The training setup's cancel action and the model-error return action warm the same
image explanation route through native router prefetch. Their activation uses the
existing backward transition type. Next.js can restore cached history entries synchronously,
outside React's view transition. Where the Navigation API supports precommit interception,
eligible same-document Back and Forward traversals use a browser-owned Flow capture;
Next.js still restores the original entry. The training consent route is excluded
from capture. The legal sidebar's Back link also supports browser-owned capture and exposes the previous
same-origin address, including query and fragment, when available. Intent-based
route preparation runs for the fallback homepage link. Actual history traversal
reuses the browser's entry and the router's stored state.

For App Router destinations, intent warms the build-rendered RSC payload and
the modules referenced by it. The homepage still is prepared for reduced motion.
It and the image explanation photos use the same responsive asset selection
during intent and destination rendering.
React Flow creates the destination's browser tree
on actual navigation within the current document. Browser speculation prerenders
a separate document, which cannot supply that same-document transition. Dialog
autofocus starts on arrival, and model and camera work follow explicit consent.
Direct entry serves the initial consent as part of the static HTML. Consent
withdrawal uses a full document reload to discard the private workspace.
The Pages Router's static 500 recovery action starts an App Router document
navigation through the browser.
App Router recovery renders its text, actions and responsive poster immediately.
It requests the error artwork's playback module only when the recovery screen mounts.

The first stylesheet includes the small shared surface rules and homepage layout
rules. Bundling them together avoids separate render-blocking requests on the
homepage and shares the stylesheet across internal navigation. Tailwind derives
its utilities from application sources under `src/`. Next.js uses the default
Turbopack chunking rules in local and Vercel builds. Optional menus, experiments
and WebGL remain dynamically loaded.

The homepage and static error pages deliver their headings, actions and artwork
loading indicator in static HTML. When the artwork and document are visible and
motion is allowed, the client starts loading the shared WebGL renderer after the
initial paint. Visibility and intent share the module import. The first draw
replaces the indicator. The resolved component mounts directly on the client
without a second Lazy/Suspense reveal that could trigger a page update transition.
Reduced motion, disabled scripting and renderer failure use a responsive still.
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
data. The educational illustration starts with a server-rendered Input placeholder,
labeled feature maps, neighbor points and class labels. Intent loads its animation module, prepares a
hidden React Activity and warms the selected native optimized image. Persistent
dog/cat Buttons record the choice; the sequence starts after image decoding and
the visible commit, without moving focus or consuming steps during loading. Public
image preparation is deduplicated, bounded to two assets and an eight-second
failure deadline, with explicit retry. The four-stage illustration uses synthetic
two-dimensional coordinates from `src/lib/network-demo.ts`. It computes both sets
of three nearest neighbors once and derives the highlighted points, votes and
output from the same examples. Its Euclidean plot is a simplified teaching schema;
the live classifier uses the installed library's normalized feature similarity.
The illustration never invokes the actual model or processes user images.
The shared header renders its triggers and loads the navigation rows and their
icons on pointer entry, focus or pointer down. Base UI keeps the trigger and
positions its popup with a loading or retry state when it opens before the code
arrives. Animate UI owns entry and exit. The mobile panel takes its initial width
from the toolbar anchor. Enabled rows prepare their destinations on navigation
intent. The appearance popup loads its Base UI menu on intent. It anchors to the
header on mobile and to its shared button on desktop. The button retains its
role across loading, focus and dismissal.

The everyday recognition quiz samples three matching and three nonmatching examples
from the 40-entry pool in `src/content/recognition-examples.ts`. Six complete choices
are rendered during SSG; a stable hydration snapshot switches to a randomized browser
visit round. Replay selects a different set through `src/lib/recognition-quiz.ts`.
Small local React state tracks unique attempts and correct selections; explanations
mount only after an answer. It does not invoke ML, request a camera, send answers,
persist state or create a learning profile. Reset and document reload discard the
quiz state independently of model consent, theme preferences and the learning lab.

The KNN exercise loads near the viewport, with pointer/focus/touch intent warming
the same retryable module. Its twelve synthetic points and query use a bounded random
construction with separated targets. The round ranks its points once. Changing
K clears the previous answer and selection within that round. The explanatory
animation and exercise share ranking and voting in `src/lib/knn.ts` and point
glyphs. Children select the nearest 1 to 10 points before choosing the majority
class or a tie. Mistakes remain retryable. The exercise uses synthetic features
and keeps selections in memory.

## Public discovery

ML Teaching is a free, ad-free learning site. The learning hub publishes
`CollectionPage` structured data that references the available image recognition
lesson and practice by their canonical `LearningResource` identifiers.

The generated `robots.txt` allows all user agents on all paths and identifies the
sitemap. It has no separate rules for search, model training or user-initiated
retrieval; services follow this guidance according to their own crawler behavior.
[Google-Extended](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers#google-extended)
controls training and grounding for specified Gemini and Vertex AI services. It
does not affect inclusion or ranking in Google Search.

## Browser ML flow

1. The learning route starts with an explicit consent dialog. No TensorFlow runtime,
   model weights or camera stream is needed to render the page.
2. After model consent, the same dialog shows loading progress while the browser
   initializes TensorFlow.js and loads the KNN module. It downloads the MobileNet v2
   graph, warms it and extracts features in the browser. Loading can be aborted and
   graph resources are disposed when no longer in use. The WebGL backend and compiled
   kernels are reusable within the document.
3. When the models are ready, the dialog presents the optional camera choice.
   Camera access starts only after separate camera consent and browser permission.
   The visible collection step requests the stream while consent is active. The
   prediction step starts it automatically after activation with a trained classifier
   and camera consent.
   Selected local files and captures are resized for local feature extraction.
4. Training requires complete selected upload batches and no active image work.
   New capture and file selection are disabled during training. It creates a
   replacement KNN classifier from one normalized feature matrix per class. A stale
   or abandoned training run cannot publish its result. Retired classifiers and
   models are disposed after their active users release them.
5. Prediction processes one frame at a time. Turning the camera off or hiding the
   document stops inference and releases the stream. Switching directly between
   collection and prediction reuses the stream, while entering training releases
   it. Returning to a visible prediction step reconnects while consent is active.
   Route cleanup stops camera tracks and disposes classifiers and models.

Activating the live view or expressing intent through its Play control can prepare
a local PCA projection of the normalized training features in interruptible batches.
Play intent alone never requests a camera stream. The fitted axes and projected
examples are reused while the ordered class IDs and their image arrays are
unchanged, including across name edits.
While visible, the plot samples the same embedding already produced for live
classification and moves its marker independently from the classifier, which uses
the full feature vector.
Images, features, class names and classifier state are never sent to an app server.
Local file preparation shares one global FIFO slot across classes, with at most
15 waiting files. Before native decoding, bounded file bytes and header dimensions
must satisfy 32 MiB, 64 million pixels and 16,384 pixels per axis; decoded dimensions
are checked again. Header reading and decoding have a combined 15-second deadline
after admission. The slot remains occupied through the existing feature-extraction
pipeline, and errors release it so later valid files can continue. Object URLs,
readers and image handlers are cleaned up on completion or cancellation. These
limits bound input admission, not the browser's total memory or immediate native
codec cancellation. HEIC/HEIF and other formats still require browser codec support.

A model download is a consent-gated one-time asset load. TanStack Virtual owns
thumbnail windowing. Empty galleries keep their server-rendered scroll region and
hint. Pointer entry, keyboard focus and touch intent on the upload and capture
controls prepare the shared row module. Direct file selection and the first
collected image also start or reuse the same import. Rendering and measurement of
real rows begin when image data is available and are released after the last
image is removed. Capture and image-removal callbacks read current class and dialog
state without changing identity on each gallery update.

Prediction attaches its video once the stream and active prediction are ready.
Collection previews attach video while visible or while a capture is active.
Hiding the document stops capture and releases the camera tracks. Returning to the
collection step in a visible document can reconnect the camera while consent remains
active. Turning the camera off clears the app's camera consent. Enabling it again
opens the camera choice while retaining the local training workspace. A superseded
camera request stops any tracks it receives late. A capture finishing after its
stream becomes inactive or its class is reset is discarded.

Training and prediction panels prepare on user intent. Failed panel loads offer a
retry. A failed chunk that requires a document reload warns that in-memory training
data will be lost.
There are no shared server entities, reactive joins or SQL operations
that justify TanStack DB, Table, Drizzle or Turso. Class-name editing remains a
small local field without a separate form submission or validation schema.

## Delivery

All nine public routes use SSG and fixed hash CSP, including the initially rendered
learning workspace and complete initial consent. The initial HTML dialog stays
inline through hydration and becomes modal on the same element. Base UI powers
dialogs opened later. Runtime ML remains in the browser. The native production
server and Vercel adapter own production delivery; no custom server, production
Proxy or separate static export replaces native Next.js output. Development alone
discovers `src/proxy.dev.ts` for nonce-based CSP Report-Only diagnostics with
no-store delivery, as described in [development](development.md).

[SSG and CSP](decisions/ssg-and-csp.md) describes the atomic build/header contract.
[Deployment](deployment.md) separates prepared source from provider activation.
