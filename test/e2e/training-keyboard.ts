import { expect, type Page } from '@playwright/test';
import { learningPaths } from '../../src/lib/learning-paths';

export async function captureSetupDialog(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  const original = await dialog.evaluateHandle((content) => ({
    content,
    overlay: content.closest('[data-slot="dialog-overlay"]'),
  }));
  return async () => {
    await expect(page.getByRole('dialog')).toHaveCount(1);
    const retainsFocus = () =>
      original.evaluate(({ content, overlay }) =>
        Boolean(
          overlay?.isConnected &&
          overlay.contains(content) &&
          content.contains(document.activeElement),
        ),
      );
    await expect.poll(retainsFocus).toBe(true);
    for (const key of ['Tab', 'Shift+Tab']) {
      await page.keyboard.press(key);
      expect(await retainsFocus()).toBe(true);
    }
  };
}

export async function withdrawTrainingConsent(page: Page) {
  await page.evaluate(() => {
    document.documentElement.dataset.withdrawalProbe = 'old-workspace';
  });
  const withdrawal = page.getByRole('link', {
    name: 'Einwilligung widerrufen und lokale Trainingsdaten verwerfen',
    exact: true,
  });
  await withdrawal.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' }),
  ).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${learningPaths.imagePractice}$`));
  expect(await page.locator('html').getAttribute('data-withdrawal-probe')).toBeNull();
}

export async function expectHeaderLayout(page: Page) {
  const navigation = page.getByRole('navigation', { name: 'Hauptnavigation', exact: true });
  const brand = navigation.getByRole('link', { name: 'ML Teaching – Startseite', exact: true });
  const start = navigation.getByRole('link', { name: 'Startseite', exact: true });
  const legal = navigation.getByRole('button', { name: 'Rechtliches', exact: true });
  const theme = navigation.getByRole('switch', { name: 'Dunkle Darstellung' });
  const [brandBox, startBox, legalBox, themeBox] = await Promise.all(
    [brand, start, legal, theme].map((control) => control.boundingBox()),
  );
  if (!brandBox || !startBox || !legalBox || !themeBox)
    throw new Error('Header controls have no visible geometry.');
  expect(brandBox.x + brandBox.width).toBeLessThan(startBox.x);
  expect(legalBox.x + legalBox.width).toBeLessThan(themeBox.x);
}

export async function expectThemeControlAlignment(page: Page) {
  const navigation = page.getByRole('navigation', { name: 'Hauptnavigation', exact: true });
  const track = navigation.getByRole('switch', { name: 'Dunkle Darstellung' });
  const thumb = track.locator('[data-slot="switch-thumb"]');
  const menu = navigation.getByRole('button', { name: 'Darstellung einstellen', exact: true });
  const parts = [navigation, track, thumb, thumb.locator('svg'), menu, menu.locator('svg')];
  const handles = await Promise.all(parts.map((part) => part.elementHandle()));
  const boxes = await page.evaluate((elements) => {
    return elements.map((element) => {
      const { y, height } = element.getBoundingClientRect();
      if (!height) throw new Error('Theme control has no visible geometry.');
      return { center: y + height / 2, height };
    });
  }, handles);
  await Promise.all(handles.map((handle) => handle.dispose()));
  const centers = boxes.map(({ center }) => center);
  expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(0.5);
  expect((boxes[1]?.height ?? 0) + 0.001).toBeGreaterThanOrEqual(24);
}

/** The current control must remain visible above the old page while the theme wipe runs. */
export async function expectImmediateThemeFeedback(page: Page) {
  await expect
    .poll(() =>
      page.getByRole('switch', { name: 'Dunkle Darstellung' }).evaluate((control) => {
        const name = getComputedStyle(control).viewTransitionName;
        if (name === 'none') return false;
        const root = document.documentElement;
        return (
          getComputedStyle(root, `::view-transition-old(${name})`).opacity === '0' &&
          getComputedStyle(root, `::view-transition-new(${name})`).opacity === '1'
        );
      }),
    )
    .toBe(true);
}

export async function settleLandingReveals(page: Page) {
  const position = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  for (const card of await page.locator('[data-scroll-reveal]').all()) {
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
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu', { name: 'Darstellung einstellen' });
  await expect(menu).toBeVisible();
  return menu;
}

export async function expectThemeMenuTriggers(page: Page) {
  const trigger = page.getByRole('button', { name: 'Darstellung einstellen', exact: true });
  const menu = page.getByRole('menu', { name: 'Darstellung einstellen' });
  for (const activation of ['Space', 'ArrowDown', 'pointer']) {
    await trigger.focus();
    if (activation === 'pointer') await trigger.click();
    else await page.keyboard.press(activation);
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  }
}

export async function expectThemeKeepsTraining(page: Page) {
  const theme = page.getByRole('switch', { name: 'Dunkle Darstellung' });
  await theme.focus();
  await page.keyboard.press('Space');
  await expect(theme).toBeChecked();
  await expect(page.getByText('10 Bilder', { exact: true })).toHaveCount(2);
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
  await expect(page.getByText('9 / 10 Bilder', { exact: true })).toHaveCount(1);
  await expect(page.getByText('10 Bilder', { exact: true })).toHaveCount(1);
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
  await expect(page.getByText('10 Bilder', { exact: true })).toHaveCount(2);
  expect(
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest('[inert], [aria-hidden="true"], [data-closed]')),
    ),
  ).toBe(false);
  await expect(page.getByRole('textbox', { name: 'Name für Klasse 3: Klasse 3' })).toBeVisible();
  await page.getByRole('button', { name: 'Klasse 3: Klasse 3 löschen', exact: true }).click();
  const remove = page.getByRole('dialog', { name: 'Klasse löschen?' });
  await remove.getByRole('button', { name: 'Löschen', exact: true }).click();
  await expect(page.getByRole('textbox')).toHaveCount(2);
  await expect(page.getByText('10 Bilder', { exact: true })).toHaveCount(2);
}
