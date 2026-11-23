import { expect, test } from '@playwright/test';

test('a failure from the active hero worker closes it and displays the poster', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const started = page.waitForEvent('worker');
  await page.goto('/');
  const worker = await started;
  const scene = page.locator('#home-hero-art');
  const canvas = scene.locator('canvas');
  await expect(page.locator('.hero-field')).toHaveAttribute('data-enhanced', 'true');
  await expect(canvas).toBeVisible();

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
});
