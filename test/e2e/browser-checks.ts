import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export async function settleEntryAnimations(page: Page) {
  await page.evaluate(async () => {
    const transition = (document as Document & { activeViewTransition?: ViewTransition })
      .activeViewTransition;
    await transition?.finished.catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
    });
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    const animations = document.getAnimations().filter((animation) => {
      const target = (animation.effect as KeyframeEffect | null)?.target;
      return target instanceof Element && target.hasAttribute('data-entry-reveal');
    });
    await Promise.all(
      animations.map((animation) =>
        animation.finished.catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
        }),
      ),
    );
  });
  for (const entry of await page.locator('[data-entry-reveal]').all()) {
    const opacity = Number(await entry.evaluate((node) => getComputedStyle(node).opacity));
    if (opacity > 0 && opacity < 1) await expect(entry).toHaveCSS('opacity', '1');
  }
}

export async function expectAccessible(page: Page) {
  await settleEntryAnimations(page);
  await expect(page.locator('[role="dialog"][data-state="closed"]')).toHaveCount(0);
  for (const surface of await page
    .locator(
      '[role="dialog"][data-state="open"], [role="menu"][data-state="open"], [data-slot="tooltip-content"]:not([data-state="closed"]), [data-slot="animated-feedback"]:not([aria-hidden="true"]) > div > div',
    )
    .all()) {
    await expect(surface).toHaveCSS('opacity', '1');
  }
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
}

export function diagnostics(page: Page) {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('console', (message) => {
    const invalidMotion = /not.animatable|trying to animate|interpolat/i;
    if (message.type() === 'error' || invalidMotion.test(message.text()))
      failures.push(message.text());
  });
  return failures;
}
