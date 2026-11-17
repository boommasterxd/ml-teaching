import { expect, test } from '@playwright/test';
import { diagnostics, expectAccessible } from './browser-checks';

test('desktop legal navigation stays reachable while the document scrolls', async ({ page }) => {
  const failures = diagnostics(page);
  await page.setViewportSize({ width: 1322, height: 900 });
  await page.goto('/datenschutz');
  const sidebar = page.locator('.legal-sidebar');
  const initial = await sidebar.boundingBox();
  if (!initial) throw new Error('Legal navigation is not visible.');
  for (const position of [100, 800, 3000]) {
    await page.evaluate((top) => window.scrollTo(0, top), position);
    await expect.poll(async () => (await sidebar.boundingBox())?.y).toBeCloseTo(initial.y, 0);
    const navigation = sidebar.getByRole('navigation', { name: 'Informationsseiten' });
    for (const link of await navigation.getByRole('link').all())
      await expect(link).toBeInViewport();
  }
  await expectAccessible(page);
  const imprint = sidebar.getByRole('link', { name: 'Impressum', exact: true });
  await imprint.hover();
  await imprint.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/impressum$/);
  await expect(page.getByRole('heading', { name: 'Impressum', exact: true })).toBeVisible();
  expect(failures).toEqual([]);
});
