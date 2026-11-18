import { expect, test } from '@playwright/test';
import { diagnostics, expectAccessible, settleEntryAnimations } from './browser-checks';
import { expectHeaderLayout, settleLandingReveals } from './training-keyboard';
import { learningPaths } from '../../src/lib/learning-paths';

test('the brand scrolls to the top of an already open homepage without a page transition', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const start = document.startViewTransition;
    if (!start) return;
    document.startViewTransition = new Proxy(start, {
      apply(target, thisArg, args) {
        const { dataset } = document.documentElement;
        dataset.observedViewTransitions = String(Number(dataset.observedViewTransitions ?? 0) + 1);
        return Reflect.apply(target, thisArg, args);
      },
    });
  });
  await page.goto('/');
  await settleEntryAnimations(page);
  const header = page.getByRole('banner');
  const brand = header.getByRole('link', { name: 'ML Teaching – Startseite', exact: true });
  const documentRoot = page.locator('html');
  const transitionCount = () => documentRoot.getAttribute('data-observed-view-transitions');
  await brand.click();
  await page.evaluate(() => scrollTo({ top: 120, behavior: 'instant' }));
  const surface = header.locator('.site-header-surface');
  await expect(surface).toHaveCSS('opacity', '1');
  await brand.press('Enter');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(surface).toHaveCSS('opacity', '0');
  expect(await transitionCount()).toBeNull();

  const previews = page.getByRole('region', { name: 'Zwei Arten, wie KI lernt', exact: true });
  await page.getByRole('link', { name: 'Mini-Experimente', exact: true }).click();
  await expect(page).toHaveURL('/#lernbereiche');
  await expect(previews).toBeFocused();
  await expect
    .poll(() => previews.evaluate((node) => node.getBoundingClientRect().top))
    .toBeLessThan(300);
  await settleEntryAnimations(page);
  await expect(surface).toHaveCSS('opacity', '1');
  const beforeBrand = await transitionCount();
  await brand.press('Enter');
  await expect(page).toHaveURL((url) => url.pathname === '/' && url.hash === '');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(surface).toHaveCSS('opacity', '0');
  expect(await transitionCount()).toBe(beforeBrand);
});

test('the transparent home header lets the hero receive clicks and keeps its navigation', async ({
  page,
}) => {
  const failures = diagnostics(page);
  await page.goto('/');
  await settleEntryAnimations(page);
  const header = page.getByRole('banner');
  const nav = header.getByRole('navigation', { name: 'Hauptnavigation', exact: true });
  const initialNav = await nav.elementHandle();
  const surface = header.locator('.site-header-surface');
  const pointerOwner = () =>
    header.evaluate((node) => {
      const { top, height } = node.getBoundingClientRect();
      const hit = document.elementFromPoint(window.innerWidth / 2, top + height / 2);
      return { hero: !!hit?.closest('.hero-field'), header: node.contains(hit) };
    });
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

  const lab = nav.getByRole('link', { name: 'Lernlabor öffnen', exact: true });
  await lab.click();
  await expect(page).toHaveURL(learningPaths.hub);
  await expect(page.getByRole('heading', { name: 'Dein Lernlabor', exact: true })).toBeVisible();
  await expect(surface).toHaveCSS('opacity', '1');
  expect(await nav.evaluate((node, original) => node === original, initialNav)).toBe(true);

  const brand = nav.getByRole('link', { name: 'ML Teaching – Startseite', exact: true });
  await brand.press('Enter');
  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('heading', { name: /Du probierst\.\s*Deine KI lernt\./ }),
  ).toBeVisible();
  await expect(surface).toHaveCSS('opacity', '0');
  expect(await nav.evaluate((node, original) => node === original, initialNav)).toBe(true);
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
      expect(html).toContain(`href="${learningPaths.qLearningPractice}"`);
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
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.dataset.navigationProbe = 'preserved';
  });
  await page.getByRole('link', { name: 'Datenschutz', exact: true }).click();
  await expect(page).toHaveURL(/\/datenschutz$/);
  expect(await page.locator('html').getAttribute('data-navigation-probe')).toBe('preserved');
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: /Du probierst\.\s*Deine KI lernt\./ }),
  ).toBeVisible();
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
