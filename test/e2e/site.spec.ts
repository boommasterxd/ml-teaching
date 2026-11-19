import { expect, test, type Page, type Route } from '@playwright/test';
import { diagnostics, expectAccessible, settleEntryAnimations } from './browser-checks';
import { learningPaths } from '../../src/lib/learning-paths';
import sharp from 'sharp';
import { syntheticModel } from './synthetic-model';
import { expectNetworkLayout } from './network-layout';
import {
  captureSetupDialog,
  expectCancelledResetKeepsImages,
  expectGalleryFocusAcrossResize,
  expectPreviewDeletion,
  expectThemeControlAlignment,
  expectThemeKeepsTraining,
  expectThemeMenuTriggers,
  expectImmediateThemeFeedback,
  openThemeMenu,
  settleLandingReveals,
  withdrawTrainingConsent,
} from './training-keyboard';

async function pageBackgroundBrightness(page: Page) {
  // The empty page margin below the header shows the composited background, including any theme wipe.
  const banner = await page.getByRole('banner').boundingBox();
  if (!banner) throw new Error('Header is missing.');
  const y = Math.ceil(banner.y + banner.height) + 12;
  const sample = await page.screenshot({ clip: { x: 2, y, width: 4, height: 4 } });
  const pixels = await sharp(sample).removeAlpha().greyscale().raw().toBuffer();
  return pixels.reduce((sum, pixel) => sum + pixel, 0) / pixels.length;
}

async function expectRootThemeWipe(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() =>
        document
          .getAnimations()
          .some(
            (animation) =>
              animation.effect instanceof KeyframeEffect &&
              animation.effect.pseudoElement === '::view-transition-new(root)',
          ),
      ),
    )
    .toBe(true);
}

async function grantModelConsent(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  await expect(dialog).toBeVisible();
  const checkboxes = dialog.getByRole('checkbox');
  await checkboxes.nth(0).focus();
  await page.keyboard.press('Space');
  await checkboxes.nth(1).focus();
  await page.keyboard.press('Space');
  await dialog.getByRole('button', { name: 'Zustimmen', exact: true }).click();
}

async function classLayout(page: Page) {
  const names = page.getByRole('textbox', { name: /^Name für Klasse / });
  return names.evaluateAll((inputs) => {
    const [first, next] = inputs.map((input) =>
      input.closest('[data-slot="card"]')?.getBoundingClientRect(),
    );
    if (!first || !next) throw new Error('Two class cards are required.');
    return { height: first.height, spacing: next.top - first.top };
  });
}

async function uploadTrainingClasses(page: Page) {
  const empty = await classLayout(page);
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: 'unlesbar.png',
      mimeType: 'image/png',
      buffer: Buffer.from('Invalid image bytes'),
    });
  const error = page.locator('[data-slot="toast"]').filter({ hasText: 'unlesbar.png' });
  await expect(error).toHaveCount(1);
  await expect(error).toBeVisible();
  await page.keyboard.press('F6');
  await expect(page.getByRole('region', { name: 'Mitteilungen' })).toBeFocused();
  const close = error.getByRole('button', { name: 'Meldung schließen', exact: true });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await expectAccessible(page);
  await page.keyboard.press('Enter');
  await expect(error).toHaveCount(0);

  for (const [index, background] of ['#ff0000', '#0000ff'].entries()) {
    const buffer = await sharp({ create: { width: 224, height: 224, channels: 3, background } })
      .png()
      .toBuffer();
    const input = page.locator('input[type="file"]').nth(index);
    const files = Array.from({ length: 10 }, (_, number) => ({
      name: `synthetic-${number}.png`,
      mimeType: 'image/png',
      buffer,
    }));
    if (index === 0) {
      await input.setInputFiles(files.splice(0, 1));
      await expect(page.getByText('1 / 10 Bilder', { exact: true })).toBeVisible();
      expect(await classLayout(page)).toEqual(empty);
    }
    await input.setInputFiles(files);
    await expect(page.getByText('10 Bilder', { exact: true })).toHaveCount(index + 1);
  }
  expect(await classLayout(page)).toEqual(empty);
}

test('mobile information menu supports keyboard, focus return and native navigation', async ({
  page,
}) => {
  const failures = diagnostics(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/barrierefreiheit');
  const trigger = page.getByRole('button', { name: 'Informationen', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu', { name: 'Informationen', exact: true });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Impressum' })).toBeFocused();
  await expectAccessible(page);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.evaluate(() => {
    document.documentElement.dataset.navigationProbe = 'legal-menu';
  });
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem', { name: 'Datenschutz' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/datenschutz$/);
  await expect(
    page.getByRole('heading', { name: 'Datenschutzerklärung', exact: true }),
  ).toBeVisible();
  await expect(page).toHaveTitle('Datenschutz | ML Teaching');
  expect(await page.locator('html').getAttribute('data-navigation-probe')).toBe('legal-menu');
  await expectAccessible(page);
  expect(failures).toEqual([]);
});

test('educational examples start directly and keep the selected control focused', async ({
  page,
}) => {
  const failures = diagnostics(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(learningPaths.images);
  await settleLandingReveals(page);
  const stages = page.getByRole('list', { name: 'Vom Beispielbild zur Ausgabe' });
  for (const name of ['Beispielbild', 'MobileNet', 'KNN', 'Mehrheit gewinnt']) {
    await expect(stages.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  const cat = page.getByRole('button', { name: 'Katzenbild zeigen', exact: true });
  await expect(stages.getByText('Input', { exact: true })).toBeVisible();
  await expect(stages.getByRole('img')).toHaveCount(0);
  await cat.focus();
  await expect(stages.getByText('Input', { exact: true })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Katze erkannt', { exact: true })).toBeVisible();
  await expect(page.locator('.landing-demo').getByRole('status')).toContainText(
    '2 von 3 Nachbarn stimmen für Katze.',
  );
  await expect(
    stages.getByRole('img', { name: 'Generiertes Beispielbild einer Katze' }),
  ).toBeVisible();
  await expect(cat).toBeFocused();
  await expectNetworkLayout(page, 'column');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expectAccessible(page);
  await page.setViewportSize({ width: 712, height: 1291 });
  await expectNetworkLayout(page, 'grid');
  await page.getByRole('button', { name: 'Hundebild zeigen', exact: true }).click();
  await expect(page.getByText('Hund erkannt', { exact: true })).toBeVisible();
  await expect(page.locator('.landing-demo').getByRole('status')).toContainText(
    '2 von 3 Nachbarn stimmen für Hund.',
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await expectNetworkLayout(page, 'row');
  await expect(page.getByText('Hund erkannt', { exact: true })).toBeVisible();
  await expectAccessible(page);
  expect(failures).toEqual([]);
});

test('mobile consent is keyboard accessible, rejects safely and makes no external requests', async ({
  page,
  context,
}) => {
  const failures = diagnostics(page);
  const external: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:3100') external.push(request.url());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('switch', { name: 'Dunkle Darstellung' }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('switch', { name: 'Dunkle Darstellung' })).toBeChecked();
  const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
  const menu = navigation.getByRole('button', { name: 'Menü', exact: true });
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await navigation.getByRole('link', { name: 'Lernlabor-Übersicht', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${learningPaths.hub}$`));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const practice = page.getByRole('link', { name: 'Eigenes Bildmodell trainieren', exact: true });
  await practice.click();
  await expect(page).toHaveURL(learningPaths.imagePractice);
  const dialog = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Zustimmen', exact: true })).toBeDisabled();
  await expectAccessible(page);
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(learningPaths.images);
  await page.getByRole('link', { name: 'Jetzt ausprobieren', exact: true }).first().click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('checkbox').first()).not.toBeChecked();
  expect(external).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  expect(
    await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
  ).toEqual({ local: 0, session: 0 });
  expect(failures).toEqual([]);
});

test('model download is consent-gated and a failed download leaves an accessible recovery path', async ({
  page,
}) => {
  let modelRequests = 0;
  await page.route(
    /^https:\/\/(?:tfhub\.dev|www\.kaggle\.com|www\.gstatic\.com|storage\.googleapis\.com)\//,
    async (route) => {
      modelRequests++;
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: '{"error":"Synthetic model outage"}',
      });
    },
  );
  await page.goto(learningPaths.imagePractice);
  await expect(
    page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' }),
  ).toBeVisible();
  expect(modelRequests).toBe(0);
  await grantModelConsent(page);
  await expect(
    page.getByRole('alert').filter({ hasText: 'Fehler beim Laden der KI-Modelle' }),
  ).toBeVisible({ timeout: 25_000 });
  expect(modelRequests).toBeGreaterThan(0);
  await expect(
    page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' }),
  ).not.toBeVisible();
  await expectAccessible(page);
  await page.getByRole('button', { name: 'Zur Bilderkennung', exact: true }).click();
  await expect(page).toHaveURL(`http://127.0.0.1:3100${learningPaths.images}`);
});

test('consent can be withdrawn while a model download is pending', async ({ page }) => {
  const pending: Route[] = [];
  await page.route(
    /^https:\/\/(?:tfhub\.dev|www\.kaggle\.com|www\.gstatic\.com|storage\.googleapis\.com)\//,
    (route) => {
      pending.push(route);
    },
  );
  try {
    await page.goto(learningPaths.imagePractice);
    const expectSameDialog = await captureSetupDialog(page);
    expect(pending).toHaveLength(0);
    await grantModelConsent(page);
    const loading = page.getByRole('dialog', { name: 'Lade KI-Modelle...' });
    await expect(loading).toBeVisible();
    await expect.poll(() => pending.length).toBeGreaterThan(0);
    await expectSameDialog();
    await expect(loading.getByText(/Lädt die Lernseite neu/)).toHaveCount(0);
    await expectAccessible(page);
    const requestsBeforeWithdrawal = pending.length;
    await withdrawTrainingConsent(page);
    expect(pending).toHaveLength(requestsBeforeWithdrawal);
    await expectAccessible(page);
  } finally {
    await Promise.all(pending.map((route) => route.abort().catch(() => {})));
  }
});

test('theme changes preserve navigation and require explicit remembering across visits and tabs', async ({
  page,
  context,
}) => {
  const failures = diagnostics(page);
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  await page.goto('/');
  const theme = page.getByRole('switch', { name: 'Dunkle Darstellung' });
  await expect(theme).not.toBeChecked();
  await expectThemeControlAlignment(page);
  await expect.poll(() => pageBackgroundBrightness(page)).toBeGreaterThan(200);
  await theme.focus();
  await page.keyboard.press('Space');
  await expect(theme).toBeChecked();
  await expect.poll(() => pageBackgroundBrightness(page)).toBeLessThan(55);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.reload();
  await expect(theme).not.toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');

  await theme.focus();
  await page.keyboard.press('Space');
  await expect(theme).toBeChecked();
  await expectRootThemeWipe(page);
  await expectImmediateThemeFeedback(page);
  await page.keyboard.press('Space');
  await expect(theme).not.toBeChecked();
  await expectImmediateThemeFeedback(page);
  await page
    .getByRole('contentinfo')
    .getByRole('link', { name: 'Datenschutz', exact: true })
    .click();
  await expect(page).toHaveURL(/\/datenschutz$/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('link', { name: 'ML Teaching – Startseite', exact: true })
    .click();
  await expect(page).toHaveURL('http://127.0.0.1:3100/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Du probierst');
  await settleEntryAnimations(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expectThemeControlAlignment(page);
  await theme.focus();
  await page.keyboard.press('Space');
  await expect(theme).toBeChecked();
  await settleLandingReveals(page);
  await expectThemeMenuTriggers(page);
  const menu = await openThemeMenu(page);
  await expectAccessible(page);
  const remember = menu.getByRole('menuitemcheckbox', {
    name: 'Auswahl für weitere Besuche auf diesem Gerät merken',
  });
  await remember.focus();
  await page.keyboard.press('Space');
  await expect(remember).toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem('ml-teaching-theme'))).toBe('dark');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Darstellung einstellen', exact: true }),
  ).toBeFocused();
  await page.reload();
  await expect(theme).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  const other = await context.newPage();
  const otherFailures = diagnostics(other);
  try {
    await other.emulateMedia({ colorScheme: 'light' });
    await other.goto('/impressum');
    const otherTheme = other.getByRole('switch', { name: 'Dunkle Darstellung' });
    await expect(otherTheme).toBeChecked();
    await expectAccessible(other);
    const otherMenu = await openThemeMenu(other);
    const otherRemember = otherMenu.getByRole('menuitemcheckbox', {
      name: 'Auswahl für weitere Besuche auf diesem Gerät merken',
    });
    await otherRemember.focus();
    await other.keyboard.press('Space');
    await expect(otherRemember).not.toBeChecked();
    await expect(otherTheme).toBeChecked();
    await expect(theme).not.toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
    expect(await page.evaluate(() => localStorage.length)).toBe(0);
    await other.reload();
    await expect(otherTheme).not.toBeChecked();
    expect(otherFailures).toEqual([]);
  } finally {
    await other.close();
  }
  expect(failures).toEqual([]);
});

test('local images train a real browser classifier, predict and reset without uploads', async ({
  page,
}) => {
  const failures = diagnostics(page);
  let modelRequests = 0;
  const remoteWrites: string[] = [];
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method())) remoteWrites.push(request.url());
  });
  await page.route(
    /^https:\/\/(?:tfhub\.dev|www\.kaggle\.com|www\.gstatic\.com|storage\.googleapis\.com)\//,
    async (route) => {
      modelRequests++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: new URL(route.request().url()).pathname.endsWith('.bin')
          ? Buffer.from(new Int32Array([1, 2]).buffer)
          : JSON.stringify(syntheticModel),
      });
    },
  );
  await page.goto(learningPaths.imagePractice);
  await page.setViewportSize({ width: 390, height: 844 });
  const expectSameDialog = await captureSetupDialog(page);
  await grantModelConsent(page);
  const camera = page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
  await expect(camera).toBeVisible();
  await expectSameDialog();
  await camera.getByRole('button', { name: 'Ohne Kamera fortfahren' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 844 });
  const removeClass = page.getByRole('button', { name: 'Klasse 1: Klasse 1 löschen', exact: true });
  await removeClass.scrollIntoViewIfNeeded();
  const removeBounds = await removeClass.boundingBox();
  expect(removeBounds).not.toBeNull();
  expect(removeBounds!.x).toBeGreaterThanOrEqual(0);
  expect(removeBounds!.x + removeBounds!.width).toBeLessThanOrEqual(320);
  await removeClass.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(removeClass).toBeFocused();
  await expect(page.locator('video')).toHaveCount(0);
  await uploadTrainingClasses(page);
  await expectGalleryFocusAcrossResize(page);
  await expectCancelledResetKeepsImages(page);
  await expect(page.getByRole('button', { name: 'Modell trainieren', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Modell trainieren', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Bereit' })).toBeVisible();
  await expectThemeKeepsTraining(page);
  await expect(page.getByRole('button', { name: 'Starten', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Kamera aktivieren', exact: true }).click();
  await expect(camera).toBeVisible();
  await camera.getByRole('button', { name: 'Erlauben' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect
    .poll(() =>
      page
        .locator('video')
        .first()
        .evaluate((element) =>
          ((element as HTMLVideoElement).srcObject as MediaStream | null)
            ?.getTracks()
            .map((track) => track.readyState),
        ),
    )
    .toEqual(['live']);
  await expect(page.getByRole('button', { name: 'Starten', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Starten', exact: true }).click();
  await expect(page.getByRole('progressbar', { name: 'Konfidenz für Klasse 1' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Konfidenz für Klasse 2' })).toBeVisible();
  await expectAccessible(page);
  await page.getByRole('button', { name: 'Stoppen', exact: true }).click();
  await page.getByRole('button', { name: 'Modell neu trainieren', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Bereit' })).toBeVisible();
  await expectPreviewDeletion(page, expectAccessible);
  await page.getByRole('button', { name: 'Alle Klassen und Bilder zurücksetzen' }).click();
  const reset = page.getByRole('dialog', { name: 'Daten unwiderruflich löschen?' });
  await expectAccessible(page);
  await reset.getByRole('button', { name: 'Unwiderruflich löschen', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Modell trainieren', exact: true })).toBeDisabled();
  const capture = page.getByRole('button', { name: /^(Aufnehmen|Aufnahme\.\.\.)$/ }).first();
  await capture.focus();
  await page.keyboard.press('Enter');
  await expect(capture).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Space');
  await expect(capture).toHaveAttribute('aria-pressed', 'false');
  expect(modelRequests).toBe(2);
  expect(remoteWrites).toEqual([]);
  expect(failures).toEqual([]);
  await withdrawTrainingConsent(page);
  expect(modelRequests).toBe(2);
});
