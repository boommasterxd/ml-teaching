import { expect, test, type Request } from '@playwright/test';
import sharp from 'sharp';
import siteConfig from '../../csp.config.mjs';
import { ML } from '../../src/constants';
import { learningPaths } from '../../src/lib/learning-paths';
import contract from '../unit/lib/fixtures/mobilenet-v2-embedding.json' with { type: 'json' };
import { grantModelConsent } from './training-keyboard';

const graph = new URL(contract.modelUrl);
const modelDirectory = new URL('.', graph);

function isModelFile(url: URL) {
  return (
    url.href === graph.href ||
    (url.origin === modelDirectory.origin &&
      url.pathname.startsWith(modelDirectory.pathname) &&
      /^[\w.-]+\.bin$/.test(url.pathname.slice(modelDirectory.pathname.length)) &&
      url.search === graph.search)
  );
}

function isLocalAsset(url: URL) {
  return (
    !url.search &&
    /^(?:\/_next\/static\/[\w./-]+|\/favicon(?:-dark|-light)?\.svg|\/apple-icon\.png)$/.test(
      url.pathname,
    )
  );
}

function isRead(request: Request) {
  return request.method() === 'GET' && request.postDataBuffer() === null;
}

test('the public MobileNet model extracts features from a synthetic local image', async ({
  page,
  baseURL,
}) => {
  const localOrigin = new URL(baseURL!).origin;
  const modelOrigins = new Set(siteConfig.policies.base['connect-src']);
  const consent = Promise.withResolvers<boolean>();
  const modelRequests: string[] = [];
  const unexpected: string[] = [];

  page.on('request', (request) => {
    const previous = request.redirectedFrom();
    const url = new URL(request.url());
    if (previous && (!modelOrigins.has(url.origin) || !isRead(request))) {
      unexpected.push(`Unexpected redirect to ${url.origin}`);
    }
  });
  await page.route(/^https?:\/\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (isRead(request) && url.origin === localOrigin) {
      if (
        url.pathname === learningPaths.imagePractice &&
        !url.search &&
        request.isNavigationRequest()
      )
        return route.continue();
      if (isLocalAsset(url) && !request.isNavigationRequest()) return route.continue();
    }
    if (isRead(request) && isModelFile(url) && !request.isNavigationRequest()) {
      modelRequests.push(url.pathname);
      return (await consent.promise) ? route.continue() : route.abort();
    }
    unexpected.push(`${request.method()} ${url.origin} (${request.resourceType()})`);
    await route.abort();
  });

  try {
    await page.goto(learningPaths.imagePractice);
    expect(modelRequests).toEqual([]);
    await grantModelConsent(page);
    consent.resolve(true);
    const camera = page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
    await expect(camera).toBeVisible({ timeout: 40_000 });
    await camera.getByRole('button', { name: 'Ohne Kamera fortfahren' }).click();
    await expect(camera).toBeHidden();

    const buffer = await sharp({
      create: { width: 16, height: 16, channels: 3, background: '#f00' },
    })
      .png()
      .toBuffer();
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Bilder auswählen', exact: true }).first().click();
    await (await chooser).setFiles({ name: 'synthetic.png', mimeType: 'image/png', buffer });
    await expect(
      page.getByText(`1 / ${ML.MIN_IMAGES_PER_CLASS} Bilder`, { exact: true }),
    ).toBeVisible();
    await expect(page.locator('video')).toHaveCount(0);
    expect(modelRequests).toContain(graph.pathname);
    expect(modelRequests.some((path) => path.endsWith('.bin'))).toBe(true);
    expect(unexpected).toEqual([]);
  } finally {
    consent.resolve(false);
  }
});
