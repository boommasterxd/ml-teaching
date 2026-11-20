import { expect, test, type Page } from '@playwright/test';
import { diagnostics, expectAccessible, settleEntryAnimations } from './browser-checks';

type HeroEntryProbe = {
  maxDisplacement: number;
  blurred: boolean;
  done: boolean;
};

async function observeTransitions(page: Page) {
  await page.addInitScript(() => {
    const start = document.startViewTransition;
    const probe = { calls: 0 };
    Object.assign(window, { heroTransitions: probe });
    window.addEventListener('pagereveal', (event) => {
      if (event.viewTransition) probe.calls += 1;
    });
    if (start) {
      document.startViewTransition = new Proxy(start, {
        apply(target, thisArg, args) {
          probe.calls += 1;
          return Reflect.apply(target, thisArg, args);
        },
      });
    }
  });
}

async function expectStableHeroHandoff(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const field = document.querySelector('.hero-field');
        return field?.hasAttribute('data-enhanced') || field?.hasAttribute('data-field-unavailable')
          ? 'ready'
          : 'pending';
      }),
    )
    .toBe('ready');
  expect(
    await page.evaluate(
      () => (window as unknown as { heroTransitions: { calls: number } }).heroTransitions.calls,
    ),
  ).toBe(0);
}

test('a late Geist download keeps the first mobile headline in place', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 823 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const fontUrl = '**/_next/static/media/*.woff2';
  let releaseFont!: () => void;
  const heldFont = new Promise<void>((resolve) => {
    releaseFont = resolve;
  });
  await page.route(fontUrl, async (route) => {
    await heldFont;
    await route.continue();
  });

  try {
    await page.goto('/', { waitUntil: 'commit' });
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => performance.getEntriesByName('first-contentful-paint').length),
      )
      .toBe(1);
    const before = await heading.boundingBox();
    const response = page.waitForResponse(fontUrl);
    releaseFont();
    expect((await response).ok()).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await settleEntryAnimations(page);
    expect(await heading.boundingBox()).toEqual(before);
  } finally {
    releaseFont();
  }
});

for (const [entry, width, height, colorScheme] of [
  ['direct entry', 1280, 800, 'dark'],
  ['reload', 430, 600, 'light'],
] as const) {
  test(`hero stays sharp and in place on ${entry} without a page transition`, async ({ page }) => {
    const failures = diagnostics(page);
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ colorScheme });
    await observeTransitions(page);
    if (entry === 'reload') await page.goto('/');
    let release!: () => void;
    const scripts = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/_next/static/**/*.js', async (route) => {
      await scripts;
      await route.continue();
    });
    try {
      if (entry === 'reload') await page.reload({ waitUntil: 'commit' });
      else await page.goto('/', { waitUntil: 'commit' });
      await expect(page.locator('.hero-copy')).toHaveCSS('display', 'flex');
      await page.evaluate(() => document.fonts.ready);
      await expect
        .poll(() =>
          page.evaluate(() => performance.getEntriesByName('first-contentful-paint').length),
        )
        .toBe(1);
      const selectors = ['.hero-title', '.hero-description', '.hero-actions'];
      for (const selector of selectors) {
        await expect(page.locator(selector)).toHaveCSS('filter', 'none');
      }
      await page.evaluate((selectors) => {
        const initial = selectors.map(
          (selector) => document.querySelector(selector)!.getBoundingClientRect().top + scrollY,
        );
        const probe: HeroEntryProbe = { maxDisplacement: 0, blurred: false, done: false };
        Object.assign(window, { heroPositionProbe: probe });
        const sample = () => {
          selectors.forEach((selector, index) => {
            const element = document.querySelector(selector)!;
            const top = element.getBoundingClientRect().top + scrollY;
            if (getComputedStyle(element).filter !== 'none') probe.blurred = true;
            probe.maxDisplacement = Math.max(probe.maxDisplacement, Math.abs(top - initial[index]));
          });
          if (!probe.done) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }, selectors);
      release();
      await page.waitForLoadState('load');
      await settleEntryAnimations(page);
      await expectStableHeroHandoff(page);
      const readability = await page.evaluate(() => {
        const probe = (window as unknown as { heroPositionProbe: HeroEntryProbe })
          .heroPositionProbe;
        probe.done = true;
        return { displacement: probe.maxDisplacement, blurred: probe.blurred };
      });
      expect(readability.displacement).toBeLessThanOrEqual(1);
      expect(readability.blurred).toBe(false);
      await expectAccessible(page);
      expect(failures).toEqual([]);
    } finally {
      release();
    }
  });
}
