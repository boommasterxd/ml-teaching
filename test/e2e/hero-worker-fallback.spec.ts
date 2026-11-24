import { expect, test } from '@playwright/test';

test('a failure from the active hero worker closes it and displays the poster', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const posterRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/_next/image' && url.searchParams.get('url')?.includes('/hero-glass'))
      posterRequests.push(url.href);
  });
  const started = page.waitForEvent('worker');
  await page.goto('/');
  const worker = await started;
  const scene = page.locator('#home-hero-art');
  const canvas = scene.locator('canvas');
  await expect(page.locator('.hero-field')).toHaveAttribute('data-enhanced', 'true');
  await expect(canvas).toBeVisible();
  expect(posterRequests).toEqual([]);

  await Promise.all([
    worker.waitForEvent('close'),
    worker.evaluate(() => {
      // Send the renderer's failure response from the live worker realm.
      setTimeout(() => globalThis.postMessage({ type: 'drawn', result: false }), 0);
    }),
  ]);

  await expect(canvas).toHaveCount(0);
  const poster = scene.locator('picture img');
  await expect(poster).toBeVisible();
  await expect
    .poll(() => poster.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  expect(posterRequests).toEqual([
    await poster.evaluate((image: HTMLImageElement) => image.currentSrc),
  ]);
});
