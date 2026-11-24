import { expect, test, type Page } from '@playwright/test';
import {
  diagnostics,
  expectAccessible,
  expectNoStoredTrainingData,
  holdApplicationScripts,
  observePositionShift,
  observeViewTransitions,
  settleEntryAnimations,
} from './browser-checks';
import { learningPaths } from '../../src/lib/learning-paths';
import { headerLegalLinks } from '../../src/content/site-navigation';
import { routeSyntheticModel } from './synthetic-model';
import { grantModelConsent } from './training-keyboard';
import { expectPublicMain, expectReadable, expectReadableLink } from './initial-content-checks';

async function expectPublicShell(page: Page) {
  const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
  await expectReadable(navigation.getByRole('button', { name: 'Lernlabor', exact: true }));
  await expectReadable(navigation.getByRole('button', { name: 'Rechtliches', exact: true }));
  const footer = page
    .getByRole('contentinfo')
    .getByRole('navigation', { name: 'Rechtliche Links' });
  for (const { href, label } of headerLegalLinks) {
    await expectReadableLink(footer.getByRole('link', { name: label, exact: true }), href);
  }
}

async function expectLegalNavigation(page: Page, path: string) {
  const sidebar = page.getByRole('complementary').filter({
    has: page.getByRole('navigation', { name: 'Informationsseiten', includeHidden: true }),
  });
  const navigation = sidebar.getByRole('navigation', { name: 'Informationsseiten' });
  for (const { href, label } of headerLegalLinks) {
    const link = navigation.getByRole('link', { name: label, exact: true });
    await expectReadableLink(link, href);
    if (href === path) await expect(link).toHaveAttribute('aria-current', 'page');
    else await expect(link).not.toHaveAttribute('aria-current', 'page');
  }
  if (path === '/datenschutz') {
    const viewport = page.viewportSize()!;
    await page.setViewportSize({ width: 390, height: viewport.height });
    await expectReadable(sidebar.getByRole('button', { name: 'Informationen', exact: true }));
    await page.setViewportSize(viewport);
  }
}

const publicRoutes = [
  '/',
  learningPaths.hub,
  learningPaths.images,
  learningPaths.qLearning,
  '/impressum',
  '/datenschutz',
  '/barrierefreiheit',
];

for (const path of publicRoutes) {
  test(`initial public content is readable before hydration at ${path}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const failures = diagnostics(page);
    const scripts = await holdApplicationScripts(page);
    try {
      const response = await page.goto(path, { waitUntil: 'commit' });
      expect(response?.status()).toBe(200);
      await response?.finished();
      await scripts.expectHeld();
      const main = page.getByRole('main');
      await expectPublicShell(page);
      await expectPublicMain(main, path, 'static');
      if (path === learningPaths.qLearning) {
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      }
      if (headerLegalLinks.some(({ href }) => href === path)) {
        await expectLegalNavigation(page, path);
      }
      await scripts.expectHeld();
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      const measureShift = await observePositionShift(
        page.locator('body'),
        'main h1, [data-entry-reveal]',
      );
      scripts.release();
      await expect(main.getByRole('heading', { level: 1 })).toBeVisible();
      const appearance = page.getByRole('switch', { name: 'Dunkle Darstellung' });
      // The switch reflects the system theme in its ARIA state once React is ready.
      await expect(appearance).toBeChecked();
      await settleEntryAnimations(page);
      expect(await measureShift()).toBeLessThan(1);
      await expectPublicShell(page);
      await expectPublicMain(main, path, 'hydrated');
      if (headerLegalLinks.some(({ href }) => href === path)) {
        await expectLegalNavigation(page, path);
      }
      await appearance.press('Space');
      await expect(appearance).not.toBeChecked();
      expect(failures).toEqual([]);
    } finally {
      scripts.release();
    }
  });
}

for (const [path, status, heading, message, returnLabel, destination] of [
  [
    learningPaths.qLearningPractice,
    200,
    'Lernen durch Belohnung',
    'Coming Soon',
    'Zum Lernlabor',
    learningPaths.hub,
  ],
  [
    '/missing-before-hydration',
    404,
    'Seite nicht gefunden',
    'Vielleicht wurde die Seite verschoben oder der Link ist veraltet.',
    'Zurück zur Startseite',
    '/',
  ],
  [
    '/500',
    500,
    'Diese Seite konnte nicht geladen werden',
    'Bitte versuche es später erneut.',
    'Zur Startseite',
    '/',
  ],
] as const) {
  test(`availability and the return link are readable before hydration at ${path}`, async ({
    page,
  }) => {
    const scripts = await holdApplicationScripts(page);
    try {
      const response = await page.goto(path, { waitUntil: 'commit' });
      expect(response?.status()).toBe(status);
      await response?.finished();
      await scripts.expectHeld();
      const main = page.getByRole('main');
      const title = main.getByRole('heading', { name: heading, exact: true });
      const explanation = main.getByText(message, { exact: true });
      const back = main.getByRole('link', { name: returnLabel, exact: true });
      await expectReadable(title);
      await expectReadable(explanation);
      await expectReadable(back);
      await expect(back).toHaveAttribute('href', destination);
      await scripts.expectHeld();
      scripts.release();
      await page.waitForLoadState('load');
      await expect(title).toBeVisible();
      await expect(explanation).toBeVisible();
      await back.press('Enter');
      await expect(page).toHaveURL(destination);
    } finally {
      scripts.release();
    }
  });
}

for (const [path, systemTheme] of [
  ['/', 'dark'],
  ['/500', 'light'],
] as const) {
  test(`the theme switch starts in its dark position before hydration at ${path}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: systemTheme, reducedMotion: 'no-preference' });
    if (systemTheme === 'light') {
      await page.addInitScript(() => localStorage.setItem('ml-teaching-theme', 'dark'));
    }
    const scripts = await holdApplicationScripts(page);
    try {
      const response = await page.goto(path, { waitUntil: 'commit' });
      expect(response?.status()).toBe(path === '/500' ? 500 : 200);
      await scripts.expectHeld();
      await expect(page.locator('html')).toHaveClass(/\bdark\b/);

      const theme = page.getByRole('switch', { name: 'Dunkle Darstellung' });
      const thumbOffset = () =>
        theme.evaluate((track) => {
          const trackBox = track.getBoundingClientRect();
          const thumb = track.querySelector('[data-slot="switch-thumb"]')!.getBoundingClientRect();
          return thumb.x + thumb.width / 2 - (trackBox.x + trackBox.width / 2);
        });
      await expect.poll(thumbOffset).toBeGreaterThan(0);
      const initialOffset = await thumbOffset();
      scripts.release();
      await expect(theme).toBeChecked();
      expect(await thumbOffset()).toBeCloseTo(initialOffset);
    } finally {
      scripts.release();
    }
  });
}

test('the focused header trigger remains keyboard-operable across hydration', async ({ page }) => {
  const scripts = await holdApplicationScripts(page);
  try {
    await page.goto('/', { waitUntil: 'commit' });
    const trigger = page.getByRole('button', { name: 'Lernlabor', exact: true });
    await scripts.expectHeld();
    await trigger.focus();
    await expect(trigger).toBeFocused();
    scripts.release();
    await page.waitForLoadState('load');
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  } finally {
    scripts.release();
  }
});

test('the static error header retains focus and starts only the matching menu', async ({
  page,
}) => {
  await page.setViewportSize({ width: 412, height: 823 });
  const scripts = await holdApplicationScripts(page);
  try {
    const response = await page.goto('/500', { waitUntil: 'commit' });
    expect(response?.status()).toBe(500);
    await scripts.expectHeld();
    const mobile = page.getByRole('button', { name: 'Menü', exact: true });
    const desktop = page.getByRole('button', {
      name: 'Lernlabor',
      exact: true,
      includeHidden: true,
    });
    await expect(mobile).toBeVisible();
    await expect(desktop).toBeAttached();
    await mobile.focus();
    scripts.release();
    await page.waitForLoadState('load');
    await expect(mobile).toBeFocused();
    await expect(desktop).toHaveCount(0);
    await mobile.press('Enter');
    const overview = page.getByRole('link', { name: 'Lernlabor-Übersicht', exact: true });
    await expect(overview).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(mobile).toHaveAttribute('aria-expanded', 'false');

    await page.setViewportSize({ width: 1280, height: 823 });
    await expect(desktop).toBeVisible();
    await expect(page.locator('.header-menu-mobile')).toHaveCount(0);
    await desktop.press('Enter');
    await expect(overview).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(desktop).toBeFocused();
  } finally {
    scripts.release();
  }
});

for (const [width, colorScheme] of [
  [390, 'dark'],
  [1280, 'light'],
] as const) {
  test(`complete initial consent survives hydration at ${width}px`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: width === 390 ? 350 : 900 });
    await page.emulateMedia({
      colorScheme,
      reducedMotion: width === 390 ? 'reduce' : 'no-preference',
    });
    const failures = diagnostics(page);
    const transitions = await observeViewTransitions(page);
    const external: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== baseURL) external.push(request.url());
    });
    const scripts = await holdApplicationScripts(page);
    try {
      const response = await page.goto(learningPaths.imagePractice, { waitUntil: 'commit' });
      expect(response?.status()).toBe(200);
      await response?.finished();
      await scripts.expectHeld();
      const dialog = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
      await expect(dialog.getByRole('heading')).toBeInViewport({ ratio: 1 });
      const local = dialog.locator('label[for="privacy-consent"]');
      const model = dialog.locator('label[for="model-consent"]');
      await expectReadable(local);
      await expect(local).toContainText(
        'Beim Lernen und Testen bleiben Bilder und daraus gewonnene Daten in meinem Browser.',
      );
      await expect(local).toContainText('Über die Kamera entscheide ich extra.');
      await expect(local.getByRole('link')).toHaveAttribute('href', '/datenschutz');
      await expectReadable(model);
      await expect(model).toHaveText(
        'Ich stimme zu, dass mein Browser das KI-Modell lädt. Google und Kaggle erhalten dabei meine IP-Adresse.',
      );
      await expectReadable(dialog.getByRole('note'));
      await expect(dialog.getByRole('note')).toContainText(
        'Auch ohne Zustimmung kannst du über Bilderkennung lesen',
      );
      const choices = dialog.getByRole('checkbox');
      await expect(choices).toHaveCount(3);
      const remember = dialog.getByRole('checkbox', {
        name: 'Für 30 Minuten in diesem Tab merken',
        exact: true,
      });
      await expect(remember).toBeVisible();
      for (const choice of await choices.all()) {
        await expectReadable(choice);
        await expect(choice).not.toBeChecked();
      }
      const confirm = dialog.getByRole('button', { name: 'Zustimmen', exact: true });
      const cancel = dialog.getByRole('link', { name: 'Abbrechen', exact: true });
      await expect(confirm).toBeInViewport({ ratio: 1 });
      await expect(confirm).toBeDisabled();
      await expect(cancel).toBeInViewport({ ratio: 1 });
      await expect(cancel).toHaveAttribute('href', learningPaths.images);
      await page.keyboard.press('Tab');
      await expect(choices.first()).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(local.getByRole('link')).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(choices.first()).toBeFocused();
      const initialDialog = await dialog.elementHandle();
      const initialChoices = await choices.elementHandles();
      await scripts.expectHeld();
      scripts.release();
      await page.waitForLoadState('load');
      await expect(dialog.and(page.locator('dialog:modal'))).toBeVisible();
      expect(await dialog.evaluate((node, original) => node === original, initialDialog)).toBe(
        true,
      );
      await expect
        .poll(() => dialog.evaluate((node) => node.contains(document.activeElement)))
        .toBe(true);
      for (const [index, choice] of (await choices.all()).entries()) {
        expect(
          await choice.evaluate((node, original) => node === original, initialChoices[index]),
        ).toBe(true);
      }
      const required = dialog.getByRole('checkbox', { name: /^Ich stimme zu/ });
      await expect(required).toHaveCount(2);
      for (const [index, choice] of (await required.all()).entries()) {
        await choice.focus();
        await page.keyboard.press('Space');
        await expect(choice).toBeChecked();
        if (index === 0) await expect(confirm).toBeDisabled();
        else await expect(confirm).toBeEnabled();
      }
      await expect(remember).not.toBeChecked();
      await expectAccessible(page);
      expect(await transitions()).toEqual([]);
      if (width === 390) {
        await page.keyboard.press('Escape');
      } else {
        await cancel.press('Enter');
      }
      await expect(page).toHaveURL(new RegExp(`${learningPaths.images}$`));
      expect(external).toEqual([]);
      expect(failures).toEqual([]);
    } finally {
      scripts.release();
    }
  });
}

test.describe('training entry with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });

  test('the initial consent can be declined using the keyboard', async ({ page }) => {
    await page.goto(learningPaths.imagePractice);
    const workspace = page.locator('.training-workspace');
    await expect(workspace).toHaveAttribute('inert', '');
    await expect(workspace.locator('#training-images')).toBeVisible();
    await expect(workspace.locator('#class-name-class-1')).toHaveValue('Klasse 1');
    await expect(workspace.locator('#class-name-class-2')).toHaveValue('Klasse 2');
    const dialog = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
    const cancel = dialog.getByRole('link', { name: 'Abbrechen', exact: true });
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('checkbox').first()).toBeFocused();
    await dialog.getByRole('checkbox').last().focus();
    await page.keyboard.press('Tab');
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${learningPaths.images}$`));
  });
});

test('a reload or a new tab never restores a remembered camera choice', async ({
  page,
  context,
  baseURL,
}) => {
  await context.grantPermissions(['camera']);
  await context.addInitScript(() => {
    const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = (constraints) => {
      document.documentElement.dataset.requestedCamera = 'true';
      return getUserMedia(constraints);
    };
  });
  const popupExternal: string[] = [];
  await context.route(/^https?:[\/]{2}/, async (route) => {
    if (new URL(route.request().url()).origin === baseURL) return route.continue();
    popupExternal.push(route.request().resourceType());
    await route.abort();
  });
  const network = await routeSyntheticModel(page, baseURL!);
  await page.goto(learningPaths.imagePractice);
  await grantModelConsent(page, true);
  const camera = page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
  await camera.getByRole('button', { name: 'Erlauben', exact: true }).press('Enter');
  await expect(page.getByLabel('Kameravorschau für Trainingsaufnahme').first()).toBeVisible();
  await expectNoStoredTrainingData(page);
  expect(network.modelRequests).toEqual(['graph', 'weights']);

  await page.evaluate(() => {
    sessionStorage.setItem('ml-teaching-training-consent', `1:${Date.now() + 60_000}:allowed`);
  });
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.evaluate((path) => {
      window.open(path, '_blank');
    }, learningPaths.imagePractice),
  ]);
  try {
    await expectFreshConsent(popup);
    expect(await popup.evaluate(() => sessionStorage.length)).toBe(1);
  } finally {
    await popup.close();
  }

  await page.reload();
  await expectFreshConsent(page);
  expect(network.modelRequests).toEqual(['graph', 'weights']);
  expect(network.unexpectedRequests).toEqual([]);
  expect(popupExternal).toEqual([]);
});

async function expectFreshConsent(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate((node) => node.matches(':modal'))).toBe(true);
  await expect(dialog.getByRole('button', { name: 'Zustimmen' })).toBeDisabled();
  await expect(page.locator('html')).not.toHaveAttribute('data-requested-camera');
}
