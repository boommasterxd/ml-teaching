<p align="center">
  <img src="./public/apple-icon.png" width="64" height="64" alt="" />
</p>

<h1 align="center">ML Teaching</h1>

<p align="center">
  Explore how machines learn. A free, ad-free learning lab in German where children
  can try image recognition and train a classifier in their browser.
</p>

<p align="center">
  <a href="https://mlteaching.boomapps.de/lernen">Open the learning lab</a> ·
  <a href="#quick-start">Run locally</a> ·
  <a href="docs/architecture.md">Explore the architecture</a>
</p>

## What you can do

| Activity                      | What you do                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| Explore image recognition     | Follow an illustrated example from image to predicted class.                             |
| Try two exercises             | Find everyday uses of image recognition and classify points with KNN.                    |
| Train your own classifier     | Collect webcam images or choose local files, then test predictions.                      |
| Preview reward-based learning | Watch two example paths on the homepage. The Q-learning lesson and exercise are planned. |

## Quick start

Use Node.js 26.x LTS and npm. Training requires a browser with WebGL and access
to the external MobileNet provider for the initial model download, including
when running locally with your own image files. Camera access requires HTTPS
or localhost and separate browser permission.

```sh
npm ci --no-audit
npm run dev
```

Open [localhost:3000](http://localhost:3000), choose **Bilderkennung** in the
learning lab and open the practice page. The model downloads after you consent.
If it fails to load, check your connection and select **Erneut versuchen**.
See [development checks](docs/development.md#checks) for the model-provider smoke
test. You can supply local image files without enabling the camera.

## Data, providers and costs

Training images, class names, features and classifier state stay in browser
memory, as does quiz progress. If you choose to remember training consent, the
document keeps that consent and your camera choice in memory for up to 30 minutes
so you can return to training within the same document. A training visit already
in progress can continue after that deadline. Reloading or opening the training
in a new document asks for consent again. The appearance setting is stored on
your device only when you choose to remember it.

The browser downloads pretrained MobileNet weights after consent. Google and
Kaggle receive connection metadata during the download, and model files can
remain in the browser's HTTP cache. Vercel processes website connection data.
See the [privacy policy](https://mlteaching.boomapps.de/datenschutz).

The app has no accounts, database, image-upload API or analytics. It serves
fonts locally and requires no API keys or paid model services. Hosting bandwidth
and image optimization can incur provider costs. See [deployment](docs/deployment.md)
for the hosting setup.

## Development

```sh
npm run ci
npm run audit
npm run build
npx playwright install chromium
npm run test:e2e
```

Run `npm start` to serve the verified production build locally. Playwright starts
its own production server for browser tests. See [development](docs/development.md)
for prerequisites and focused checks, and [CI](docs/ci.md) for PR checks.

Next.js builds public pages with strict hash-based CSP. TensorFlow.js and camera
processing run in the browser. See [architecture](docs/architecture.md) and the
[design system](docs/design-system.md) for the application boundaries and shared UI.

## Contributing and security

The repository owner and invited collaborators can open pull requests. Work on a
branch and use English Conventional Commits. See [AGENTS.md](AGENTS.md) for
repository rules and the documentation index. Merging and publication require
explicit authorization.

Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).
Application code uses the [MIT license](LICENSE.txt). See the
[third-party notices](docs/third-party-notices.md) for upstream license terms,
including Animate UI's Commons Clause.
