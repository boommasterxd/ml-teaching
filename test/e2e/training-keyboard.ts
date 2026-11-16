import { expect, type Page } from '@playwright/test';

export async function settleLandingReveals(page: Page) {
  const position = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  for (const card of await page.locator('[data-slot="card"]').all()) {
    await card.scrollIntoViewIfNeeded();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    await expect(card).toHaveCSS('opacity', '1');
  }
  await page.evaluate(({ x, y }) => scrollTo({ left: x, top: y, behavior: 'instant' }), position);
}

export async function openThemeMenu(page: Page) {
  const trigger = page.getByRole('button', { name: 'Darstellung einstellen', exact: true });
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  const menu = page.getByRole('menu', { name: 'Darstellung einstellen' });
  await expect(menu).toBeVisible();
  return menu;
}

export async function expectThemeKeepsTraining(page: Page) {
  const theme = page.getByRole('switch', { name: 'Dunkle Darstellung' });
  await theme.focus();
  await page.keyboard.press('Space');
  await expect(theme).toBeChecked();
  await expect(page.getByText('10 / 200 Bilder', { exact: true })).toHaveCount(2);
  await expect(page.getByRole('status').filter({ hasText: 'Bereit' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Modell neu trainieren', exact: true }),
  ).toBeEnabled();
}

export async function expectPreviewDeletion(
  page: Page,
  expectAccessible: (page: Page) => Promise<void>,
) {
  await page.getByRole('button', { name: 'Bild vergrößern' }).first().click();
  const preview = page.getByRole('dialog', { name: 'Bild Vorschau' });
  await expectAccessible(page);
  await preview.getByRole('button', { name: 'Bild löschen' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Name für Klasse 2: Klasse 2' })).toBeFocused();
  await expect(page.getByText('9 / 200 Bilder', { exact: true })).toHaveCount(1);
  await expect(page.getByText('10 / 200 Bilder', { exact: true })).toHaveCount(1);
}

export async function expectGalleryFocusAcrossResize(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  const gallery = page.getByRole('region', { name: /Trainingsbilder von Klasse 1:/ });
  const thumbnail = gallery
    .getByRole('img', { name: 'Trainingsbeispiel 5', exact: true })
    .locator('..');
  const row = gallery.locator('[style*="grid-template-columns"]').first();
  await expect(row).toHaveCSS('grid-template-columns', /^(\S+\s+){3}\S+$/);
  await thumbnail.focus();
  await expect(thumbnail).toBeFocused();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(row).toHaveCSS('grid-template-columns', /^(\S+\s+){5}\S+$/);
  await expect(thumbnail).toBeFocused();
  await page.keyboard.press('Enter');
  const preview = page.getByRole('dialog', { name: 'Bild Vorschau' });
  await expect(preview).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(thumbnail).toBeFocused();
  await gallery.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await expect(
    gallery.getByRole('img', { name: 'Trainingsbeispiel 10', exact: true }),
  ).toBeInViewport();
  await gallery.evaluate((node) => {
    node.scrollTop = 0;
  });
  await expect(
    gallery.getByRole('img', { name: 'Trainingsbeispiel 1', exact: true }),
  ).toBeInViewport();
  await expect(thumbnail).toBeFocused();
}

export async function expectCancelledResetKeepsImages(page: Page) {
  await page.getByRole('button', { name: 'Alle Klassen und Bilder zurücksetzen' }).click();
  await expect(page.getByRole('dialog', { name: 'Daten unwiderruflich löschen?' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByText('10 / 200 Bilder', { exact: true })).toHaveCount(2);
  expect(
    await page.evaluate(() =>
      Boolean(
        document.activeElement?.closest('[inert], [aria-hidden="true"], [data-state="closed"]'),
      ),
    ),
  ).toBe(false);
  await expect(page.getByRole('textbox', { name: 'Name für Klasse 3: Klasse 3' })).toBeVisible();
  await page.getByRole('button', { name: 'Klasse 3: Klasse 3 löschen', exact: true }).click();
  const remove = page.getByRole('dialog', { name: 'Klasse löschen?' });
  await remove.getByRole('button', { name: 'Löschen', exact: true }).click();
  await expect(page.getByRole('textbox')).toHaveCount(2);
  await expect(page.getByText('10 / 200 Bilder', { exact: true })).toHaveCount(2);
}
