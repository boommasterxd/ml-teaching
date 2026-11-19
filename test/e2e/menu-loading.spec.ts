import { expect, test } from '@playwright/test';
import { diagnostics, expectAccessible } from './browser-checks';

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  reducedMotion: 'reduce',
});

test('an outside tap dismisses a mobile menu while its first chunk is pending', async ({
  page,
}) => {
  const failures = diagnostics(page);
  await page.goto('/');
  const scriptChunks = '**/_next/static/chunks/*.js';
  const pending = Promise.withResolvers<void>();
  let requests = 0;
  await page.route(scriptChunks, async (route) => {
    requests++;
    await pending.promise;
    await route.continue();
  });
  try {
    const trigger = page.getByRole('button', { name: 'Menü', exact: true });
    const overview = page.getByRole('link', { name: 'Lernlabor-Übersicht' });
    await trigger.tap();
    await expect(trigger).toHaveAttribute('aria-busy', 'true');
    await expect.poll(() => requests).toBeGreaterThan(0);

    await page.getByRole('heading', { level: 1 }).tap();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const finished = page.waitForEvent('requestfinished', {
      predicate: (request) =>
        request.url().includes('/_next/static/chunks/') && request.url().endsWith('.js'),
    });
    pending.resolve();
    await finished;
    await expect(overview).toHaveCount(0);

    const prepared = requests;
    await trigger.tap();
    await expect(overview).toBeVisible();
    expect(requests).toBe(prepared);
    const bar = page.getByRole('navigation', { name: 'Hauptnavigation' });
    const panel = page.locator('.header-menu-panel-mobile');
    const { x, width } = (await bar.boundingBox())!;
    await expect
      .poll(async () => {
        const bounds = await panel.boundingBox();
        return bounds && Math.abs(bounds.x - x) < 1 && Math.abs(bounds.width - width) < 1;
      })
      .toBe(true);
    await expectAccessible(page);
    expect(failures).toEqual([]);
  } finally {
    pending.resolve();
    await page.unrouteAll({ behavior: 'wait' });
  }
});
