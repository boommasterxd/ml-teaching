import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  diagnostics,
  expectAccessible,
  holdApplicationScripts,
  observePositionShift,
  observeViewTransitions,
  settleEntryAnimations,
} from './browser-checks';
import { learningPaths } from '../../src/lib/learning-paths';
import { headerLegalLinks } from '../../src/content/site-navigation';
import { routeSyntheticModel } from './synthetic-model';
import { grantModelConsent } from './training-keyboard';
import {
  expectHomeLearningAreas,
  expectReadable,
  expectReadableLink,
} from './initial-content-checks';

async function expectLearningHub(main: Locator) {
  await expectReadableLink(
    main.getByRole('link', { name: 'Bilderkennung verstehen' }),
    learningPaths.images,
  );
  await expectReadableLink(
    main.getByRole('link', { name: 'Eigenes Bildmodell trainieren' }),
    learningPaths.imagePractice,
  );
  const pending = main.getByRole('button', { name: 'Coming Soon' });
  await expectReadable(pending);
  await expect(pending).toBeDisabled();
}

async function expectImageExercises(main: Locator) {
  const network = main.getByRole('list', { name: 'Vom Beispielbild zur Ausgabe' });
  for (const name of ['Beispielbild', 'MobileNet', 'KNN', 'Mehrheit gewinnt']) {
    await expectReadable(network.getByRole('heading', { name, exact: true }));
  }
  await expectReadable(main.getByRole('button', { name: 'Katzenbild zeigen' }));
  await expectReadable(main.getByRole('button', { name: 'Hundebild zeigen' }));
  const everyday = main.getByRole('region', { name: 'Wo steckt Bilderkennung drin?' });
  await expectReadable(everyday.getByText(/Wähle die drei Beispiele/));
  const choices = everyday.getByRole('button', { name: /^Auswählen: / });
  await expect(choices).toHaveCount(6);
  for (const choice of await choices.all()) await expectReadable(choice);
  const neighbors = main.getByRole('region', { name: 'Welche Nachbarn zählen?' });
  await expectReadable(neighbors.getByText(/Finde die nächsten Nachbarn/));
  await expectReadable(neighbors.getByRole('button', { name: 'Übung öffnen' }));
  await expectReadableLink(
    main.getByRole('link', { name: 'Jetzt ausprobieren' }),
    learningPaths.imagePractice,
  );
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
      await expectReadable(page.getByRole('navigation', { name: 'Hauptnavigation' }));
      if (path === '/') {
        const footer = page
          .getByRole('contentinfo')
          .getByRole('navigation', { name: 'Rechtliche Links' });
        for (const name of ['Impressum', 'Datenschutz', 'Barrierefreiheit']) {
          await expectReadable(footer.getByRole('link', { name, exact: true }));
        }
      }
      const main = page.getByRole('main');
      await expectReadable(main.getByRole('heading', { level: 1 }));
      if (path === '/') await expectHomeLearningAreas(main);
      if (path === learningPaths.qLearning) {
        await expect(main).toHaveText('Coming Soon');
        await expect(main.getByRole('heading', { level: 1 })).toHaveText('Coming Soon');
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      } else {
        await expectReadable(main.getByRole('heading', { level: 2 }).first());
        await expectReadable(main.locator('p:not(.sr-only)').first());
        await expectReadable(main.getByRole('link').first());
      }
      if (path === learningPaths.hub) await expectLearningHub(main);
      if (path === learningPaths.images) await expectImageExercises(main);
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
    await page.emulateMedia({ colorScheme });
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
      await expect(model).toContainText('das KI-Modell von Google über Kaggle lädt');
      await expect(model).toContainText('damit ich die Bilderkennung ausprobieren kann');
      await expect(model).toContainText('meine IP-Adresse (meine Internetadresse)');
      await expect(model.getByRole('link')).toHaveAttribute('href', '/datenschutz');
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
      const cancel = dialog.getByRole('button', { name: 'Abbrechen', exact: true });
      await expect(confirm).toBeInViewport({ ratio: 1 });
      await expect(confirm).toBeDisabled();
      await expect(cancel).toBeInViewport({ ratio: 1 });
      await expect(cancel).toBeEnabled();
      const initialDialog = await dialog.elementHandle();
      const initialChoices = await choices.elementHandles();
      await scripts.expectHeld();
      scripts.release();
      await page.waitForLoadState('load');
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
      await cancel.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`${learningPaths.images}$`));
      expect(external).toEqual([]);
      expect(failures).toEqual([]);
    } finally {
      scripts.release();
    }
  });
}

test('remembered consent skips the first paint dialog and expires only for the next visit', async ({
  page,
  context,
  baseURL,
}) => {
  const initialTime = new Date();
  await page.clock.setFixedTime(initialTime);
  await context.grantPermissions(['camera']);
  const failures = diagnostics(page);
  const network = await routeSyntheticModel(page, baseURL!);
  const transitions = await observeViewTransitions(page);
  await page.goto(learningPaths.imagePractice);
  await grantModelConsent(page, true);
  const cameraChoice = page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
  await cameraChoice.getByRole('button', { name: 'Erlauben', exact: true }).press('Enter');
  const preview = page.getByLabel('Kameravorschau für Trainingsaufnahme').first();
  await expect(preview).toBeVisible();
  const browserStorage = () => page.evaluate(() => Object.entries(sessionStorage));
  const remembered = await browserStorage();
  expect(remembered).toHaveLength(1);
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);

  await page.clock.setFixedTime(new Date(initialTime.getTime() + 29 * 60_000));
  const scripts = await holdApplicationScripts(page);
  const consent = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  const header = page.locator('header').filter({ has: page.getByRole('heading', { level: 1 }) });
  let measureHeaderShift: () => Promise<number>;
  try {
    const response = await page.reload({ waitUntil: 'commit' });
    expect(response?.status()).toBe(200);
    expect(response?.headers()['cache-control']).toBe('public, max-age=300, must-revalidate');
    expect(await response?.text()).toContain('Einwilligung zur Datenverarbeitung');
    await scripts.expectHeld();
    await expect(consent).toBeHidden();
    await expect(header).toHaveCSS('display', 'grid');
    measureHeaderShift = await observePositionShift(header);
  } finally {
    scripts.release();
  }

  await expect(preview).toBeVisible();
  await expect(cameraChoice).toBeHidden();
  await expect(consent).toBeHidden();
  await settleEntryAnimations(page);
  expect(await measureHeaderShift()).toBeLessThan(1);
  const className = page.getByRole('textbox', { name: /^Name für Klasse / }).first();
  await className.fill('Meine Klasse');
  expect(await browserStorage()).toEqual(remembered);
  expect(await transitions()).toEqual([]);

  await page.clock.setFixedTime(new Date(initialTime.getTime() + 31 * 60_000));
  await expect(className).toHaveValue('Meine Klasse');
  await expect(preview).toBeVisible();
  expect(
    await preview.evaluate((video) => {
      const stream = (video as HTMLVideoElement).srcObject;
      return (
        stream instanceof MediaStream &&
        stream.getVideoTracks().some(({ readyState }) => readyState === 'live')
      );
    }),
  ).toBe(true);
  await expect(consent).toBeHidden();
  expect(network.modelRequests).toEqual(['graph', 'weights', 'graph', 'weights']);

  await page.reload();
  await expect(consent).toBeVisible();
  expect(await browserStorage()).toEqual([]);
  expect(await transitions()).toEqual([]);
  expect(network.modelRequests).toEqual(['graph', 'weights', 'graph', 'weights']);
  expect(network.unexpectedRequests).toEqual([]);
  expect(failures).toEqual([]);
});

test('a remembered choice expiring during hydration focuses the inline consent', async ({
  page,
  baseURL,
}) => {
  const started = Date.now();
  await page.clock.setFixedTime(started);
  await routeSyntheticModel(page, baseURL!);
  await page.goto(learningPaths.imagePractice);
  await grantModelConsent(page, true);
  await page.clock.setFixedTime(started + 30 * 60_000 - 1_000);
  const scripts = await holdApplicationScripts(page);
  const consent = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  try {
    await page.reload({ waitUntil: 'commit' });
    await scripts.expectHeld();
    await expect(consent).toBeHidden();
    await page.clock.setFixedTime(started + 30 * 60_000 + 1_000);
  } finally {
    scripts.release();
  }

  await expect(consent).toBeVisible();
  await expect.poll(() => consent.evaluate((dialog) => dialog.matches(':modal'))).toBe(true);
  await expect(consent.getByRole('checkbox').first()).toBeFocused();
});
