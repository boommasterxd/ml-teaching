import { expect, test } from '@playwright/test';
import { diagnostics, expectAccessible } from './browser-checks';

test('the desktop menu loads on intent and Escape cancels a cold opening', async ({ page }) => {
  const failures = diagnostics(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/lernen');
  await page.reload();
  await expect(page.locator('.header-menu-mobile')).toHaveCount(0);
  const lateScripts = Promise.withResolvers<void>();
  let requested = false;
  await page.route('**/_next/static/chunks/*.js', async (route) => {
    requested = true;
    await lateScripts.promise;
    await route.continue();
  });
  try {
    const trigger = page.getByRole('button', { name: 'Lernlabor', exact: true });
    const overview = page.getByRole('link', { name: 'Lernlabor-Übersicht', exact: true });
    await expect(overview).toHaveCount(0);
    expect(requested).toBe(false);
    const originalTrigger = await trigger.elementHandle();
    await trigger.hover();
    await expect.poll(() => requested).toBe(true);
    await expect(page.getByRole('status').filter({ hasText: 'Menü wird geladen.' })).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-busy', 'true');
    await trigger.focus();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(overview).toHaveCount(0);

    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-busy', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(trigger).toBeFocused();
    lateScripts.resolve();
    await page.unrouteAll({ behavior: 'wait' });
    await expect(overview).toBeVisible();
    await expect(overview).toBeInViewport();
    await expect(overview).toBeFocused();
    expect(await trigger.evaluate((node, original) => node === original, originalTrigger)).toBe(
      true,
    );
    await expectAccessible(page);
    expect(failures).toEqual([]);
  } finally {
    lateScripts.resolve();
    await page.unrouteAll({ behavior: 'wait' });
  }
});

test('a failed navigation chunk can be retried from the open menu', async ({ page }) => {
  await page.goto('/lernen');
  // The initial static layout includes both breakpoint variants until hydration.
  await expect(page.locator('.header-menu-mobile')).toHaveCount(0);
  const assets = '**/_next/static/chunks/*.js';
  await page.route(assets, (route) => route.abort('failed'));

  const trigger = page.getByRole('button', { name: 'Lernlabor', exact: true });
  await trigger.press('Enter');
  const retry = page.getByRole('button', { name: 'Erneut versuchen' });
  await expect(retry).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(retry).toBeFocused();
  await page.unroute(assets);
  await page.keyboard.press('Enter');
  const overview = page.getByRole('link', { name: 'Lernlabor-Übersicht', exact: true });
  await expect(overview).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(overview).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('the information trigger keeps press and focus as its first intent load settles', async ({
  page,
}) => {
  const failures = diagnostics(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  await page.goto('/datenschutz');

  const trigger = page.getByRole('button', { name: 'Informationen', exact: true });
  const menu = page.getByRole('menu', { name: 'Informationen', exact: true });
  const scale = () =>
    trigger.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).a);
  const scripts = '**/_next/static/chunks/*.js';
  const allowScripts = Promise.withResolvers<void>();
  let requested = false;
  await page.route(scripts, async (route) => {
    requested = true;
    await allowScripts.promise;
    await route.continue();
  });

  try {
    await trigger.hover();
    await expect.poll(() => requested).toBe(true);
    await trigger.focus();
    await page.mouse.down();
    await expect.poll(scale).toBeLessThan(0.995);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-busy', 'true');
    await expect(trigger).toBeFocused();
    await expect(menu).toHaveCount(0);

    const chunkResponse = page.waitForResponse(async (response) => {
      if (!response.ok() || response.request().resourceType() !== 'script') return false;
      return (await response.text()).includes('data-legal-mobile-menu');
    });
    allowScripts.resolve();
    await chunkResponse;
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await expect(menu).toBeVisible();
    await expect
      .poll(() => menu.evaluate((popup) => popup.contains(document.activeElement)))
      .toBe(true);
    await expect.poll(scale).toBeLessThan(0.995);

    await page.mouse.move(1, 1);
    await page.mouse.up();
    await expect.poll(scale).toBeCloseTo(1);
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await trigger.hover();
    await trigger.press('Enter');
    await expect(menu.getByRole('menuitem', { name: 'Impressum' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expectAccessible(page);
    expect(failures).toEqual([]);
  } finally {
    allowScripts.resolve();
    await page.unrouteAll({ behavior: 'wait' });
  }
});

test('only the visible navigation is active and an open panel closes across the breakpoint', async ({
  page,
}) => {
  const failures = diagnostics(page);
  await page.setViewportSize({ width: 767, height: 844 });
  await page.goto('/lernen');
  const mobile = page.getByRole('button', { name: 'Menü', exact: true });
  const desktop = page.getByRole('button', { name: 'Rechtliches', exact: true });
  await expect(page.locator('.header-menu-desktop')).toHaveCount(0);
  await expect(mobile).toBeVisible();
  await mobile.press('Enter');
  await expect(mobile).toHaveAttribute('aria-expanded', 'true');
  await page.setViewportSize({ width: 768, height: 844 });
  await expect(page.locator('.header-menu-mobile')).toHaveCount(0);
  await expect(desktop).toBeVisible();
  await desktop.press('Enter');
  await expect(desktop).toHaveAttribute('aria-expanded', 'true');
  await page.setViewportSize({ width: 769, height: 844 });
  await expect(desktop).toBeVisible();
  await expect(desktop).toHaveAttribute('aria-expanded', 'true');
  await page.setViewportSize({ width: 767, height: 844 });
  await expect(mobile).toBeVisible();
  await expect(mobile).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('link', { name: 'Lernlabor-Übersicht' })).toHaveCount(0);
  expect(failures).toEqual([]);
});

test('the appearance menu opens on first hover and stays open when moving into it', async ({
  page,
}) => {
  const failures = diagnostics(page);
  await page.goto('/lernen');
  const scripts = '**/_next/static/chunks/*.js';
  const allowScripts = Promise.withResolvers<void>();
  await page.route(scripts, async (route) => {
    await allowScripts.promise;
    await route.continue();
  });

  const trigger = page.getByRole('button', { name: 'Darstellung einstellen' });
  const menu = page.getByRole('menu', { name: 'Darstellung einstellen' });
  const dark = menu.getByRole('menuitemradio', { name: 'Dunkel' });
  const chevronPath = trigger.locator('svg').first().locator('path');
  const chevronOffset = () =>
    chevronPath.evaluate((path) => {
      const transform = getComputedStyle(path).transform;
      return transform === 'none' ? 0 : new DOMMatrix(transform).m42;
    });
  const brand = page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('link', { name: 'ML Teaching – Startseite' });
  try {
    await brand.focus();
    await trigger.hover();
    await expect(trigger).toHaveAttribute('aria-busy', 'true');
    await expect.poll(chevronOffset).toBeGreaterThan(0);
    await expect(menu).toHaveCount(0);
    await expect(trigger).not.toHaveAttribute('aria-controls');
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(brand).toBeFocused();

    await page.mouse.move(1, 1);
    await trigger.hover();
    await expect(trigger).toHaveAttribute('aria-busy', 'true');
    await expect.poll(chevronOffset).toBeGreaterThan(0);
    const pendingChevron = await chevronPath.elementHandle();
    allowScripts.resolve();
    await page.unrouteAll({ behavior: 'wait' });
    await expect(menu).toBeVisible();
    await expect(menu).toHaveCSS('opacity', '1');
    await expect(trigger).not.toHaveAttribute('aria-busy');
    expect(await chevronPath.evaluate((path, previous) => path === previous, pendingChevron)).toBe(
      true,
    );
    await expect.poll(chevronOffset).toBeGreaterThan(0);
    await expect(brand).toBeFocused();

    const button = (await trigger.boundingBox())!;
    const popup = (await menu.boundingBox())!;
    await page.mouse.move(button.x + button.width / 2, popup.y + 36, { steps: 12 });
    await expect(menu).toBeVisible();
    await dark.hover();
    await expect(brand).toBeFocused();
    await expectAccessible(page);
    await page.mouse.move(1, 360);
    await expect(menu).toBeHidden();

    await trigger.hover();
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await page.mouse.move(1, 360);
    await trigger.press('ArrowUp');
    const remember = menu.getByRole('menuitemcheckbox');
    await expect(remember).toBeFocused();
    await dark.hover();
    await expect(remember).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitemradio', { name: 'Hell' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    expect(failures).toEqual([]);
  } finally {
    allowScripts.resolve();
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

  test('the appearance menu aligns with the mobile header edges and follows the breakpoint', async ({
    page,
  }) => {
    await page.goto('/lernen');
    const header = page.getByRole('navigation', { name: 'Hauptnavigation' });
    const trigger = page.getByRole('button', { name: 'Darstellung einstellen' });
    const menu = page.getByRole('menu', { name: 'Darstellung einstellen' });
    await trigger.tap();
    await expect(menu).toBeVisible();

    for (const width of [390, 760]) {
      await page.setViewportSize({ width, height: 844 });
      await expect
        .poll(async () => {
          const bar = (await header.boundingBox())!;
          const panel = (await menu.boundingBox())!;
          return (
            Math.abs(panel.x - bar.x) < 1 &&
            Math.abs(panel.x + panel.width - bar.x - bar.width) < 1 &&
            panel.y >= bar.y + bar.height
          );
        })
        .toBe(true);
    }
    await expectAccessible(page);

    await page.setViewportSize({ width: 900, height: 844 });
    await expect
      .poll(async () => {
        const button = (await trigger.boundingBox())!;
        const panel = (await menu.boundingBox())!;
        return Math.abs(panel.x + panel.width - button.x - button.width);
      })
      .toBeLessThan(1);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
