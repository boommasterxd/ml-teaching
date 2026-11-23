import { expect, test, type Locator, type Page, type Route } from '@playwright/test';
import {
  diagnostics,
  expectAccessible,
  expectLiveSystemThemeChanges,
  expectNoStoredTrainingData,
  settleEntryAnimations,
} from './browser-checks';
import { learningPaths } from '../../src/lib/learning-paths';
import sharp from 'sharp';
import { failSyntheticModel, routeSyntheticModel } from './synthetic-model';
import { expectNetworkLayout } from './network-layout';
import {
  expectCameraToggleKeepsImages,
  expectLivePredictionControls,
  observeWorkspaceCamera,
} from './training-camera';
import {
  captureSetupDialog,
  classLayout,
  expectStableNameValidation,
  expectKeyboardCapture,
  expectCancelledResetKeepsImages,
  expectEmptyTrainingAfterConsent,
  expectPreviewDeletion,
  expectThemeControlAlignment,
  expectTrainingCompletion,
  expectTrainingGlide,
  expectThemeMenuTriggers,
  grantModelConsent,
  openDeferredTrainingStep,
  openThemeMenu,
  revealBottomTrainingButton,
  settleLandingReveals,
  trainingSettingsTrigger,
  withdrawTrainingConsent,
  withdrawWithActiveCamera,
} from './training-keyboard';

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

test('the native image optimizer serves the bounded hero poster as AVIF and WebP', async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const poster = page.locator('.hero-field-poster img');
  await expect
    .poll(() => poster.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(1);
  const optimized = new URL(await poster.evaluate((image: HTMLImageElement) => image.currentSrc));
  expect(optimized.pathname).toBe('/_next/image');
  expect(optimized.searchParams.get('url')).toMatch(/\.webp$/);
  const width = Number(optimized.searchParams.get('w'));
  expect(width).toBeGreaterThan(0);
  expect(width).toBeLessThanOrEqual(1200);
  for (const [accept, format] of [
    ['image/avif,image/webp', 'image/avif'],
    ['image/webp', 'image/webp'],
  ]) {
    const response = await request.get(optimized.href, { headers: { accept } });
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toBe(format);
  }
});

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
  const status = page.locator('.landing-demo').getByRole('status');
  await expect(status).toContainText('2 von 3 Nachbarn stimmen für Katze.');
  await expect(
    stages.getByRole('img', { name: 'Generiertes Beispielbild einer Katze' }),
  ).toBeVisible();
  await expect(cat).toHaveAttribute('aria-current', 'true');
  await cat.press('Enter');
  await expect(status).toContainText('Signal wird verarbeitet');
  await expect(status).toContainText('2 von 3 Nachbarn stimmen für Katze.');
  await expect(cat).toBeFocused();
  await expectNetworkLayout(page, 'column');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expectAccessible(page);
  await page.setViewportSize({ width: 712, height: 1291 });
  await expectNetworkLayout(page, 'grid');
  await page.getByRole('button', { name: 'Hundebild zeigen', exact: true }).click();
  await expect(page.getByText('Hund erkannt', { exact: true })).toBeVisible();
  await expect(status).toContainText('2 von 3 Nachbarn stimmen für Hund.');
  await expect(page.locator('.landing-demo [aria-current="true"]')).toHaveAccessibleName(
    'Hundebild zeigen',
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
  baseURL,
}) => {
  const failures = diagnostics(page);
  const localOrigin = new URL(baseURL!).origin;
  const externalOrigins: string[] = [];
  await context.route(
    (url) => ['http:', 'https:'].includes(url.protocol) && url.origin !== localOrigin,
    async (route) => {
      externalOrigins.push(new URL(route.request().url()).origin);
      await route.abort();
    },
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.getByRole('switch', { name: 'Dunkle Darstellung' })).toBeChecked();
  const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
  const menu = navigation.getByRole('button', { name: 'Menü', exact: true });
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await navigation.getByRole('link', { name: 'Lernlabor-Übersicht', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${learningPaths.hub}$`));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await menu.press('Enter');
  await navigation.getByRole('link', { name: 'Bildmodell trainieren', exact: true }).click();
  const practice = page.getByRole('link', { name: 'Eigenes Bildmodell trainieren', exact: true });
  await expect(page).toHaveURL(learningPaths.hub);
  const dialog = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Zustimmen', exact: true })).toBeDisabled();
  await expectAccessible(page);
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(menu).toBeFocused();
  await expect(page).toHaveURL(learningPaths.hub);
  await practice.press('Enter');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('checkbox').first()).not.toBeChecked();
  expect(externalOrigins).toEqual([]);
  await expectNoStoredTrainingData(page);
  expect(failures).toEqual([]);
});

test('model download is consent-gated and a failed download leaves an accessible recovery path', async ({
  page,
  baseURL,
}) => {
  const network = await routeSyntheticModel(page, baseURL!, failSyntheticModel);
  await page.goto(learningPaths.imagePractice);
  await expect(
    page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' }),
  ).toBeVisible();
  expect(network.modelRequests).toEqual([]);
  await grantModelConsent(page);
  await expect(
    page.getByRole('alert').filter({ hasText: 'Fehler beim Laden der KI-Modelle' }),
  ).toBeVisible({ timeout: 25_000 });
  expect(network.modelRequests.length).toBeGreaterThan(0);
  await expect(
    page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' }),
  ).not.toBeVisible();
  await expectAccessible(page);
  await page.getByRole('button', { name: 'Zur Bilderkennung', exact: true }).click();
  await expect(page).toHaveURL(`http://127.0.0.1:3100${learningPaths.images}`);
  expect(network.unexpectedRequests).toEqual([]);
});

test('consent can be withdrawn while a model download is pending', async ({ page, baseURL }) => {
  const pending: Route[] = [];
  const network = await routeSyntheticModel(page, baseURL!, (route) => {
    pending.push(route);
  });
  try {
    await page.goto(learningPaths.imagePractice);
    const { expectSameDialog } = await captureSetupDialog(page);
    expect(pending).toHaveLength(0);
    await grantModelConsent(page);
    const loading = page.getByRole('dialog', { name: 'Lade KI-Modelle...' });
    await expect(loading).toBeVisible();
    await expect.poll(() => pending.length).toBeGreaterThan(0);
    await expectSameDialog();
    await expect(loading.getByText(/Lädt die Lernseite neu/)).toHaveCount(0);
    await expectAccessible(page);
    const requestsBeforeWithdrawal = pending.length;
    const [aborted] = await Promise.all([
      page.waitForEvent('requestfailed', (request) => request === pending[0].request()),
      withdrawTrainingConsent(page),
    ]);
    expect(aborted.failure()?.errorText).toBe('net::ERR_ABORTED');
    expect(pending).toHaveLength(requestsBeforeWithdrawal);
    await expectAccessible(page);
    expect(network.unexpectedRequests).toEqual([]);
  } finally {
    await Promise.all(pending.map((route) => route.abort().catch(() => {})));
  }
});

async function clickDuringThemeWipe(page: Page, control: Locator) {
  const box = await control.boundingBox();
  if (!box) throw new Error('The control to click during the theme wipe is missing.');
  await expect(page.locator('[data-theme-wipe]')).toBeVisible();
  // Do not let locator actionability wait for an overlay to stop intercepting clicks.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

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
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  await theme.focus();
  await page.keyboard.press('Space');
  await expect(theme).toBeChecked();
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.reload();
  await expect(theme).not.toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
  await expectLiveSystemThemeChanges(page, theme);

  const learning = page.getByRole('main').getByRole('link', { name: 'Lernlabor', exact: true });
  await learning.scrollIntoViewIfNeeded();
  await theme.focus();
  await page.keyboard.press('Space');
  await clickDuringThemeWipe(page, theme);
  await expect(theme).not.toBeChecked();
  await expect(theme).toBeFocused();
  await clickDuringThemeWipe(page, learning);
  await expect(page).toHaveURL(learningPaths.hub);
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
    name: 'Auswahl merken',
  });
  await expect(remember).not.toBeChecked();
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
      name: 'Auswahl merken',
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
  baseURL,
}) => {
  const failures = diagnostics(page);
  const network = await routeSyntheticModel(page, baseURL!);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(learningPaths.imagePractice);
  const expectCamera = await observeWorkspaceCamera(page, 'class-colors');
  await expectNoStoredTrainingData(page);
  const { expectSameDialog, expectStableWorkspace } = await captureSetupDialog(page);
  await grantModelConsent(page);
  const camera = page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
  await expect(camera).toBeVisible();
  await expectSameDialog();
  await camera.getByRole('button', { name: 'Ohne Kamera fortfahren' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expectStableWorkspace();
  await page.setViewportSize({ width: 320, height: 844 });
  await expectStableNameValidation(page);
  const removeClass = page.getByRole('button', { name: 'Klasse 1: Klasse 1 löschen', exact: true });
  await removeClass.scrollIntoViewIfNeeded();
  const removeBounds = await removeClass.boundingBox();
  expect(removeBounds).not.toBeNull();
  expect(removeBounds!.x).toBeGreaterThanOrEqual(0);
  expect(removeBounds!.x + removeBounds!.width).toBeLessThanOrEqual(320);
  await removeClass.focus();
  await page.keyboard.press('Enter');
  const confirmRemoval = page.getByRole('alertdialog', { name: 'Klasse löschen?' });
  await expect(confirmRemoval.getByRole('button', { name: 'Abbrechen' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(confirmRemoval).toHaveCount(0);
  await expect(removeClass).toBeFocused();
  await expect(page.locator('video')).toHaveCount(0);
  await expectCamera(0, 0);
  await uploadTrainingClasses(page);
  await expectCancelledResetKeepsImages(page);
  await expectCameraToggleKeepsImages(page, expectCamera);
  const steps = page.getByRole('navigation', { name: 'Trainingsablauf' });
  const next = await revealBottomTrainingButton(page);
  await openDeferredTrainingStep(
    page,
    next,
    page.getByRole('heading', { name: 'Training', exact: true }),
  );
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expectCamera(2, 0);
  const settingsTrigger = trainingSettingsTrigger(page);
  await settingsTrigger.press('Enter');
  const settings = page.getByRole('alertdialog', { name: 'Einstellungen zum Bildtraining' });
  await expect(settings.getByRole('button', { name: 'Kamera ausschalten' })).toBeVisible();
  await expectAccessible(page);
  await page.keyboard.press('Escape');
  await expect(settingsTrigger).toBeFocused();
  await expectTrainingCompletion(page);
  await openDeferredTrainingStep(
    page,
    page.getByRole('button', { name: 'Weiter zur Vorhersage' }),
    page.getByRole('heading', { name: 'Vorhersage', exact: true }),
    () => expectCamera(2, 0),
  );
  await expect(page.getByRole('heading', { name: 'Training', exact: true })).toHaveCount(0);
  await expectLivePredictionControls(page, expectCamera);
  await page.setViewportSize({ width: 1440, height: 844 });
  await expectTrainingGlide(steps.getByRole('button', { name: 'Training', exact: true }), 'right');
  await page.setViewportSize({ width: 320, height: 844 });
  await expect(page.getByText('Training abgeschlossen', { exact: true })).toBeVisible();
  await expectCamera(5, 0);
  await steps.getByRole('button', { name: 'Bilder sammeln', exact: true }).click();
  await expect(page.getByText('10 Bilder', { exact: true })).toHaveCount(2);
  await expectCamera(6, 1);
  const predictionStep = steps.getByRole('button', { name: 'Vorhersage', exact: true });
  await expectTrainingGlide(predictionStep, 'left');
  await expect(page.getByRole('progressbar', { name: 'Konfidenz für Klasse 1' })).toBeVisible();
  await expectCamera(6, 1);
  await steps.getByRole('button', { name: 'Bilder sammeln', exact: true }).click();
  await expectPreviewDeletion(page, expectAccessible);
  await expect(predictionStep).toBeDisabled();
  const resetClass = page.getByRole('button', { name: /^Bilder der Klasse 1:/ });
  await resetClass.click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Zurücksetzen' }).click();
  await expect(next.first()).toBeDisabled();
  await expectKeyboardCapture(page);
  expect(failures).toEqual([]);
  await expect(settingsTrigger).toBeVisible();
  await expectNoStoredTrainingData(page);
  await withdrawWithActiveCamera(page);
  await expectNoStoredTrainingData(page);
  expect(network.modelRequests).toEqual(['graph', 'weights']);
  await expectEmptyTrainingAfterConsent(page);
  await expectNoStoredTrainingData(page);
  expect(network.unexpectedRequests).toEqual([]);
});
