import { expect, type Page } from '@playwright/test';
import { learningPaths } from '../../src/lib/learning-paths';
import { expectAccessible } from './browser-checks';

export async function classLayout(page: Page) {
  const names = page.getByRole('textbox', { name: /^Name für Klasse / });
  return names.evaluateAll((inputs) => {
    const cards = inputs.map((input) => input.closest('[data-slot="card"]')!);
    const [first, next] = cards.map((card) => card.getBoundingClientRect());
    if (!first || !next) throw new Error('The training workspace is incomplete.');
    return {
      heights: [Math.round(first.height), Math.round(next.height)],
      spacing: Math.round(next.top - first.top),
      actions: cards.map((card) =>
        Math.round(
          card.querySelector('[data-slot="card-content"]')!.getBoundingClientRect().top -
            card.getBoundingClientRect().top,
        ),
      ),
    };
  });
}

export async function expectStableNameValidation(page: Page) {
  const names = page.getByRole('textbox', { name: /^Name für Klasse / });
  const first = names.nth(0);
  const second = names.nth(1);
  const originalName = await first.inputValue();
  const layout = await classLayout(page);

  await first.fill('');
  await expect(first).toHaveAccessibleDescription('Name darf nicht leer sein');
  const hint = page.locator('[data-slot="tooltip-content"]');
  await expect(hint).toBeVisible();
  await expect(hint).toHaveText('Name darf nicht leer sein');
  expect(await classLayout(page)).toEqual(layout);
  await expectAccessible(page);
  await first.press('Escape');
  await expect(hint).toHaveCount(0);
  await expect(first).toBeFocused();
  await expect(first).toHaveAccessibleDescription('Name darf nicht leer sein');

  await first.fill(await second.inputValue());
  await expect(first).toHaveAccessibleDescription('Name muss eindeutig sein');
  await expect(second).toHaveAccessibleDescription('Name muss eindeutig sein');
  await expect(hint).toHaveText('Name muss eindeutig sein');
  expect(await classLayout(page)).toEqual(layout);

  await first.fill(originalName);
  await expect(first).not.toHaveAttribute('aria-describedby');
  await expect(second).not.toHaveAttribute('aria-describedby');
  await expect(hint).toHaveCount(0);
  expect(await classLayout(page)).toEqual(layout);
}

export async function captureSetupDialog(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  const workspaceLayout = () =>
    page.locator('.training-workspace').evaluate((workspace) => ({
      height: Math.round(workspace.getBoundingClientRect().height),
      scroll: window.scrollY,
      visiblePanels: [...workspace.querySelectorAll('.training-panels [data-entry-admission]')]
        .filter((panel) => {
          const { top, bottom } = panel.getBoundingClientRect();
          return top < innerHeight && bottom > 0;
        })
        .map((panel) => ({
          admission: panel.getAttribute('data-entry-admission'),
          top: Math.round(panel.getBoundingClientRect().top),
        })),
    }));
  const initialLayout = await workspaceLayout();
  const original = await dialog.evaluateHandle((content) => ({
    content,
    overlay: content.closest('[data-slot="dialog-overlay"]'),
  }));
  async function expectStableWorkspace() {
    expect(await workspaceLayout()).toEqual(initialLayout);
  }
  async function expectSameDialog() {
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await expectStableWorkspace();
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
  }
  return { expectSameDialog, expectStableWorkspace };
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
  await expect
    .poll(() =>
      navigation.evaluate((header) => {
        const track = header.querySelector('[data-theme-switch]');
        const thumb = track?.querySelector('[data-slot="switch-thumb"]');
        const menu = header.querySelector('button[aria-label="Darstellung einstellen"]');
        const visibleIcon = (control?: Element | null) =>
          [...(control?.querySelectorAll('svg') ?? [])].find(
            (icon) => icon.getBoundingClientRect().height > 0,
          );
        const parts = [header, track, thumb, visibleIcon(thumb), menu, visibleIcon(menu)];
        const boxes = parts.map((part) => part?.getBoundingClientRect());
        if (boxes.some((box) => !box?.height)) return null;
        const centers = boxes.map((box) => box!.y + box!.height / 2);
        return {
          aligned: Math.max(...centers) - Math.min(...centers) <= 0.5,
          fullTrackHeight: (boxes[1]?.height ?? 0) + 0.001 >= 24,
        };
      }),
    )
    .toEqual({ aligned: true, fullTrackHeight: true });
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
  await expect(
    page.getByRole('status').filter({ hasText: 'Training abgeschlossen' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Modell neu trainieren', exact: true }),
  ).toBeEnabled();
}

export async function expectLivePredictionControls(page: Page) {
  const preview = page.getByLabel('Kameravorschau für Vorhersage');
  const space = page.getByRole('figure', { name: 'Merkmalsraum' });
  const stop = page.getByRole('button', { name: 'Live-Vorhersage stoppen' });
  const start = page.getByRole('button', { name: 'Live-Vorhersage starten' });
  const viewport = page.viewportSize()!;
  await expect(preview).toHaveCount(0);
  await expect(space).toHaveCount(0);
  await start.press('Enter');
  await expect(page.getByRole('progressbar', { name: 'Konfidenz für Klasse 1' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Konfidenz für Klasse 2' })).toBeVisible();
  await expect(space.getByRole('listitem').filter({ hasText: /Klasse 1.*10/ })).toBeVisible();
  await expect(space.getByRole('listitem').filter({ hasText: /Klasse 2.*10/ })).toBeVisible();
  await space.scrollIntoViewIfNeeded();
  const marker = space.locator('[data-slot="prediction-live-point"]');
  await expect(marker).toBeVisible();
  await expectAccessible(page);
  await page.setViewportSize({ width: 390, height: viewport.height });
  await expect(space).toHaveCount(0);
  await expect(preview).toBeVisible();
  await page.setViewportSize(viewport);
  await space.scrollIntoViewIfNeeded();
  await expect(marker).toBeVisible();
  await stop.press('Space');
  await expect(start).toBeFocused();
  await expect(preview).toHaveCount(0);
  await expect(space).toHaveCount(0);
}

export async function expectKeyboardCapture(page: Page) {
  const capture = page.getByRole('button', { name: 'Aufnehmen', exact: true }).first();
  const stop = page.getByRole('button', { name: 'Aufnahme stoppen', exact: true });
  await capture.focus();
  await page.keyboard.press('Enter');
  await expect(stop).toBeFocused();
  await expect(page.getByText(/^[1-9] \/ 10 Bilder$/).first()).toBeVisible();
  await page.keyboard.press('Space');
  await expect(capture).toBeFocused();
  await expect(stop).toHaveCount(0);
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
  const reset = page.getByRole('button', { name: /^Bilder der Klasse 1:/ });
  await reset.click();
  await expect(
    page.getByRole('alertdialog', { name: 'Bilder dieser Klasse löschen?' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(reset).toBeFocused();
  await expect(page.getByText('10 Bilder', { exact: true })).toHaveCount(2);
  expect(
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest('[inert], [aria-hidden="true"], [data-closed]')),
    ),
  ).toBe(false);
  await page.getByRole('button', { name: 'Neue Klasse hinzufügen' }).press('Enter');
  const name = page.getByRole('textbox', { name: 'Name für Klasse 3: Klasse 3' });
  await expect(name).toBeFocused();
  await expect(name).toBeInViewport();
  await page.getByRole('button', { name: 'Klasse 3: Klasse 3 löschen', exact: true }).click();
  const remove = page.getByRole('alertdialog', { name: 'Klasse löschen?' });
  await remove.getByRole('button', { name: 'Löschen', exact: true }).click();
  await expect(page.getByRole('textbox')).toHaveCount(2);
  await expect(page.getByText('10 Bilder', { exact: true })).toHaveCount(2);
}
