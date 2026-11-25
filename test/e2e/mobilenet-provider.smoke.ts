import { expect, test, type Request } from '@playwright/test';
import sharp from 'sharp';
import { ML } from '../../src/constants';
import { learningPaths } from '../../src/lib/learning-paths';
import contract from '../unit/lib/fixtures/mobilenet-v2-embedding.json' with { type: 'json' };
import { createModelDownloader, isModelFile, modelDirectory } from './mobilenet-provider-client';
import { observeModelConsentRequests, prepareModelConsent } from './training-keyboard';

function isLocalAsset(url: URL) {
  return (
    !url.search &&
    /^(?:\/_next\/static\/[\w./-]+|\/favicon\.svg|\/apple-icon\.png)$/.test(url.pathname)
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
  const consent = await observeModelConsentRequests(page, modelDirectory.href);
  const downloader = createModelDownloader(localOrigin);
  const modelRequests: string[] = [];
  const unexpected: string[] = [];

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
      const { submitted, earlyAttempts } = await consent.state();
      if (!submitted || earlyAttempts > 0) {
        unexpected.push('Model request before consent submission');
        return route.abort();
      }
      modelRequests.push(url.pathname);
      try {
        return await route.fulfill(await downloader.download(url));
      } catch (error) {
        unexpected.push(error instanceof Error ? error.message : 'Model download failed');
        return route.abort();
      }
    }
    unexpected.push(`${request.method()} ${url.origin} (${request.resourceType()})`);
    await route.abort();
  });

  try {
    await page.goto(learningPaths.imagePractice);
    const submit = await prepareModelConsent(page);
    expect(await consent.state()).toEqual({ submitted: false, earlyAttempts: 0 });
    expect(modelRequests).toEqual([]);
    await consent.submit(submit);
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
    expect(await consent.state()).toEqual({ submitted: true, earlyAttempts: 0 });
    expect(modelRequests).toContain(new URL(contract.modelUrl).pathname);
    expect(modelRequests).toHaveLength(5);
    expect(unexpected).toEqual([]);
  } catch (error) {
    expect(unexpected).toEqual([]);
    throw error;
  } finally {
    downloader.close();
  }
});
