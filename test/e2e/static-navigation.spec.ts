import { expect, test, type Page } from '@playwright/test';
import { diagnostics, expectAccessible, settleEntryAnimations } from './browser-checks';
import { expectHeaderLayout, settleLandingReveals } from './training-keyboard';
import { learningPaths } from '../../src/lib/learning-paths';

type TransitionSnapshot = {
  root: boolean;
  outgoingPages: number;
  incomingPages: number;
  back: boolean;
};
type TransitionObserver = typeof window & {
  observedTransitions: Promise<TransitionSnapshot | 'skipped'>[];
};

async function observeViewTransitions(page: Page) {
  await page.addInitScript(() => {
    const observedTransitions: TransitionObserver['observedTransitions'] = [];
    Object.assign(window, { observedTransitions });
    const start = document.startViewTransition;
    if (!start) return;
    document.startViewTransition = new Proxy(start, {
      apply(target, thisArg, args) {
        const transition = Reflect.apply(target, thisArg, args) as ViewTransition;
        observedTransitions.push(
          transition.ready.then(
            () => {
              const layers = new Set(
                document.getAnimations().map((animation) => {
                  const effect = animation.effect;
                  return effect instanceof KeyframeEffect ? effect.pseudoElement : null;
                }),
              );
              const pageLayers = (side: 'old' | 'new') => {
                const prefix = `::view-transition-${side}(`;
                return [...layers].filter(
                  (layer) => layer?.startsWith(prefix) && layer !== `${prefix}root)`,
                ).length;
              };
              // The browser assigns a width to the captured root group even without an animation.
              const rootGroup = getComputedStyle(
                document.documentElement,
                '::view-transition-group(root)',
              );
              return {
                root: Number.isFinite(Number.parseFloat(rootGroup.width)),
                outgoingPages: pageLayers('old'),
                incomingPages: pageLayers('new'),
                back: transition.types.has('nav-back'),
              };
            },
            () => 'skipped',
          ),
        );
        return transition;
      },
    });
  });
  return () => page.evaluate(() => Promise.all((window as TransitionObserver).observedTransitions));
}

async function observeMenuShifts(page: Page) {
  await page.evaluate(() => {
    type LayoutShift = PerformanceEntry & { value: number; sources: { node: Node | null }[] };
    const shifts: number[] = [];
    const record = (entries: PerformanceEntry[]) => {
      for (const entry of entries as LayoutShift[]) {
        if (
          entry.sources.some(
            ({ node }) => node instanceof Element && node.matches('.header-menu-positioner'),
          )
        )
          shifts.push(entry.value);
      }
    };
    const observer = new PerformanceObserver((list) => record(list.getEntries()));
    observer.observe({ type: 'layout-shift' });
    Object.assign(window, {
      finishMenuShiftObservation: () => {
        record(observer.takeRecords());
        observer.disconnect();
        return shifts;
      },
    });
  });
  return () =>
    page.evaluate(() =>
      (
        window as typeof window & { finishMenuShiftObservation: () => number[] }
      ).finishMenuShiftObservation(),
    );
}

test('the brand scrolls to the top of an already open homepage without a page transition', async ({
  page,
}) => {
  const transitions = await observeViewTransitions(page);
  await page.goto('/');
  await settleEntryAnimations(page);
  const header = page.getByRole('banner');
  const brand = header.getByRole('link', { name: 'ML Teaching – Startseite', exact: true });
  await brand.click();
  await page.evaluate(() => scrollTo({ top: 120, behavior: 'instant' }));
  const surface = header.locator('.site-header-surface');
  await expect(surface).toHaveCSS('opacity', '1');
  await brand.press('Enter');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(surface).toHaveCSS('opacity', '0');
  expect(await transitions()).toEqual([]);

  const previews = page.getByRole('region', { name: 'Zwei Arten, wie KI lernt', exact: true });
  await page.getByRole('link', { name: 'Mini-Experimente', exact: true }).click();
  await expect(page).toHaveURL('/#lernbereiche');
  await expect(previews).toBeFocused();
  await expect
    .poll(() => previews.evaluate((node) => node.getBoundingClientRect().top))
    .toBeLessThan(300);
  await settleEntryAnimations(page);
  await expect(surface).toHaveCSS('opacity', '1');
  expect(await transitions()).toEqual([]);
  await brand.press('Enter');
  await expect(page).toHaveURL((url) => url.pathname === '/' && url.hash === '');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(surface).toHaveCSS('opacity', '0');
  expect(await transitions()).toEqual([]);
});

test('the transparent home header lets the hero receive clicks and keeps its navigation', async ({
  page,
}) => {
  const failures = diagnostics(page);
  const transitions = await observeViewTransitions(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await settleEntryAnimations(page);
  const header = page.getByRole('banner');
  const nav = header.getByRole('navigation', { name: 'Hauptnavigation', exact: true });
  const initialNav = await nav.elementHandle();
  const surface = header.locator('.site-header-surface');
  const brand = nav.getByRole('link', { name: 'ML Teaching – Startseite', exact: true });
  const start = nav.getByRole('link', { name: 'Startseite', exact: true });
  const brandHandle = await brand.elementHandle();
  const pointerOwner = () =>
    start.evaluate((node, first) => {
      const { left, top, height } = node.getBoundingClientRect();
      const x = (first!.getBoundingClientRect().right + left) / 2;
      const hit = document.elementFromPoint(x, top + height / 2);
      return { hero: !!hit?.closest('.hero-field'), header: !!hit?.closest('header') };
    }, brandHandle);
  await expect(surface).toHaveAttribute('aria-hidden', 'true');
  await expect(surface).toHaveCSS('opacity', '0');
  const backdropTop = await page
    .locator('.hero-field-backdrop')
    .evaluate((node) => node.getBoundingClientRect().top);
  expect(backdropTop).toBeLessThanOrEqual(
    await header.evaluate((node) => node.getBoundingClientRect().top),
  );
  await expect.poll(pointerOwner).toEqual({ hero: true, header: false });

  await page.evaluate(() => scrollTo({ top: 1, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(1);
  await expect(surface).toHaveCSS('opacity', '1');
  await expect.poll(() => header.evaluate((node) => node.getBoundingClientRect().top)).toBe(0);
  await expect.poll(pointerOwner).toEqual({ hero: false, header: true });
  await page.keyboard.press('Home');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(surface).toHaveCSS('opacity', '0');
  await expect.poll(pointerOwner).toEqual({ hero: true, header: false });

  const learning = nav.getByRole('button', { name: 'Lernlabor', exact: true });
  await expect(learning).toHaveAttribute('aria-expanded', 'false');
  const menuShifts = await observeMenuShifts(page);
  await learning.hover();
  const lab = nav.getByRole('link', { name: 'Lernlabor-Übersicht', exact: true });
  await lab.click({ trial: true });
  expect(await menuShifts()).toEqual([]);
  await lab.click();
  await expect(page).toHaveURL(learningPaths.hub);
  await expect(page.getByRole('heading', { name: 'Dein Lernlabor', exact: true })).toBeVisible();
  await expect(surface).toHaveCSS('opacity', '1');
  expect(await nav.evaluate((node, original) => node === original, initialNav)).toBe(true);

  await brand.press('Enter');
  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('heading', { name: /Du probierst\.\s*Deine KI lernt\./ }),
  ).toBeVisible();
  await expect(surface).toHaveCSS('opacity', '0');
  expect(await nav.evaluate((node, original) => node === original, initialNav)).toBe(true);
  await settleEntryAnimations(page);
  expect(await transitions()).toEqual([
    { root: false, outgoingPages: 1, incomingPages: 1, back: false },
    { root: false, outgoingPages: 1, incomingPages: 1, back: true },
  ]);
  expect(failures).toEqual([]);
});

test('static documents, native navigation and strict CSP preserve visible content', async ({
  page,
  request,
}) => {
  const failures = diagnostics(page);
  const routes: [string, string | RegExp][] = [
    ['/', /Du probierst\.\s*Deine KI lernt\./],
    [learningPaths.hub, 'Dein Lernlabor'],
    [learningPaths.images, /Du siehst eine Katze\.\s*Was sieht die KI\?/],
    [learningPaths.qLearning, 'Coming Soon'],
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
    expect(/<div\b[^>]*\sdata-home-header-surface=/.test(html)).toBe(path === '/');
    if (path === learningPaths.hub) {
      expect(html).toContain(`href="${learningPaths.images}"`);
      expect(html).toContain(`href="${learningPaths.imagePractice}"`);
      expect(html).not.toContain(`href="${learningPaths.qLearning}"`);
      expect(html).not.toContain(`href="${learningPaths.qLearningPractice}"`);
      expect(html).not.toContain('Einwilligung zur Datenverarbeitung');
    }
    if (path === learningPaths.images) {
      expect(html).toContain('section-examples');
      expect(html).toContain('section-knn-quiz');
      expect(html).toContain(`href="${learningPaths.imagePractice}"`);
    }
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible();
    if (path === '/') {
      await expectHeaderLayout(page);
      await settleLandingReveals(page);
    }
    await expectAccessible(page);
  }
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain(`${learningPaths.images}</loc>`);
  expect(xml).not.toContain(`${learningPaths.qLearning}</loc>`);
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
    await expect(serverError.locator('.site-header-surface')).toHaveCSS('opacity', '1');
    await expectAccessible(serverError);
  } finally {
    await serverError.close();
  }
  // Inject at the response boundary; DevTools evaluation has privileged CSP behavior.
  await page.route(new URL('/', page.url()).href, async (route) => {
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

test('the header opens legal pages without a full reload and supports back navigation', async ({
  page,
}) => {
  const failures = diagnostics(page);
  const transitions = await observeViewTransitions(page);
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.dataset.navigationProbe = 'preserved';
  });
  const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
  const legal = navigation.getByRole('button', { name: 'Rechtliches', exact: true });
  await expect(legal).toHaveAttribute('aria-expanded', 'false');
  await legal.hover();
  const privacy = navigation.getByRole('link', { name: 'Datenschutz', exact: true });
  await expect(navigation.getByRole('link', { name: 'Impressum', exact: true })).toBeVisible();
  await expect(
    navigation.getByRole('link', { name: 'Barrierefreiheit', exact: true }),
  ).toBeVisible();
  const [prefetched] = await Promise.all([
    page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/datenschutz' &&
        response.request().headers().rsc === '1',
    ),
    privacy.hover(),
  ]);
  await prefetched.finished();
  await expectAccessible(page);
  expect(await transitions()).toEqual([]);

  await privacy.click();
  await expect(page).toHaveURL(/\/datenschutz$/);
  await expect(legal).toHaveAttribute('aria-expanded', 'false');
  expect(await page.locator('html').getAttribute('data-navigation-probe')).toBe('preserved');
  const privacyDocument = page.getByRole('region', { name: 'Datenschutzerklärung', exact: true });
  await expect(privacyDocument.locator('[data-entry-admission="scroll"]').first()).toBeAttached();
  await settleEntryAnimations(page);
  expect(await transitions()).toEqual([
    { root: false, outgoingPages: 1, incomingPages: 1, back: false },
  ]);

  await page.goBack();
  await expect(
    page.getByRole('heading', { name: /Du probierst\.\s*Deine KI lernt\./ }),
  ).toBeVisible();
  expect(failures).toEqual([]);
});

test('the missing-page artwork supports keyboard playback and reduced-motion recovery', async ({
  page,
}) => {
  const missingPath = '/this-page-does-not-exist';
  const failures = diagnostics(page, missingPath);
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });
  const response = await page.goto(missingPath);
  expect(response?.status()).toBe(404);
  const heading = page.getByRole('heading', { name: 'Seite nicht gefunden', exact: true });
  await expect(heading).toBeVisible();

  const artwork = page.locator('#error-glass-art');
  await expect(artwork).toHaveAttribute('data-enhanced', 'true');
  const home = page.getByRole('link', { name: 'Zurück zur Startseite', exact: true });
  const impulse = page.getByRole('button', { name: 'Lichtimpuls im Glas auslösen' });
  const playback = page.getByRole('button', { name: /^Animation / });
  await home.focus();
  await page.keyboard.press('Tab');
  await expect(impulse).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(playback).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(impulse).toBeDisabled();
  await expect(playback).toHaveAccessibleName('Animation fortsetzen');
  await page.keyboard.press('Enter');
  await expect(impulse).toBeEnabled();
  await expectAccessible(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  const poster = artwork.locator('img');
  await expect(poster).toBeVisible();
  await expect
    .poll(() => poster.evaluate((image) => (image as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await expect(impulse).toHaveCount(0);
  await expect(playback).toHaveCount(0);
  await expectAccessible(page);
  await home.press('Enter');
  await expect(page).toHaveURL('/');
  expect(failures).toEqual([]);
});
