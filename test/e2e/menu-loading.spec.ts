import { expect, test } from '@playwright/test';
import { diagnostics, expectAccessible } from './browser-checks';

test('the first desktop opening after reload works without a late script request', async ({
  page,
}) => {
  const failures = diagnostics(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/lernen');
  await page.reload();
  const lateScripts = Promise.withResolvers<void>();
  await page.route('**/_next/static/chunks/*.js', async (route) => {
    await lateScripts.promise;
    await route.continue();
  });
  try {
    const trigger = page.getByRole('button', { name: 'Lernlabor', exact: true });
    const overview = page.getByRole('link', { name: 'Lernlabor-Übersicht', exact: true });
    await expect(overview).toHaveCount(0);
    await trigger.hover();
    await expect(overview).toBeVisible();
    await expect(overview).toBeInViewport();
    expect(failures).toEqual([]);
  } finally {
    lateScripts.resolve();
    await page.unrouteAll({ behavior: 'wait' });
  }
});

test.describe('mobile header menu', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  test('an outside tap dismisses the menu and a second tap reopens it', async ({ page }) => {
    const failures = diagnostics(page);
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Menü', exact: true });
    const overview = page.getByRole('link', { name: 'Lernlabor-Übersicht' });
    const bar = page.getByRole('navigation', { name: 'Hauptnavigation' });
    const { x, width } = (await bar.boundingBox())!;
    await trigger.tap();
    await expect(overview).toBeVisible();

    await page.touchscreen.tap(x / 2, 360);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(overview).toHaveCount(0);

    await trigger.tap();
    await expect(overview).toBeVisible();
    const panel = page.locator('.header-menu-panel-mobile');
    await expect
      .poll(async () => {
        const bounds = await panel.boundingBox();
        return bounds && Math.abs(bounds.x - x) < 1 && Math.abs(bounds.width - width) < 1;
      })
      .toBe(true);
    await expectAccessible(page);
    expect(failures).toEqual([]);
  });
});
