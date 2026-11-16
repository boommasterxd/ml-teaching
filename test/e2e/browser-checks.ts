import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export async function expectAccessible(page: Page) {
  await expect(page.locator('[role="dialog"][data-state="closed"]')).toHaveCount(0);
  for (const surface of await page
    .locator(
      '[role="dialog"][data-state="open"], [role="menu"][data-state="open"], [data-slot="tooltip-content"]:not([data-state="closed"])',
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
