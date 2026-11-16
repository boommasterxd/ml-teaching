import { expect, test, type Page } from '@playwright/test';
import { diagnostics, expectAccessible } from './browser-checks';
import sharp from 'sharp';
import { syntheticModel } from './synthetic-model';
import {
  expectHeaderLayout,
  expectCancelledResetKeepsImages,
  expectGalleryFocusAcrossResize,
  expectPreviewDeletion,
  expectThemeKeepsTraining,
  expectImmediateThemeFeedback,
  openThemeMenu,
  settleLandingReveals,
} from './training-keyboard';

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

async function uploadTrainingClasses(page: Page) {
  for (const [index, background] of ['#ff0000', '#0000ff'].entries()) {
    const buffer = await sharp({ create: { width: 224, height: 224, channels: 3, background } })
      .png()
      .toBuffer();
    await page
      .locator('input[type="file"]')
      .nth(index)
      .setInputFiles(
        Array.from({ length: 10 }, (_, number) => ({
          name: `synthetic-${number}.png`,
          mimeType: 'image/png',
          buffer,
        })),
      );
  }
}

test('static documents, native navigation and strict CSP preserve visible content', async ({
  page,
  request,
}) => {
  const failures = diagnostics(page);
  const routes: [string, string | RegExp][] = [
    ['/', /Du zeigst\.\s*Deine KI lernt\./],
    ['/impressum', 'Impressum'],
    ['/datenschutz', 'Datenschutzerklärung'],
    ['/barrierefreiheit', 'Barrierefreiheit'],
  ];
  for (const [path, heading] of routes) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-security-policy']).not.toMatch(/unsafe-inline|unsafe-eval/);
    expect(response.headers()['cache-control']).toBe('public, max-age=300, must-revalidate');
    expect(response.headers()['strict-transport-security']).toBe(
      'max-age=31536000; includeSubDomains; preload',
    );
    const html = await response.text();
    expect(html).toContain('lang="de"');
    expect(html).toContain('https://mlteaching.boomapps.de');
    expect(html).not.toMatch(/\sstyle="/);
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible();
    if (path === '/') {
      await expectHeaderLayout(page);
      await settleLandingReveals(page);
    }
    await expectAccessible(page);
  }
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.dataset.navigationProbe = 'preserved';
  });
  await page.getByRole('link', { name: 'Datenschutz', exact: true }).click();
  await expect(page).toHaveURL(/\/datenschutz$/);
  expect(await page.locator('html').getAttribute('data-navigation-probe')).toBe('preserved');
  await page.goBack();
  await expect(page.getByRole('heading', { name: /Du zeigst\.\s*Deine KI lernt\./ })).toBeVisible();
  const missing = await request.get('/this-page-does-not-exist');
  expect(missing.status()).toBe(404);
  expect(missing.headers()['content-security-policy']).toBeTruthy();
  expect(await missing.text()).toContain('Seite nicht gefunden');
  const serverError = await page.context().newPage();
  try {
    const response = await serverError.goto('/500');
    expect(response?.status()).toBe(500);
    const policy = response?.headers()['content-security-policy'];
    expect(policy).toContain("default-src 'none'");
    expect(policy).not.toMatch(/unsafe-inline|unsafe-eval/);
    await expect(serverError).toHaveTitle('Seite konnte nicht geladen werden | ML Teaching');
    await expect(
      serverError.getByRole('heading', {
        name: 'Diese Seite konnte nicht geladen werden',
        exact: true,
      }),
    ).toBeVisible();
    await expectAccessible(serverError);
  } finally {
    await serverError.close();
  }
  // Inject at the response boundary; DevTools evaluation has privileged CSP behavior.
  await page.route('http://127.0.0.1:3100/', async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(
      '</body>',
      '<script>document.documentElement.dataset.injected = "executed"</script></body>',
    );
    await route.fulfill({ response, body: html });
  });
  await page.goto('/');
  const injectedRan = await page.locator('html').getAttribute('data-injected');
  expect(injectedRan).toBeNull();
  // The intentionally injected script is expected to be rejected by CSP.
  expect(
    failures.filter((message) => !message.includes('Executing inline script violates')),
  ).toEqual([]);
});

test('educational examples start directly and keep the selected control focused', async ({
  page,
}) => {
  const failures = diagnostics(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
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
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expectAccessible(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Hundebild zeigen', exact: true }).click();
  await expect(page.getByText('Hund erkannt', { exact: true })).toBeVisible();
  await expect(page.locator('.landing-demo').getByRole('status')).toContainText(
    '2 von 3 Nachbarn stimmen für Hund.',
  );
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
  await page.getByRole('link', { name: 'Lernlabor öffnen', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Zustimmen', exact: true })).toBeDisabled();
  await expectAccessible(page);
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/learning-mobile.png', fullPage: true });
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('http://127.0.0.1:3100/');
  await page.getByRole('link', { name: 'Jetzt ausprobieren' }).first().click();
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
  await page.goto('/lernen');
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
  await page.getByRole('button', { name: 'Zur Startseite', exact: true }).click();
  await expect(page).toHaveURL('http://127.0.0.1:3100/');
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
  await theme.focus();
  await page.keyboard.press('Space');
  await expect(theme).toBeChecked();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.reload();
  await expect(theme).not.toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');

  await theme.focus();
  await page.keyboard.press('Space');
  await expect(theme).toBeChecked();
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
  await expectImmediateThemeFeedback(page);
  await page.keyboard.press('Space');
  await expect(theme).not.toBeChecked();
  await expectImmediateThemeFeedback(page);
  await page.getByRole('link', { name: 'Datenschutz', exact: true }).click();
  await expect(page).toHaveURL(/\/datenschutz$/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('link', { name: 'ML Teaching – Startseite', exact: true })
    .click();
  await expect(page).toHaveURL('http://127.0.0.1:3100/');
  await page.setViewportSize({ width: 390, height: 844 });
  await theme.focus();
  await page.keyboard.press('Space');
  await expect(theme).toBeChecked();
  await settleLandingReveals(page);
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
  await page.goto('/lernen');
  await grantModelConsent(page);
  const camera = page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
  await expect(camera).toBeVisible();
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
  await page.setViewportSize({ width: 1280, height: 900 });
  expect(
    await page
      .locator('video')
      .first()
      .evaluate((element) => (element as HTMLVideoElement).srcObject),
  ).toBeNull();
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
});
