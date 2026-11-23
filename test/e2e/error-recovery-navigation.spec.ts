import { expect, test, type Page } from '@playwright/test';
import { diagnostics, expectAccessible } from './browser-checks';

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

test('the HTTP 500 recovery animates only the document crossing to the homepage', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const failures = diagnostics(page);
  await observeDocumentTransitions(page);
  const cdp = await page.context().newCDPSession(page);
  const prerenders: string[] = [];
  cdp.on('Preload.prerenderStatusUpdated', ({ key, status, prerenderStatus }) => {
    if (new URL(key.url).pathname === '/') prerenders.push(prerenderStatus ?? status);
  });
  await cdp.send('Preload.enable');
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
  if (prerenderReady) {
    const activationStart = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceEntry & {
        activationStart?: number;
      };
      return navigation.activationStart ?? 0;
    });
    expect(activationStart).toBeGreaterThan(0);
  }

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
  const impulse = page.getByRole('button', { name: 'Lichtimpuls im Glas auslösen' });
  const playback = page.getByRole('button', { name: /^Animation (pausieren|fortsetzen)$/ });
  await expect(artwork).toHaveAttribute('data-enhanced', 'true');
  expect(posterRequests).toEqual([]);
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

  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await expect(canvas).toHaveCount(0);
  const poster = artwork.locator('picture img');
  await expect(poster).toBeVisible();
  await expect
    .poll(() => poster.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(1);
  await expect(page.getByRole('button', { name: 'Bewegung reduziert' })).toBeDisabled();
});
