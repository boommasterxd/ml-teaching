import { expect, test, type Locator } from '@playwright/test';
import { expectAccessible } from './browser-checks';

async function expectVisibleHeaderControls(header: Locator) {
  const result = await header.evaluate((nav) => {
    const buttons = [...nav.querySelectorAll('a, button, [role="switch"]')].filter(
      (item) => item.getClientRects().length > 0,
    );
    const bounds = buttons.map((button) => button.getBoundingClientRect());
    const overlaps = (a: DOMRect, b: DOMRect) =>
      Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
    return {
      controls: bounds.length,
      insideViewport: bounds.every(({ left, right }) => left >= 0 && right <= innerWidth),
      overlap: bounds.some((box, index) =>
        bounds.slice(index + 1).some((other) => overlaps(box, other)),
      ),
      scrollsHorizontally: document.documentElement.scrollWidth > innerWidth,
    };
  });
  expect(result.controls).toBeGreaterThanOrEqual(4);
  expect(result).toMatchObject({
    insideViewport: true,
    overlap: false,
    scrollsHorizontally: false,
  });
}

test('enlarged header controls reflow without overlap or horizontal scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/barrierefreiheit');
  await page.evaluate(async () => {
    document.documentElement.style.fontSize = '200%';
    await document.fonts.ready;
  });
  const header = page.getByRole('navigation', { name: 'Hauptnavigation' });
  for (const width of [320, 390, 640, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 760 });
    const menuLabel = width < 768 ? 'Menü' : 'Lernlabor';
    await expect(header.getByRole('button', { name: menuLabel, exact: true })).toBeVisible();
    await expectVisibleHeaderControls(header);
  }
  await page.setViewportSize({ width: 320, height: 760 });
  const navigation = header.getByRole('button', { name: 'Menü', exact: true });
  await navigation.press('Enter');
  const overview = header.getByRole('link', { name: 'Lernlabor-Übersicht' });
  await overview.click({ trial: true });
  await page.keyboard.press('Escape');
  await expect(navigation).toBeFocused();

  const appearance = header.getByRole('button', { name: 'Darstellung einstellen' });
  await appearance.press('Enter');
  const menu = page.getByRole('menu', { name: 'Darstellung einstellen' });
  await expect(menu).toBeInViewport({ ratio: 0.99 });
  await expectAccessible(page);
  await page.keyboard.press('Escape');
  await expect(appearance).toBeFocused();

  await page.setViewportSize({ width: 768, height: 760 });
  const learning = header.getByRole('button', { name: 'Lernlabor', exact: true });
  await learning.press('Enter');
  await overview.click({ trial: true });
  await page.keyboard.press('Escape');
  await expect(learning).toBeFocused();
});
