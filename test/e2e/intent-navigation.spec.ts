import { expect, test, type Locator, type Page, type Request } from '@playwright/test';
import {
  diagnostics,
  expectAccessible,
  observeViewTransitions,
  settleEntryAnimations,
} from './browser-checks';
import { learningPaths } from '../../src/lib/learning-paths';
import {
  arrowOffset,
  expectHiddenNavigationStatus,
  expectPageTransitions,
  expectTrainingSetupOnSource,
  feedbackArrow,
  measureLinkLayout,
  navigationStatus,
  watchStationaryHover,
} from './intent-navigation-checks';

function isLearningPayload(request: Request) {
  return new URL(request.url()).pathname === learningPaths.hub && request.headers().rsc === '1';
}

function isLearningPagePrefetch(request: Request) {
  return (
    isLearningPayload(request) &&
    Boolean(request.headers()['next-router-segment-prefetch']?.endsWith('/__PAGE__'))
  );
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
  const activation =
    intent === 'touch'
      ? 'a cold tap navigates without parallel prefetch'
      : 'defers learning payloads until intent and keeps pending navigation usable';

  test.describe(`learning navigation with ${intent} intent`, () => {
    test.use({
      hasTouch: intent === 'touch',
      viewport: intent === 'touch' ? { width: 390, height: 844 } : { width: 1280, height: 900 },
      colorScheme: intent === 'hover' ? 'dark' : 'light',
    });

    test(activation, async ({ page, baseURL }) => {
      const failures = diagnostics(page);
      const network = await holdLearningPayloads(page, baseURL!);
      const transitions = intent === 'hover' ? await observeViewTransitions(page) : undefined;
      try {
        await page.goto('/');
        await settleEntryAnimations(page);
        const navigation = page.getByRole('navigation', { name: 'Hauptnavigation', exact: true });
        const trigger = navigation.getByRole('button', {
          name: intent === 'touch' ? 'Menü' : 'Lernlabor',
          exact: true,
        });
        const link = navigation.getByRole('link', { name: 'Lernlabor-Übersicht', exact: true });
        const icon = link.locator('[data-link-glyph]');
        const spinner = link.locator('[data-slot="spinner"]');
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        if (intent === 'hover') await trigger.hover();
        else if (intent === 'touch') await trigger.tap();
        else {
          await focusByKeyboard(page, trigger);
          await page.keyboard.press('Enter');
        }
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(link).toBeInViewport();
        await expect(icon).toBeVisible();
        expect(network.payloads).toEqual([]);
        const original = await link.elementHandle();
        const linkLayout = await measureLinkLayout(link);
        await page.locator('html').evaluate((node) => {
          node.dataset.navigationProbe = 'intent';
        });
        if (intent === 'hover') await link.hover();
        else if (intent === 'keyboard') {
          await page.keyboard.press('ArrowDown');
          await expect(link).toBeFocused();
        } else await link.tap();
        if (intent !== 'touch') {
          await expect.poll(() => network.prefetches.length).toBeGreaterThan(0);
          await expect(navigationStatus(page)).toHaveCount(0);
          await expect(spinner).toHaveCount(0);
          await link.focus();
          await expect(link).toBeFocused();
          await link.hover();
          expect(await link.evaluate((node, original) => node === original, original)).toBe(true);
          if (transitions) expect(await transitions()).toEqual([]);
          if (intent === 'keyboard') await page.keyboard.press('Enter');
          else await link.click();
        } else {
          await expect.poll(() => network.payloads.length).toBeGreaterThan(0);
        }
        expect(network.documents()).toBe(1);
        await expect(spinner).toBeVisible();
        await expect(icon).toBeHidden();
        await expectHiddenNavigationStatus(page, link, 'Lernlabor-Übersicht');
        expect(await measureLinkLayout(link)).toEqual(linkLayout);
        if (intent === 'hover') await expectAccessible(page);
        network.release();
        await expect(page).toHaveURL(new RegExp(`${learningPaths.hub}$`));
        await expect(navigationStatus(page)).toHaveCount(0);
        await expect(link).toHaveCount(0);
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(
          page.getByRole('heading', { name: 'Dein Lernlabor', exact: true }),
        ).toBeVisible();
        await expectAccessible(page);
        if (intent === 'touch') expect(network.prefetches).toEqual([]);
        if (transitions)
          expect(await transitions()).toEqual([
            { root: false, outgoingPages: 1, incomingPages: 1, back: false },
          ]);
        const imageLink = page.getByRole('link', { name: 'Bilderkennung verstehen', exact: true });
        await imageLink.focus();
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(new RegExp(`${learningPaths.images}$`));
        await expect(link).toHaveCount(0);
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expectTrainingSetupOnSource(
          page,
          intent === 'keyboard' ? 'Jetzt ausprobieren' : 'Eigenes Bildmodell trainieren',
        );
        await expect(link).toHaveCount(0);
        expect(await page.locator('html').getAttribute('data-navigation-probe')).toBe('intent');
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

test('the mobile navigation keeps the current page marked and supports keyboard navigation', async ({
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
  for (const name of ['Startseite', 'Lernlabor-Übersicht', 'Impressum']) {
    const row = panel.getByRole('link', { name, exact: true });
    await row.hover();
    await expect(row).not.toHaveAttribute('aria-current', 'page');
    await expect(current).toHaveAttribute('aria-current', 'page');
  }
  await panel.getByText('Rechtliches', { exact: true }).hover();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(current).toHaveAttribute('aria-current', 'page');

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

for (const intent of ['hover', 'keyboard'] as const) {
  test(`finished ${intent} preparation supplies the complete page on first activation and reentry`, async ({
    page,
    baseURL,
  }) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
    const failures = diagnostics(page);
    const network = await holdLearningPayloads(page, baseURL!);
    const transitions = await observeViewTransitions(page);
    try {
      await page.goto('/');
      await expect(page.locator('.header-menu-mobile')).toHaveCount(0);
      const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
      const trigger = navigation.getByRole('button', { name: 'Lernlabor', exact: true });
      const overview = navigation.getByRole('link', { name: 'Lernlabor-Übersicht', exact: true });
      async function openOverview() {
        if (intent === 'hover') await trigger.hover();
        else await trigger.press('Enter');
        await expect(overview).toBeVisible();
      }
      async function prepareOverview() {
        if (intent === 'hover') await overview.hover();
        else await page.keyboard.press('ArrowDown');
      }
      const activateOverview = () =>
        intent === 'hover' ? overview.click() : page.keyboard.press('Enter');
      await openOverview();
      expect(network.payloads).toEqual([]);
      const destination = page.waitForResponse((response) =>
        isLearningPagePrefetch(response.request()),
      );
      await expect.poll(() => arrowOffset(overview)).toBe(0);
      await prepareOverview();
      await expect.poll(() => network.prefetches.length).toBeGreaterThan(0);
      let verifyHover: (() => Promise<void>) | undefined;
      if (intent === 'hover') {
        await expect.poll(() => arrowOffset(overview)).toBeGreaterThan(0);
        verifyHover = await watchStationaryHover(overview);
      }
      network.release();
      const prepared = await destination;
      expect(prepared.ok()).toBe(true);
      expect(await prepared.text()).toContain('Dein Lernlabor');
      await settleEntryAnimations(page);
      if (verifyHover) {
        await verifyHover();
        expect(await arrowOffset(overview)).toBeGreaterThan(0);
      } else {
        await expect(overview).toBeFocused();
      }

      await expectPageTransitions(page, transitions);
      const preparedRequests = network.payloads.length;
      const heading = page.getByRole('heading', { name: 'Dein Lernlabor', exact: true });
      await activateOverview();
      await expect(heading).toBeVisible();
      await expect(page).toHaveURL(learningPaths.hub);
      await expect(navigationStatus(page)).toHaveCount(0);
      await expectPageTransitions(page, transitions, 'forward');
      expect(network.payloads).toHaveLength(preparedRequests);

      await navigation.getByRole('link', { name: 'Startseite', exact: true }).press('Enter');
      await expect(page).toHaveURL('/');
      await expectPageTransitions(page, transitions, 'forward', 'forward');
      await openOverview();
      await prepareOverview();
      await activateOverview();
      await expect(heading).toBeVisible();
      await expect(page).toHaveURL(learningPaths.hub);
      await expectPageTransitions(page, transitions, 'forward', 'forward', 'forward');
      expect(network.payloads).toHaveLength(preparedRequests);
      expect(network.documents()).toBe(1);
      expect(failures).toEqual([]);
    } finally {
      network.release();
    }
  });
}

test.describe('held touch navigation', () => {
  test.use({
    hasTouch: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: 'no-preference',
  });

  test('prepares the complete learning page and reuses it on tap and reentry', async ({
    page,
    baseURL,
  }) => {
    const failures = diagnostics(page);
    const network = await holdLearningPayloads(page, baseURL!);
    const transitions = await observeViewTransitions(page);
    await page.goto('/');
    const link = page.getByRole('main').getByRole('link', { name: 'Lernlabor', exact: true });
    await link.tap({ trial: true });
    expect(network.payloads).toEqual([]);
    const bounds = (await link.boundingBox())!;
    const session = await page.context().newCDPSession(page);
    try {
      const prepared = page.waitForResponse((response) =>
        isLearningPagePrefetch(response.request()),
      );
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }],
      });
      await expect.poll(() => network.prefetches.length).toBeGreaterThan(0);
      await expect(page).toHaveURL('/');
      network.release();
      const response = await prepared;
      expect(response.ok()).toBe(true);
      expect(await response.text()).toContain('Dein Lernlabor');
      await expectPageTransitions(page, transitions);
      await expect(page).toHaveURL('/');
    } finally {
      network.release();
      try {
        // End preparation without activating the link, then use a fresh tap.
        await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      } finally {
        await session.detach();
      }
    }

    const preparedRequests = network.payloads.length;
    const heading = page.getByRole('heading', { name: 'Dein Lernlabor', exact: true });
    await link.tap();
    await expect(page).toHaveURL(learningPaths.hub);
    await expect(heading).toBeVisible();
    await expectPageTransitions(page, transitions, 'forward');
    expect(network.payloads).toHaveLength(preparedRequests);

    await page
      .getByRole('navigation', { name: 'Hauptnavigation' })
      .getByRole('link', { name: 'ML Teaching – Startseite', exact: true })
      .tap();
    await expect(page).toHaveURL('/');
    await expectPageTransitions(page, transitions, 'forward', 'back');
    await link.tap();
    await expect(page).toHaveURL(learningPaths.hub);
    await expect(heading).toBeVisible();
    await expectPageTransitions(page, transitions, 'forward', 'back', 'forward');
    expect(network.payloads).toHaveLength(preparedRequests);
    expect(network.documents()).toBe(1);
    expect(network.unexpected).toEqual([]);
    expect(failures).toEqual([]);
  });
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
    await expect.poll(() => arrowOffset(link)).toBeGreaterThan(1);
    const focusedOffset = await arrowOffset(link);
    await link.hover();
    await main.getByRole('heading', { level: 1 }).hover();
    // Give a spurious return animation time to become visible while focus stays put.
    await expect(link).toBeFocused();
    await feedbackArrow(link).evaluate(
      (arrow, minimumOffset) =>
        new Promise<void>((resolve, reject) => {
          const deadline = performance.now() + 350;
          function check() {
            const transform = getComputedStyle(arrow).transform;
            const offset = transform === 'none' ? 0 : new DOMMatrix(transform).m41;
            if (offset < minimumOffset)
              reject(new Error('The arrow moved while the link kept focus'));
            else if (performance.now() >= deadline) resolve();
            else requestAnimationFrame(check);
          }
          requestAnimationFrame(check);
        }),
      focusedOffset - 0.1,
    );
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
