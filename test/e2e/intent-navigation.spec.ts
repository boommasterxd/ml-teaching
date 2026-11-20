import { expect, test, type Locator, type Page, type Request } from '@playwright/test';
import {
  diagnostics,
  expectAccessible,
  expectMenuHighlight,
  settleEntryAnimations,
} from './browser-checks';
import { learningPaths } from '../../src/lib/learning-paths';

function isLearningPayload(request: Request) {
  return new URL(request.url()).pathname === learningPaths.hub && request.headers().rsc === '1';
}

function resourceKey(request: Request) {
  const url = new URL(request.url());
  url.searchParams.delete('_rsc');
  // Next can request the route tree and individual segments independently.
  return `${url.pathname}${url.search}:${request.headers()['next-router-segment-prefetch'] ?? 'full'}`;
}

async function holdLearningPayloads(page: Page, baseURL: string) {
  const payloads: Request[] = [];
  const prefetches: Request[] = [];
  const unexpected: string[] = [];
  let documents = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++;
    if (url.origin !== new URL(baseURL).origin || /model\.json|\.bin$/.test(url.pathname))
      unexpected.push(request.url());
    if (isLearningPayload(request)) payloads.push(request);
    if (isLearningPayload(request) && request.headers()['next-router-prefetch'] === '1')
      prefetches.push(request);
  });
  await page.route('**/lernen?*', async (route) => {
    if (isLearningPayload(route.request())) await pending;
    await route.continue();
  });
  return { payloads, prefetches, unexpected, documents: () => documents, release };
}

async function focusByKeyboard(page: Page, target: Locator) {
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((node) => node === document.activeElement)) return;
  }
  throw new Error('Learning link is unreachable by keyboard.');
}

for (const intent of ['hover', 'keyboard', 'touch'] as const) {
  test.describe(`learning navigation with ${intent} intent`, () => {
    test.use({
      hasTouch: intent === 'touch',
      viewport: intent === 'touch' ? { width: 390, height: 844 } : { width: 1280, height: 900 },
      colorScheme: intent === 'hover' ? 'dark' : 'light',
    });

    test('defers learning payloads until intent and keeps pending navigation usable', async ({
      page,
      baseURL,
    }) => {
      const failures = diagnostics(page);
      const network = await holdLearningPayloads(page, baseURL!);
      try {
        await page.goto('/');
        await settleEntryAnimations(page);
        const navigation = page.getByRole('navigation', { name: 'Hauptnavigation', exact: true });
        const trigger = navigation.getByRole('button', {
          name: intent === 'touch' ? 'Menü' : 'Lernlabor',
          exact: true,
        });
        const link = navigation.getByRole('link', { name: 'Lernlabor-Übersicht', exact: true });
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        if (intent === 'hover') await trigger.hover();
        else if (intent === 'touch') await trigger.tap();
        else {
          await focusByKeyboard(page, trigger);
          await page.keyboard.press('Enter');
        }
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(link).toBeInViewport();
        expect(network.payloads).toEqual([]);
        const original = await link.elementHandle();
        await page.locator('html').evaluate((node) => {
          node.dataset.navigationProbe = 'intent';
        });
        if (intent === 'hover') await link.hover();
        else if (intent === 'keyboard') {
          await page.keyboard.press('ArrowDown');
          await expect(link).toBeFocused();
        } else await link.tap();
        await expect.poll(() => network.prefetches.length).toBeGreaterThan(0);
        if (intent !== 'touch') {
          await link.focus();
          await expect(link).toBeFocused();
          await link.hover();
          expect(await link.evaluate((node, original) => node === original, original)).toBe(true);
          if (intent === 'keyboard') await page.keyboard.press('Enter');
          else await link.click();
        }
        expect(network.documents()).toBe(1);
        network.release();
        await expect(page).toHaveURL(new RegExp(`${learningPaths.hub}$`));
        await expect(link).toHaveCount(0);
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expectAccessible(page);
        const imageLink = page.getByRole('link', { name: 'Bilderkennung verstehen', exact: true });
        await imageLink.focus();
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(new RegExp(`${learningPaths.images}$`));
        await expect(link).toHaveCount(0);
        await expect(page.getByRole('dialog')).toHaveCount(0);
        const practice = page.getByRole('link', {
          name: intent === 'keyboard' ? 'Jetzt ausprobieren' : 'Eigenes Bildmodell trainieren',
          exact: true,
        });
        await expect(practice).toHaveAttribute('href', learningPaths.imagePractice);
        await practice.focus();
        await page.keyboard.press('Enter');
        const consent = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
        await expect(consent).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`${learningPaths.imagePractice}$`));
        await expect(link).toHaveCount(0);
        expect(await page.locator('html').getAttribute('data-navigation-probe')).toBe('intent');
        await expect(
          consent.getByRole('button', { name: 'Zustimmen', exact: true }),
        ).toBeDisabled();
        await page.keyboard.press('Tab');
        expect(await consent.evaluate((node) => node.contains(document.activeElement))).toBe(true);
        await expect(page).toHaveTitle('Eigenes Bilderkennungsmodell trainieren | ML Teaching');
        await expectAccessible(page);
        const resources = network.prefetches.map(resourceKey);
        expect(new Set(resources).size).toBe(resources.length);
        expect(network.documents()).toBe(1);
        expect(network.unexpected).toEqual([]);
        expect(failures).toEqual([]);
      } finally {
        network.release();
      }
    });
  });
}

test('the mobile navigation marks the current page and moves its highlight on hover', async ({
  page,
}) => {
  const failures = diagnostics(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(learningPaths.images);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('contentinfo')).toBeVisible();
  const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
  const trigger = navigation.getByRole('button', { name: 'Menü', exact: true });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(navigation.getByRole('button', { name: 'Lernlabor', exact: true })).toHaveCount(0);
  await focusByKeyboard(page, trigger);
  await page.keyboard.press('Enter');
  const reward = navigation.getByRole('list', { name: 'Reinforcement Learning', exact: true });
  for (const label of [/^Lernen durch Belohnung\s*Coming Soon$/, /^Simulation\s*Coming Soon$/]) {
    const unavailable = reward.getByText(label);
    await expect(unavailable).toBeVisible();
    await expect(unavailable).toHaveAttribute('aria-disabled', 'true');
  }
  await expect(reward.locator('[href]')).toHaveCount(0);
  const images = navigation.getByRole('list', { name: 'Bilderkennung', exact: true });
  const current = images.getByRole('link', { name: 'Wie KI Bilder erkennt', exact: true });
  await expect(current).toHaveAttribute('aria-current', 'page');
  await expect(current).toHaveAttribute('href', learningPaths.images);
  await expect(
    images.getByRole('link', { name: 'Bildmodell trainieren', exact: true }),
  ).toHaveAttribute('href', learningPaths.imagePractice);
  await expect(navigation.getByRole('link', { name: 'Startseite', exact: true })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Impressum', exact: true })).toBeVisible();
  const panel = navigation.locator('[data-slot="navigation-menu-content"]:visible');
  const { background, currentColor } = await current.evaluate((link) => {
    const style = getComputedStyle(link);
    const swatch = document.createElement('span').style;
    swatch.backgroundColor = style.getPropertyValue('--primary-soft');
    return { background: swatch.backgroundColor, currentColor: style.color };
  });
  expect(background).toBeTruthy();
  expect(background).not.toBe('transparent');
  await expect(panel).not.toHaveCSS('background-color', background);
  await expectMenuHighlight(current, background);
  for (const name of ['Startseite', 'Lernlabor-Übersicht', 'Impressum']) {
    const row = panel.getByRole('link', { name, exact: true });
    const neutral = await row.evaluate((link) => getComputedStyle(link).color);
    expect(neutral).not.toBe(currentColor);
    await row.hover();
    await expectMenuHighlight(row, background);
    await expect(row).toHaveCSS('color', neutral);
    await expect(row.locator('svg').first()).toHaveCSS('color', neutral);
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(current).toHaveCSS('color', currentColor);
  }
  await panel.getByText('Rechtliches', { exact: true }).hover();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expectMenuHighlight(current, background);
  await expect(current).toHaveAttribute('aria-current', 'page');
  await expect(current).toHaveCSS('color', currentColor);

  await navigation.getByRole('link', { name: 'Barrierefreiheit', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(navigation.getByRole('switch')).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.press('Enter');
  await expect(navigation.getByRole('link', { name: 'Startseite', exact: true })).toBeVisible();
  await expectAccessible(page);
  await page.keyboard.press('Tab');
  const home = navigation.getByRole('link', { name: 'Startseite', exact: true });
  await expect(home).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(home).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Enter');
  await expect(home).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(home).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/');
  expect(failures).toEqual([]);
});

function feedbackArrow(link: Locator) {
  return link.locator('svg').last().locator('g').first();
}

function arrowOffset(link: Locator) {
  return feedbackArrow(link).evaluate((arrow) => {
    const transform = getComputedStyle(arrow).transform;
    return transform === 'none' ? 0 : new DOMMatrix(transform).m41;
  });
}

async function watchStationaryHover(link: Locator) {
  const probe = await feedbackArrow(link).evaluateHandle((arrow) => {
    const state = { stopped: false, lost: false };
    function check() {
      if (state.stopped) return;
      const transform = getComputedStyle(arrow).transform;
      if (!arrow.isConnected || transform === 'none' || new DOMMatrix(transform).m41 <= 0) {
        state.lost = true;
      }
      requestAnimationFrame(check);
    }
    requestAnimationFrame(check);
    return state;
  });
  return async () => {
    const lost = await probe.evaluate((state) => {
      state.stopped = true;
      return state.lost;
    });
    await probe.dispose();
    expect(lost).toBe(false);
  };
}

test('finished link preparation supplies the complete page on first activation and reentry', async ({
  page,
  baseURL,
}) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  const failures = diagnostics(page);
  const network = await holdLearningPayloads(page, baseURL!);
  try {
    await page.goto('/');
    const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
    const trigger = navigation.getByRole('button', { name: 'Lernlabor', exact: true });
    const overview = navigation.getByRole('link', { name: 'Lernlabor-Übersicht', exact: true });
    await trigger.hover();
    await expect(overview).toBeVisible();
    expect(network.payloads).toEqual([]);
    const destination = page.waitForResponse((response) => {
      const request = response.request();
      return (
        isLearningPayload(request) &&
        request.headers()['next-router-segment-prefetch']?.endsWith('/__PAGE__')
      );
    });
    await expect.poll(() => arrowOffset(overview)).toBe(0);
    await overview.hover();
    await expect.poll(() => network.prefetches.length).toBeGreaterThan(0);
    await expect.poll(() => arrowOffset(overview)).toBeGreaterThan(0);
    const verifyHover = await watchStationaryHover(overview);
    network.release();
    const prepared = await destination;
    expect(prepared.ok()).toBe(true);
    expect(await prepared.text()).toContain('Dein Lernlabor');
    await settleEntryAnimations(page);
    await verifyHover();
    expect(await arrowOffset(overview)).toBeGreaterThan(0);

    const preparedRequests = network.payloads.length;
    const heading = page.getByRole('heading', { name: 'Dein Lernlabor', exact: true });
    await overview.click();
    await expect(heading).toBeVisible();
    await expect(page).toHaveURL(learningPaths.hub);
    expect(network.payloads).toHaveLength(preparedRequests);

    await navigation.getByRole('link', { name: 'Startseite', exact: true }).click();
    await expect(page).toHaveURL('/');
    await trigger.hover();
    await overview.click();
    await expect(heading).toBeVisible();
    await expect(page).toHaveURL(learningPaths.hub);
    await settleEntryAnimations(page);
    expect(network.payloads).toHaveLength(preparedRequests);
    expect(network.documents()).toBe(1);
    expect(failures).toEqual([]);
  } finally {
    network.release();
  }
});

test('failed preparation keeps the first hover feedback and the link remains keyboard operable', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });
  const response = Promise.withResolvers<void>();
  let held = false;
  await page.route('**/lernen?*', async (route) => {
    const request = route.request();
    if (held || request.headers()['next-router-segment-prefetch'] !== '/_tree') {
      return route.continue();
    }
    held = true;
    await response.promise;
    await route.abort('connectionfailed');
  });
  try {
    await page.goto('/');
    const main = page.getByRole('main');
    const link = main.getByRole('link', { name: 'Lernlabor', exact: true });
    const failed = page.waitForEvent('requestfailed', (request) => isLearningPayload(request));
    await link.hover();
    await expect.poll(() => held).toBe(true);
    await expect.poll(() => arrowOffset(link)).toBeGreaterThan(0);
    const verifyHover = await watchStationaryHover(link);
    response.resolve();
    await failed;
    await settleEntryAnimations(page);
    await verifyHover();
    expect(await arrowOffset(link)).toBeGreaterThan(0);

    await main.getByRole('heading', { level: 1 }).hover();
    await expect.poll(() => arrowOffset(link)).toBe(0);
    await link.hover();
    await expect.poll(() => arrowOffset(link)).toBeGreaterThan(0);
    await main.getByRole('heading', { level: 1 }).hover();
    await focusByKeyboard(page, link);
    await expect.poll(() => arrowOffset(link)).toBeGreaterThan(0);
    await page.keyboard.press('Enter');
    await expect(main.getByRole('heading', { name: 'Dein Lernlabor', exact: true })).toBeVisible();
    await expectAccessible(page);
  } finally {
    response.resolve();
  }
});

test('keyboard focus has an outline in normal and forced colors', async ({ page }) => {
  for (const forcedColors of ['none', 'active'] as const) {
    await page.emulateMedia({ forcedColors });
    await page.goto('/');
    const targets = [
      page.getByRole('button', { name: 'Lernlabor', exact: true }),
      page.getByRole('button', { name: 'Darstellung einstellen', exact: true }),
      page.getByRole('main').getByRole('link', { name: 'Lernlabor', exact: true }),
    ];
    for (const control of targets) {
      await focusByKeyboard(page, control);
      await expect(control).toBeInViewport();
      await expect(control).toHaveCSS('outline-style', 'solid');
      const width = await control.evaluate((node) =>
        parseFloat(getComputedStyle(node).outlineWidth),
      );
      expect(width).toBeGreaterThanOrEqual(2);
    }
  }
});
