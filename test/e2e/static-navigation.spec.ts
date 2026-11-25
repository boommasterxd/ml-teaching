import {
  expect,
  test,
  type APIRequestContext,
  type APIResponse,
  type Page,
} from '@playwright/test';
import {
  diagnostics,
  expectAccessible,
  observeViewTransitions,
  settleEntryAnimations,
} from './browser-checks';
import {
  expectAlignedTrainingCards,
  expectHeaderLayout,
  settleLandingReveals,
} from './training-keyboard';
import { learningPaths } from '../../src/lib/learning-paths';
import { siteConfig } from '../../src/lib/site';
import { expectPageTransitions } from './intent-navigation-checks';

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

test('training consent fits a short viewport and preserves the desktop class row', async ({
  page,
}) => {
  const failures = diagnostics(page);
  const transitions = await observeViewTransitions(page);
  await page.setViewportSize({ width: 360, height: 640 });
  await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'dark' });
  await page.goto(learningPaths.imagePractice);
  const dialog = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  await expect(dialog).toBeVisible();
  expect(await transitions()).toEqual([]);
  await expect(dialog.getByRole('button', { name: 'Zustimmen' })).toBeInViewport();
  await expectAccessible(page);
  await expectAlignedTrainingCards(page);
  expect(failures).toEqual([]);
});

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

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`canceling the first brand press keeps the link usable with motion ${reducedMotion}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/500');
    const brand = page
      .getByRole('banner')
      .getByRole('link', { name: 'ML Teaching – Startseite', exact: true });
    const scale = () =>
      brand.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).a);
    await expect(brand).toBeVisible();
    await brand.hover();
    await page.mouse.down();
    if (reducedMotion === 'reduce') {
      await settleEntryAnimations(page);
      expect(await scale()).toBe(1);
    } else {
      await expect.poll(scale).toBeLessThan(0.985);
    }

    await page.mouse.move(20, 160);
    await page.mouse.up();
    await expect.poll(scale).toBeCloseTo(1);
    await expect(page).toHaveURL('/500');
    await brand.press('Enter');
    await expect(page).toHaveURL('/');
  });
}

test('mobile uses one glass poster before hydration and after a context loss', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const workers: string[] = [];
  page.on('worker', (worker) => workers.push(worker.url()));
  const scripts = Promise.withResolvers<void>();
  const scriptPattern = '**/_next/static/chunks/*.js';
  await page.route(scriptPattern, async (route) => {
    await scripts.promise;
    await route.continue();
  });
  const posters: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/_next/image' && url.searchParams.get('url')?.includes('/hero-glass'))
      posters.push(request.url());
  });
  const spinner = page.getByRole('status', { name: 'Grafik wird geladen' });
  const poster = page.locator('#home-hero-art picture img');
  try {
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(poster).toBeVisible();
    await expect
      .poll(() => poster.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(1);
    expect(posters).toEqual([await poster.evaluate((image: HTMLImageElement) => image.currentSrc)]);
    await expect(spinner).toHaveCount(0);
    await expect(page.locator('.hero-field canvas')).toHaveCount(0);
  } finally {
    scripts.resolve();
    await page.unrouteAll({ behavior: 'wait' });
  }
  await page.waitForLoadState('load');
  await expect(page.locator('.hero-field')).toHaveAttribute('data-enhanced', 'true');
  await expect(spinner).toHaveCount(0);
  await expect(poster).toBeHidden();
  expect(posters).toHaveLength(1);
  expect(workers).toHaveLength(1);
  expect(new URL(workers[0]!).origin).toBe(new URL(page.url()).origin);

  const impulse = page.getByRole('button', { name: 'Lichtimpuls im Glas auslösen' });
  await expect(impulse).toBeEnabled();
  await page.getByRole('button', { name: 'Animationen pausieren' }).press('Enter');
  await expect(impulse).toBeDisabled();
  await page.getByRole('button', { name: 'Animationen fortsetzen' }).press('Enter');
  await expect(impulse).toBeEnabled();

  await page.locator('#home-hero-art canvas').dispatchEvent('webglcontextlost', {
    cancelable: true,
  });
  await expect(page.locator('#home-hero-art canvas')).toHaveCount(0);
  await expect(poster).toBeVisible();
  await expect
    .poll(() => poster.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(1);
  expect(posters).toEqual([await poster.evaluate((image: HTMLImageElement) => image.currentSrc)]);
});

test('the homepage glass resumes on the same canvas after scrolling it out of view', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const hero = page.locator('.hero-field');
  const canvas = hero.locator('canvas');
  const impulse = page.getByRole('button', { name: 'Lichtimpuls im Glas auslösen' });
  await expect(hero).toHaveAttribute('data-enhanced', 'true');
  const initialCanvas = await canvas.elementHandle();
  await page.evaluate(() => scrollTo({ top: innerHeight * 2, behavior: 'instant' }));
  await expect(impulse).toBeDisabled();
  expect(await canvas.evaluate((node, initial) => node === initial, initialCanvas)).toBe(true);

  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect(impulse).toBeEnabled();
  await expect(hero).toHaveAttribute('data-enhanced', 'true');
  expect(await canvas.evaluate((node, initial) => node === initial, initialCanvas)).toBe(true);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(canvas).toHaveCount(0);
  await expect(hero.locator('picture')).toBeVisible();
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
  await expectPageTransitions(page, transitions, 'forward');

  await brand.press('Enter');
  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('heading', { name: /Du probierst\.\s*Deine KI lernt\./ }),
  ).toBeVisible();
  await expect(surface).toHaveCSS('opacity', '0');
  expect(await nav.evaluate((node, original) => node === original, initialNav)).toBe(true);
  await expectPageTransitions(page, transitions, 'forward', 'back');
  expect(failures).toEqual([]);
});

function expectStrictCsp(response: APIResponse) {
  const policies = response
    .headersArray()
    .filter(({ name }) => name.toLowerCase() === 'content-security-policy');
  expect(policies).toHaveLength(1);
  expect(policies[0].value).toContain("default-src 'none'");
  expect(policies[0].value).not.toMatch(/unsafe-inline|unsafe-eval/);
}

async function expectQLearningPlaceholder(page: Page) {
  const main = page.getByRole('main');
  await expect(main.getByText('Die Einführung erscheint demnächst.')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex,\s*follow/);
  await main.getByRole('link', { name: 'Zum Lernlabor', exact: true }).press('Enter');
  await expect(page).toHaveURL(learningPaths.hub);
}

async function expectInlineScriptBlocked(page: Page) {
  await page.addInitScript(() => {
    globalThis.document.addEventListener('securitypolicyviolation', (event) => {
      if (
        event.disposition === 'enforce' &&
        event.blockedURI === 'inline' &&
        event.effectiveDirective === 'script-src-elem'
      ) {
        const root = globalThis.document.documentElement;
        root.dataset.cspProbeViolations = String(Number(root.dataset.cspProbeViolations ?? 0) + 1);
      }
    });
  });
  // Inject at the response boundary; DevTools evaluation has privileged CSP behavior.
  await page.route(new URL('/', page.url()).href, async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(
      '</body>',
      '<script id="inline-csp-probe">document.documentElement.dataset.injected = "executed"</script></body>',
    );
    await route.fulfill({ response, body: html });
  });
  await page.goto('/');
  await expect(page.locator('script#inline-csp-probe')).toHaveCount(1);
  const document = page.locator('html');
  await expect(document).toHaveAttribute('data-csp-probe-violations', '1');
  await expect(document).not.toHaveAttribute('data-injected');
}

async function expectDiscoveryTargets(request: APIRequestContext) {
  const [sitemap, llms] = await Promise.all([
    request.get('/sitemap.xml'),
    request.get('/llms.txt'),
  ]);
  expect(sitemap.status()).toBe(200);
  expect(llms.status()).toBe(200);
  const [xml, markdown] = await Promise.all([sitemap.text(), llms.text()]);
  const root = siteConfig.url;
  const canonical = (href: string) => (href === `${root}/` ? root : href);
  const sitemapTargets = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), ([, href]) =>
    canonical(href),
  ).sort();
  const llmsTargets = Array.from(markdown.matchAll(/\[[^\]\n]+\]\(([^)\n]+)\)/g), ([, href]) =>
    canonical(href),
  ).sort();
  const expected = [
    root,
    ...[
      learningPaths.hub,
      learningPaths.images,
      learningPaths.imagePractice,
      '/impressum',
      '/datenschutz',
      '/barrierefreiheit',
    ].map((path) => root + path),
  ].sort();
  expect(sitemapTargets).toEqual(expected);
  expect(llmsTargets).toEqual(sitemapTargets);
}

test('static documents preserve strict CSP and visible content', async ({ page, request }) => {
  const failures = diagnostics(page);
  const routes: [string, string | RegExp][] = [
    ['/', /Du probierst\.\s*Deine KI lernt\./],
    [learningPaths.hub, 'Dein Lernlabor'],
    [learningPaths.images, /Du siehst eine Katze\.\s*Was sieht die KI\?/],
    [learningPaths.qLearning, 'Q-Learning verstehen'],
    ['/impressum', 'Impressum'],
    ['/datenschutz', 'Datenschutzerklärung'],
    ['/barrierefreiheit', 'Barrierefreiheit'],
  ];
  for (const [path, heading] of routes) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expectStrictCsp(response);
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
      const script = page.locator('script[src^="/_next/static/"][integrity]').first();
      const chunk = await request.head((await script.getAttribute('src'))!);
      expect(chunk.ok()).toBe(true);
      expect(chunk.headers()['content-security-policy']).toBeUndefined();
      expect(chunk.headers()['x-content-type-options']).toBe('nosniff');
      await expectHeaderLayout(page);
      await settleLandingReveals(page);
    }
    await expectAccessible(page);
    if (path === learningPaths.qLearning) await expectQLearningPlaceholder(page);
  }
  await expectDiscoveryTargets(request);
  const missingPath = '/this-page-does-not-exist';
  const missing = await request.get(missingPath);
  expect(missing.status()).toBe(404);
  expectStrictCsp(missing);
  expect(await missing.text()).toContain('Seite nicht gefunden');
  const missingHead = await request.head(missingPath);
  expect(missingHead.status()).toBe(404);
  expectStrictCsp(missingHead);
  expect(missingHead.headers()['content-security-policy']).toBe(
    missing.headers()['content-security-policy'],
  );
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
  await expectInlineScriptBlocked(page);
  // The intentionally injected script is expected to be rejected by CSP.
  expect(
    failures.filter((message) => !message.includes('Executing inline script violates')),
  ).toEqual([]);
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
    .toBeGreaterThan(1);
  await expect(impulse).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Bewegung reduziert' })).toBeDisabled();
  await expectAccessible(page);
  await home.press('Enter');
  await expect(page).toHaveURL('/');
  expect(failures).toEqual([]);
});
