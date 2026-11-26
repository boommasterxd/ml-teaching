import { expect, test, type Page } from '@playwright/test';

type HeldHeroDraw = Window & { releaseHeroDraw?: () => void };

async function holdFirstWorkerDraw(page: Page) {
  await page.addInitScript(() => {
    const post = Worker.prototype.postMessage;
    const host = window as HeldHeroDraw;
    Worker.prototype.postMessage = function (
      this: Worker,
      message: { type?: string },
      options?: Transferable[] | StructuredSerializeOptions,
    ) {
      const send = () => Reflect.apply(post, this, [message, options]);
      if (message?.type === 'draw' && !host.releaseHeroDraw) {
        host.releaseHeroDraw = send;
        return;
      }
      send();
    };
  });
}

async function expectFirstWorkerDrawHeld(page: Page) {
  await expect
    .poll(async () => {
      await page.clock.runFor(16);
      return page.evaluate(() => Boolean((window as HeldHeroDraw).releaseHeroDraw));
    })
    .toBe(true);
}

test('a quick first shader frame fades in without showing the spinner', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await holdFirstWorkerDraw(page);
  const session = await page.context().newCDPSession(page);
  // The mocked timer does not control the compositor's animation clock.
  await session.send('Animation.enable');
  await session.send('Animation.setPlaybackRate', { playbackRate: 0.25 });
  const start = Date.now();
  await page.clock.install({ time: start });
  await page.clock.pauseAt(start + 10_000);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expectFirstWorkerDrawHeld(page);

  const spinner = page.getByRole('status', { name: 'Grafik wird geladen' });
  const surface = page.locator('#home-hero-art .hero-field-canvas > [aria-hidden="true"]');
  await expect(surface).toHaveCSS('opacity', '0');
  await page.clock.runFor(150);
  await expect(spinner).toHaveCount(0);
  await page.evaluate(() => (window as HeldHeroDraw).releaseHeroDraw?.());
  await expect
    .poll(
      async () => {
        await page.clock.runFor(16);
        const opacity = await surface.evaluate((node) => Number(getComputedStyle(node).opacity));
        return opacity > 0 && opacity < 1;
      },
      { intervals: [20, 35, 50] },
    )
    .toBe(true);
  await session.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await session.detach();
  await page.clock.resume();
  await expect(surface).toHaveCSS('opacity', '1');
  await expect(spinner).toHaveCount(0);
});

test('a stalled first shader frame shows the spinner, then the single decoded fallback', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await holdFirstWorkerDraw(page);
  const posterRequests: string[] = [];
  const releaseImage = Promise.withResolvers<void>();
  await page.route('**/_next/image?*', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('url')?.includes('/hero-glass')) {
      posterRequests.push(url.href);
      await releaseImage.promise;
    }
    await route.continue();
  });
  const start = Date.now();
  await page.clock.install({ time: start });
  await page.clock.pauseAt(start + 10_000);
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expectFirstWorkerDrawHeld(page);
    const spinner = page.getByRole('status', { name: 'Grafik wird geladen' });
    const field = page.locator('.hero-field');
    const poster = page.locator('#home-hero-art picture img');
    expect(posterRequests).toEqual([]);
    await expect(spinner).toHaveCount(0);

    await page.clock.runFor(500);
    await expect(spinner).toBeVisible();
    await expect.poll(() => posterRequests.length).toBe(1);
    await expect(field).not.toHaveAttribute('data-enhanced', 'true');
    releaseImage.resolve();
    await expect
      .poll(() => poster.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(1);
    await expect(spinner).toHaveCount(0);
    expect(posterRequests).toEqual([
      await poster.evaluate((image: HTMLImageElement) => image.currentSrc),
    ]);

    await page.evaluate(() => (window as HeldHeroDraw).releaseHeroDraw?.());
    await expect
      .poll(async () => {
        await page.clock.runFor(16);
        return field.getAttribute('data-enhanced');
      })
      .toBe('true');
    await expect(poster).toBeHidden();
    expect(posterRequests).toHaveLength(1);
  } finally {
    releaseImage.resolve();
    await page.unrouteAll({ behavior: 'wait' });
  }
});

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
