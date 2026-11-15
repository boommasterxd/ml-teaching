# Architecture

ML Teaching is a German educational image-classification application. Next.js App
Router renders public content and metadata at build time. It has no Express server,
React Router, API routes, database or authentication layer.

## Source boundaries

- `src/app/`: Server Component route entrypoints, shared layout, native metadata,
  robots, sitemap, static social image and error boundaries.
- `src/screens/`: page compositions; only the learning workspace is a client root.
- `src/components/`: shared product UI and the local shadcn/Animate UI compositions.
- `src/content/`: static educational and controlled legal content.
- `src/hooks/`: browser workspace, consent, class, camera, model and prediction logic.
- `src/lib/`: browser ML imports, image processing and shared site configuration.
- `csp/`: the adopted guarded native build adapter and artifact verifier.

The only routed Pages Router entry is `src/pages/500.tsx`, a CSP-compatible native
error output required by the adopted error integration. Its `_app.tsx` and
`_document.tsx` helpers share global styles and the German document language. Ordinary screen components must
not live in `src/pages/`, where Next.js would expose unintended routes.

## Browser ML flow

1. The learning route starts with an explicit consent dialog. No TensorFlow runtime,
   model weights or camera stream is needed to render the page.
2. After model consent, the browser imports TensorFlow.js and loads MobileNet.
   The WebGL backend and compiled kernels are reusable within the document.
3. Camera access starts only after separate camera consent and browser permission.
   Selected local files and captures are resized for local feature extraction.
4. Training requires complete selected upload batches and no active image work.
   New capture and file selection are disabled during training. It creates a
   replacement KNN classifier from the completed features. A stale or
   abandoned training run cannot publish its result.
5. Prediction processes one frame at a time. Stopping or leaving invalidates late
   results. Route cleanup stops camera tracks and disposes classifiers and models.

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

A model download is a consent-gated one-time asset load, not interactive server
state: TanStack Query is therefore unnecessary. TanStack Virtual owns thumbnail
windowing. There are no shared server entities, reactive joins or SQL operations
that justify TanStack DB, Table, Drizzle or Turso. Class-name editing remains a
small local field without a separate form submission or validation schema.

## Delivery

All five public routes use SSG and fixed hash CSP, including the initially rendered
learning workspace. Runtime ML remains in the browser. The native production
server and Vercel adapter own production delivery; no custom server, production
Proxy or separate static export replaces native Next.js output. Development alone
discovers `src/proxy.dev.ts` for nonce-based CSP Report-Only diagnostics with
no-store delivery, as described in [development](development.md).

[SSG and CSP](decisions/ssg-and-csp.md) describes the atomic build/header contract.
[Deployment](deployment.md) separates prepared source from provider activation.
