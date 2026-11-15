# ML Teaching

Learn image classification by collecting examples, training a classifier and testing
predictions directly in your browser. The interface is in German.

[Quick start](#quick-start) · [Architecture](docs/architecture.md) ·
[Development](docs/development.md) · [Security](SECURITY.md)

## What you can do

| Workflow                                              | Result                                                                                         |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Explore the neural-network demonstration              | Follow an illustrated classification step by step.                                             |
| Collect webcam images or select local files           | Build named training classes without uploading images.                                         |
| Extract MobileNet features and train a KNN classifier | Compare examples locally using TensorFlow.js and WebGL.                                        |
| Test live predictions                                 | See class confidence and revise your training data.                                            |
| Reset the learning workspace                          | Discard classes, examples, trained KNN data and predictions; retain consent and camera access. |
| Leave or reload the learning workspace                | Discard the in-memory workspace and consent; release camera and model resources.               |

## Quick start

Use **Node.js 26.x LTS** and npm. A modern browser with WebGL is required for
training. Webcam access requires HTTPS, or localhost during development.

```sh
npm ci --no-audit
npm run dev
```

Open [localhost:3000](http://localhost:3000). Accept the optional model download
before training, then separately allow camera access if you want to capture images.

For the native production server:

```sh
npm run build
npm start
```

The source targets **ML Teaching** at `https://mlteaching.boomapps.de` on Vercel.
The new domain and provider configuration are prepared separately from publication.
The legacy repository name is retained for existing source links. This project is
independent of Google Teachable Machine.

## Data, providers and costs

Training images, class names, extracted features and the trained KNN classifier stay
in browser memory. The app has no database, account system or image-upload API.
Consent is not persisted. Reloading discards the workspace and asks again.

After explicit consent, the browser downloads pretrained MobileNet weights from
Google. Google receives connection metadata during those downloads; the app sends
no training images. Model files can remain in the browser's ordinary HTTP cache.
The proposed Vercel host processes website connection data. See the in-app
[privacy page source](src/screens/PrivacyPage.tsx) and
[deployment boundaries](docs/deployment.md).

There are no application API keys or paid model APIs to configure. Hosting bandwidth
and native image optimization can incur provider costs. No billing estimates or
provider plan guarantees are implied. The app has no analytics, advertising or
external fonts.

## Development

```sh
npm run ci                 # Formatting, lint, types, boundaries, quality, audit and coverage
npm run build              # One native Next build with strict hash-CSP verification
npx playwright install --only-shell chromium
npm run test:e2e           # Native production server, keyboard, consent and axe checks
npm run audit              # Full dependency tree, including development dependencies
```

Full test commands remain unfiltered locally, including when `CI=true`.
[Development](docs/development.md) explains focused checks;
[CI](docs/ci.md) explains the PR selection and required gate.

Pages and layouts are Server Components, rendered at build time. Browser-only ML,
camera and interactive controls live in small client subtrees. See
[architecture](docs/architecture.md), [design system](docs/design-system.md), and
[the SSG/CSP decision](docs/decisions/ssg-and-csp.md).

## Contributing and security

Work on a development branch. Use English Conventional Commits and keep changes
reviewable. Publication, merging and provider changes require explicit authorization;
this migration must remain off `main` until approved. See [AGENTS.md](AGENTS.md) for
the complete documentation index and repository controls.

Report vulnerabilities using [SECURITY.md](SECURITY.md). Application code uses the
[MIT license](LICENSE.txt). Upstream components and icons retain their own license
terms, including Animate UI's Commons Clause condition; see
[third-party notices](docs/third-party-notices.md). No downloadable release is
published by this source migration.
