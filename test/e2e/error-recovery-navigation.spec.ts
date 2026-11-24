import { expect, test, type Page } from '@playwright/test';
import { learningPaths } from '@/lib/learning-paths';
import { diagnostics, expectAccessible } from './browser-checks';
import { expectNativeRecoveryPrerender } from './prerender-browser';

const stylesheet = 'style#error-recovery-transition';

async function observeDocumentTransitions(page: Page) {
  await page.addInitScript(() => {
    window.addEventListener('pagereveal', ({ viewTransition }) => {
      const root = document.documentElement;
      root.dataset.recoveryTransition = 'none';
      if (!viewTransition?.types.has('error-recovery')) return;
      root.dataset.recoveryTransition = 'pending';
      void viewTransition.ready
        .then(async () => {
          const layers = document.getAnimations().flatMap(({ effect }) => {
            if (!(effect instanceof KeyframeEffect) || !effect.pseudoElement) return [];
            return [effect.pseudoElement];
          });
          root.dataset.recoverySnapshots = layers
            .filter((layer) => layer.includes('(error-recovery-content)'))
            .sort()
            .join(' ');
          await viewTransition.finished;
          root.dataset.recoveryTransition = 'finished';
        })
        .catch(() => {
          root.dataset.recoveryTransition = 'skipped';
        });
    });
  });
}

async function open500(page: Page) {
  const response = await page.goto('/500');
  expect(response?.status()).toBe(500);
  await expect(
    page.getByRole('heading', { name: 'Diese Seite konnte nicht geladen werden' }),
  ).toBeVisible();
  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-recovery-transition', 'none');
  await expect(page.locator(`head ${stylesheet}`)).toHaveAttribute(
    'media',
    '(prefers-reduced-motion: no-preference)',
  );
  return page.getByRole('main').getByRole('link', { name: 'Zur Startseite' });
}

async function expectHomepage(page: Page) {
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator(`head ${stylesheet}`)).toHaveAttribute(
    'media',
    '(prefers-reduced-motion: no-preference)',
  );
}

async function observePrerenders(page: Page, pathname: string) {
  const session = await page.context().newCDPSession(page);
  const statuses: string[] = [];
  session.on('Preload.prerenderStatusUpdated', ({ key, status, prerenderStatus }) => {
    if (new URL(key.url).pathname === pathname) statuses.push(prerenderStatus ?? status);
  });
  await session.send('Preload.enable');
  return statuses;
}

async function expectPrerenderActivation(page: Page, ready: boolean) {
  if (!ready) return;
  const activationStart = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceEntry & {
      activationStart?: number;
    };
    return navigation.activationStart ?? 0;
  });
  expect(activationStart).toBeGreaterThan(0);
}

test('the native browser activates the homepage prepared by the HTTP 500 recovery link', async ({
  baseURL,
}) => {
  if (!baseURL) throw new Error('The production server URL is required.');
  await expectNativeRecoveryPrerender(baseURL);
});

test('the HTTP 500 recovery animates only the document crossing to the homepage', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const failures = diagnostics(page);
  await observeDocumentTransitions(page);
  const prerenders = await observePrerenders(page, '/');
  const action = await open500(page);
  await expect(page.locator('#error-glass-art')).toHaveAttribute('data-enhanced', 'true');
  expect(prerenders).toEqual([]);
  await action.hover();
  // Playwright's page-target attachment makes Chromium report this refusal.
  await expect.poll(() => prerenders.at(-1)).toMatch(/^(Ready|PrerenderingDisabledByDevTools)$/);
  const prerenderReady = prerenders.at(-1) === 'Ready';
  await expect(page).toHaveURL('/500');
  await action.focus();
  await expect(action).toBeFocused();
  await page.keyboard.press('Enter');
  await expectHomepage(page);
  await expectPrerenderActivation(page, prerenderReady);

  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-recovery-transition', 'finished');
  await expect(root).toHaveAttribute(
    'data-recovery-snapshots',
    '::view-transition-new(error-recovery-content) ::view-transition-old(error-recovery-content)',
  );
  await expectAccessible(page);

  await page.reload();
  await expect(root).toHaveAttribute('data-recovery-transition', 'none');
  await page.getByRole('main').getByRole('link', { name: 'Lernlabor', exact: true }).click();
  await expect(page).toHaveURL('/lernen');
  await expect(page.locator(stylesheet)).toHaveAttribute('media', 'not all');
  await page.goBack();
  await expect(page).toHaveURL('/');
  await expect(page.locator(stylesheet)).toHaveAttribute(
    'media',
    '(prefers-reduced-motion: no-preference)',
  );
  expect(
    failures.filter((message) => !/^Failed to load resource: .*status of 500\b/.test(message)),
  ).toEqual([]);
});

test('the static 500 header link replaces its icon while a document response waits', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    // Exercise browsers without speculation rules so recovery needs a document request.
    const supports = HTMLScriptElement.supports.bind(HTMLScriptElement);
    HTMLScriptElement.supports = (type) => type !== 'speculationrules' && supports(type);
  });
  await observeDocumentTransitions(page);
  await open500(page);
  const action = page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('link', { name: 'ML Teaching – Startseite' });
  const browser = await page.context().newCDPSession(page);
  await browser.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 800,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
  await action.focus();
  await expect(action).toBeFocused();
  await expect(action.locator('[data-link-glyph]')).toBeVisible();
  const feedback = page.waitForEvent('console', {
    predicate: (message) => message.text().startsWith('recovery feedback: '),
  });
  await action.evaluate((link) => {
    const observer = new MutationObserver(() => {
      const slot = link.querySelector('[data-slot="link-icon"]');
      const spinner = slot?.querySelector('[data-slot="spinner"]');
      if (!spinner) return;
      observer.disconnect();
      const glyph = slot?.querySelector('[data-link-glyph]');
      console.info(
        `recovery feedback: ${JSON.stringify({
          focused: link === document.activeElement,
          glyphHidden: Boolean(glyph && !glyph.checkVisibility({ visibilityProperty: true })),
          spinnerVisible: spinner.checkVisibility({ visibilityProperty: true }),
        })}`,
      );
    });
    observer.observe(link, { childList: true, subtree: true });
  });
  await page.keyboard.press('Enter');
  expect(JSON.parse((await feedback).text().slice('recovery feedback: '.length))).toEqual({
    focused: true,
    glyphHidden: true,
    spinnerVisible: true,
  });
  await expectHomepage(page);
});

test('training recovery prepares the public consent page without using model or camera resources', async ({
  baseURL,
  context,
  page,
}) => {
  const origin = new URL(baseURL!).origin;
  const externalRequests: string[] = [];
  await context.route(
    (url) => url.origin !== origin,
    (route) => {
      externalRequests.push(route.request().url());
      return route.abort();
    },
  );
  await context.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: () => {
        document.documentElement.dataset.cameraRequested = 'true';
        return Promise.reject(new Error('Camera access before consent'));
      },
    });
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await observeDocumentTransitions(page);
  const prerenders = await observePrerenders(page, learningPaths.imagePractice);
  await open500(page);
  expect(prerenders).toEqual([]);

  const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
  await navigation.getByRole('button', { name: 'Lernlabor', exact: true }).hover();
  const link = navigation.getByRole('link', { name: 'Bildmodell trainieren', exact: true });
  await link.focus();
  await expect(link).toBeFocused();
  await expect.poll(() => prerenders.at(-1)).toMatch(/^(Ready|PrerenderingDisabledByDevTools)$/);
  const prerenderReady = prerenders.at(-1) === 'Ready';
  await expect(page).toHaveURL('/500');

  await link.press('Enter');
  await expect(page).toHaveURL(learningPaths.imagePractice);
  await expectPrerenderActivation(page, prerenderReady);
  const consent = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  await expect(consent).toBeVisible();
  await expect(consent.getByRole('button', { name: 'Zustimmen', exact: true })).toBeDisabled();
  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-recovery-transition', 'none');
  await expect(root).not.toHaveAttribute('data-camera-requested');
  await expectAccessible(page);
  expect(externalRequests).toEqual([]);
});

test('the recovery link also works with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await observeDocumentTransitions(page);
  const action = await open500(page);
  await action.focus();
  await expect(action).toBeFocused();
  await page.keyboard.press('Enter');
  await expectHomepage(page);
  await expect(page.locator('html')).toHaveAttribute('data-recovery-transition', 'none');
});

test.describe('the 500 document without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });

  test('keeps the recovery link and a responsive optimizer poster', async ({ page }) => {
    const posterRequests: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname === '/_next/image') posterRequests.push(request.url());
    });
    const poster = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/_next/image',
    );
    expect((await page.goto('/500'))?.status()).toBe(500);
    const artwork = page.locator('#error-glass-art');
    await expect(artwork.locator('canvas')).toHaveCount(0);
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Zur Startseite' }),
    ).toBeVisible();
    expect((await poster).ok()).toBe(true);
    await expect.poll(() => posterRequests.length).toBe(1);
  });
});

test('the static 500 artwork starts automatically and supports keyboard pause and reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });
  const posterRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/_next/image') posterRequests.push(request.url());
  });
  expect((await page.goto('/500'))?.status()).toBe(500);
  const artwork = page.locator('#error-glass-art');
  const canvas = artwork.locator('canvas');
  const poster = artwork.locator('picture img');
  const impulse = page.getByRole('button', { name: 'Lichtimpuls im Glas auslösen' });
  const playback = page.getByRole('button', { name: /^Animation (pausieren|fortsetzen)$/ });
  await expect(artwork).toHaveAttribute('data-enhanced', 'true');
  await expect(poster).toBeHidden();
  expect(posterRequests).toEqual([
    await poster.evaluate((image: HTMLImageElement) => image.currentSrc),
  ]);
  const initialCanvas = await canvas.elementHandle();

  await page.getByRole('main').getByRole('link', { name: 'Zur Startseite' }).focus();
  await page.keyboard.press('Tab');
  await expect(impulse).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(playback).toBeFocused();
  await page.keyboard.press('Space');
  await expect(playback).toHaveAccessibleName('Animation fortsetzen');
  await expect(impulse).toBeDisabled();
  await page.keyboard.press('Space');
  await expect(impulse).toBeEnabled();
  expect(await canvas.evaluate((current, initial) => current === initial, initialCanvas)).toBe(
    true,
  );
  await expectAccessible(page);

  await impulse.focus();
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await expect(canvas).toHaveCount(0);
  await expect(poster).toBeVisible();
  await expect
    .poll(() => poster.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(1);
  expect(posterRequests).toEqual([
    await poster.evaluate((image: HTMLImageElement) => image.currentSrc),
  ]);
  const reducedPlayback = page.getByRole('button', { name: 'Bewegung reduziert' });
  await expect(reducedPlayback).toBeDisabled();
  await expect(reducedPlayback).toBeFocused();
});
