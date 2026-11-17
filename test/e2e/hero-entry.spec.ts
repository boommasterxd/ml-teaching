import { expect, test, type Page } from '@playwright/test';
import { diagnostics, expectAccessible, settleEntryAnimations } from './browser-checks';

async function observeTransitions(page: Page) {
  await page.addInitScript(() => {
    const start = document.startViewTransition;
    Object.assign(window, { heroTransitionCalls: 0 });
    if (start) {
      document.startViewTransition = new Proxy(start, {
        apply(target, thisArg, args) {
          const probe = window as unknown as { heroTransitionCalls: number };
          probe.heroTransitionCalls += 1;
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
        return field?.hasAttribute('data-enhanced') ||
          field?.querySelector('button')?.textContent?.includes('Ruhige Ansicht')
          ? 'ready'
          : 'pending';
      }),
    )
    .toBe('ready');
  expect(
    await page.evaluate(
      () => (window as unknown as { heroTransitionCalls: number }).heroTransitionCalls,
    ),
  ).toBe(0);
}

for (const [width, colorScheme, height] of [
  [700, 'dark', 1291],
  [430, 'light', 1291],
  [1848, 'dark', 1291],
  [430, 'light', 600],
] as const) {
  test(`hero starts blurred, clears once and keeps its position at ${width}x${height}`, async ({
    page,
  }) => {
    const failures = diagnostics(page);
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ colorScheme });
    await observeTransitions(page);
    let release!: () => void;
    const scripts = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/_next/static/**/*.js', async (route) => {
      await scripts;
      await route.continue();
    });
    try {
      await page.goto('/', { waitUntil: 'commit' });
      await expect(page.locator('.hero-copy')).toHaveCSS('display', 'flex');
      await page.evaluate(() => document.fonts.ready);
      const selectors = ['.hero-description', '.hero-actions'];
      for (const selector of selectors) {
        await expect(page.locator(selector)).toHaveCSS('filter', 'blur(2px)');
      }
      await page.evaluate((selectors) => {
        const initial = selectors.map(
          (selector) => document.querySelector(selector)!.getBoundingClientRect().top + scrollY,
        );
        const probe = { maxDisplacement: 0, reblurred: false, done: false };
        const previousBlur = selectors.map(() => 2);
        Object.assign(window, { heroPositionProbe: probe });
        const sample = () => {
          selectors.forEach((selector, index) => {
            const element = document.querySelector(selector)!;
            const top = element.getBoundingClientRect().top + scrollY;
            const blur = Number(
              getComputedStyle(element).filter.match(/blur\(([\d.]+)px\)/)?.[1] ?? 0,
            );
            if (blur > previousBlur[index] + 0.01) probe.reblurred = true;
            previousBlur[index] = blur;
            probe.maxDisplacement = Math.max(probe.maxDisplacement, Math.abs(top - initial[index]));
          });
          if (!probe.done) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }, selectors);
      release();
      await expect(page.locator('.hero-description')).toHaveAttribute(
        'data-entry-admission',
        'load',
      );
      await settleEntryAnimations(page);
      await expectStableHeroHandoff(page);
      for (const selector of selectors) {
        await page.locator(selector).scrollIntoViewIfNeeded();
        await expect(page.locator(selector)).toHaveCSS('filter', /^(none|blur\(0px\))$/);
      }
      const readability = await page.evaluate(() => {
        const probe = (
          window as unknown as {
            heroPositionProbe: { done: boolean; maxDisplacement: number; reblurred: boolean };
          }
        ).heroPositionProbe;
        probe.done = true;
        return { displacement: probe.maxDisplacement, reblurred: probe.reblurred };
      });
      expect(readability.displacement).toBeLessThanOrEqual(1);
      expect(readability.reblurred).toBe(false);
      await expectAccessible(page);
      expect(failures).toEqual([]);
    } finally {
      release();
    }
  });
}
