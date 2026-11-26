import { expect, test, type Page, type Request } from '@playwright/test';
import {
  diagnostics,
  expectAccessible,
  observeViewTransitions,
  settleEntryAnimations,
} from './browser-checks';
import { waitForReflow, withReflowDiagnostics } from './reflow-checks';

type PageBackFlow = { back: boolean; outgoingRight: boolean; incomingLeft: boolean };
type PageBackObserver = typeof window & { observedBackFlow: Promise<PageBackFlow | null>[] };

async function observeBackFlow(page: Page) {
  await page.evaluate(() => {
    const observedBackFlow: PageBackObserver['observedBackFlow'] = [];
    Object.assign(window, { observedBackFlow });
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (options) => {
      const transition = start(options);
      observedBackFlow.push(
        transition.ready.then(
          () => {
            const animations = document.getAnimations();
            const moves = (side: 'old' | 'new', direction: number) =>
              animations.some(({ effect }) => {
                if (!(effect instanceof KeyframeEffect)) return false;
                const prefix = `::view-transition-${side}(`;
                if (
                  !effect.pseudoElement?.startsWith(prefix) ||
                  effect.pseudoElement === `${prefix}root)`
                )
                  return false;
                return effect.getKeyframes().some(({ transform }) => {
                  const offset =
                    typeof transform === 'string' && transform.match(/^translateX\(([-\d.]+)%\)$/);
                  return offset && Number(offset[1]) * direction > 0;
                });
              });
            return {
              back: transition.types.has('nav-back'),
              outgoingRight: moves('old', 1),
              incomingLeft: moves('new', -1),
            };
          },
          () => null,
        ),
      );
      return transition;
    };
  });
  return () => page.evaluate(() => Promise.all((window as PageBackObserver).observedBackFlow));
}

test('the mobile information menu stays reachable when text size doubles', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/barrierefreiheit');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  const sidebar = page.locator('.legal-sidebar');
  const trigger = sidebar.getByRole('button', { name: 'Informationen', exact: true });
  await waitForReflow(page);
  const expectCompleteTrigger = () =>
    withReflowDiagnostics(trigger, async () => {
      await expect(trigger).toBeInViewport({ ratio: 1 });
    });
  await expectCompleteTrigger();
  await trigger.click({ trial: true });
  await trigger.press('Enter');

  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem', { name: 'Datenschutz' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expectCompleteTrigger();
  await page.keyboard.press('Enter');
  await menu.getByRole('menuitem', { name: 'Datenschutz' }).press('Enter');
  await expect(page).toHaveURL(/\/datenschutz$/);
});

test('desktop legal navigation stays reachable while the document scrolls', async ({ page }) => {
  const failures = diagnostics(page);
  await page.setViewportSize({ width: 2325, height: 1291 });
  await page.goto('/datenschutz');
  const sidebar = page.locator('.legal-sidebar');
  const navigation = sidebar.getByRole('navigation', { name: 'Informationsseiten' });
  const initial = await sidebar.boundingBox();
  if (!initial) throw new Error('Legal navigation is not visible.');
  for (const position of [100, 800, 3000]) {
    await page.evaluate((top) => window.scrollTo(0, top), position);
    await expect.poll(async () => (await sidebar.boundingBox())?.y).toBeCloseTo(initial.y, 0);
    for (const link of await navigation.getByRole('link').all())
      await expect(link).toBeInViewport();
  }
  await expectAccessible(page);
  const imprint = sidebar.getByRole('link', { name: 'Impressum', exact: true });
  const current = sidebar.getByRole('link', { name: 'Datenschutz' });
  await expect(current).toHaveAttribute('aria-current', 'page');
  const rightEdge = await navigation.evaluate((card) => {
    const style = getComputedStyle(card);
    return (
      card.getBoundingClientRect().right -
      parseFloat(style.paddingRight) -
      parseFloat(style.borderRightWidth) -
      3
    );
  });
  const rowMiddle = await imprint.evaluate((link) => {
    const { top, height } = link.getBoundingClientRect();
    return top + height / 2;
  });
  const imprintBottom = await imprint.evaluate((link) => link.getBoundingClientRect().bottom);
  expect(
    await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest('a')?.getAttribute('href'),
      { x: rightEdge, y: imprintBottom + 1 },
    ),
  ).toBe('/impressum');
  await page.mouse.click(rightEdge, rowMiddle);
  await expect(page).toHaveURL(/\/impressum$/);
  await expect(page.getByRole('heading', { name: 'Impressum', exact: true })).toBeVisible();
  const back = sidebar.getByRole('link', { name: 'Zurück', exact: true });
  await expect(back).toHaveAttribute('href', '/datenschutz');
  await back.focus();
  await expect(back).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/datenschutz$/);
  await expect(sidebar.getByRole('link', { name: 'Datenschutz' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  // At the first entry there is only forward history.
  await expect(back).toHaveAttribute('href', '/');
  await back.click();
  await expect(page).toHaveURL('/');
  expect(failures).toEqual([]);
});

test('legal navigation layout and desktop enhancement switch at the same breakpoint', async ({
  page,
}) => {
  const height = 900;
  await page.setViewportSize({ width: 1023, height });
  await page.goto('/datenschutz');

  const sidebar = page.locator('.legal-sidebar');
  const mobile = sidebar.getByRole('button', { name: 'Informationen', exact: true });
  const desktop = sidebar.getByRole('navigation', { name: 'Informationsseiten' });
  // This shared list is mounted only after the desktop navigation has been enhanced.
  const enhanced = sidebar.locator('[data-slot="navigation-menu-list"]');
  const back = sidebar.getByRole('link', { name: 'Zurück', exact: true });
  await expect(mobile).toBeVisible();
  await expect(desktop).toBeHidden();
  await back.focus();

  await page.setViewportSize({ width: 1024, height });
  await expect(desktop).toBeVisible();
  await expect(mobile).toBeHidden();
  await expect(enhanced).toBeVisible();
  await expect(back).toBeFocused();

  const imprint = desktop.getByRole('link', { name: 'Impressum', exact: true });
  await imprint.focus();
  await page.setViewportSize({ width: 1025, height });
  await expect(enhanced).toBeVisible();
  await expect(imprint).toBeFocused();

  await back.focus();
  await page.setViewportSize({ width: 1023, height });
  await expect(mobile).toBeVisible();
  await expect(desktop).toBeHidden();
  // Check after loading the module so a hidden but mounted desktop list also fails.
  await expect(enhanced).toHaveCount(0);
  await expect(back).toBeFocused();
});

test('the keyboard legal back action animates the previous history entry', async ({ page }) => {
  await page.addInitScript(() => {
    // Hold the next native popstate before Next restores its content.
    window.addEventListener(
      'popstate',
      (event) => {
        const root = document.documentElement;
        if (!event.isTrusted || root.dataset.delayHistoryCommit !== 'true') return;
        event.stopImmediatePropagation();
        delete root.dataset.delayHistoryCommit;
        window.setTimeout(() => {
          window.dispatchEvent(new PopStateEvent('popstate', { state: event.state }));
        }, 350);
      },
      { capture: true },
    );
  });
  const failures = diagnostics(page);
  await page.goto('/lernen');
  const entryKey = () => page.evaluate(() => navigation.currentEntry?.key);
  const learningEntry = await entryKey();
  await page.getByRole('contentinfo').getByRole('link', { name: 'Impressum' }).click();
  await expect(page).toHaveURL(/\/impressum$/);
  const legalEntry = await entryKey();
  expect(legalEntry).not.toBe(learningEntry);
  const entries = await page.evaluate(() => history.length);
  const back = page.getByRole('link', { name: 'Zurück', exact: true });
  await expect(back).toHaveAttribute('href', '/lernen');
  await settleEntryAnimations(page);

  const transitions = await observeBackFlow(page);
  await page.evaluate(() => {
    document.documentElement.dataset.delayHistoryCommit = 'true';
  });
  await back.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/lernen$/);
  await expect(page.getByRole('heading', { name: 'Dein Lernlabor', exact: true })).toBeVisible();
  expect(await page.locator('html').getAttribute('data-delay-history-commit')).toBeNull();
  await settleEntryAnimations(page);
  expect(await transitions()).toEqual([{ back: true, outgoingRight: true, incomingLeft: true }]);
  expect(await entryKey()).toBe(learningEntry);
  expect(await page.evaluate(() => history.length)).toBe(entries);

  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Impressum', exact: true })).toBeVisible();
  expect(await entryKey()).toBe(legalEntry);
  expect(failures).toEqual([]);
});

test('the legal back action still uses the previous history entry after reload', async ({
  page,
}) => {
  await page.goto('/lernen');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Impressum' }).click();
  await expect(page).toHaveURL(/\/impressum$/);
  await page.reload();
  const back = page.getByRole('link', { name: 'Zurück', exact: true });
  await expect(back).toHaveAttribute('href', '/lernen');
  await back.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/lernen$/);
});

test('native legal navigation restores the same entries with one transition per traversal', async ({
  page,
}) => {
  const failures = diagnostics(page);
  const transitions = await observeViewTransitions(page);
  await page.goto('/');
  const historyKey = () => page.evaluate(() => window.navigation.currentEntry?.key);
  const homeEntry = await historyKey();
  expect(homeEntry).toBeTruthy();
  await page.evaluate(() => {
    document.documentElement.dataset.navigationProbe = 'preserved';
  });
  const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
  const legal = navigation.getByRole('button', { name: 'Rechtliches', exact: true });
  await legal.hover();
  const privacy = navigation.getByRole('link', { name: 'Datenschutz', exact: true });
  await expect(navigation.getByRole('link', { name: 'Impressum', exact: true })).toBeVisible();
  await expect(
    navigation.getByRole('link', { name: 'Barrierefreiheit', exact: true }),
  ).toBeVisible();
  const isPrivacyPayload = (request: Request) =>
    new URL(request.url()).pathname === '/datenschutz' && request.headers().rsc === '1';
  let privacyRequests = 0;
  page.on('request', (request) => {
    if (isPrivacyPayload(request)) privacyRequests++;
  });
  const [prefetched] = await Promise.all([
    page.waitForResponse((response) => {
      const request = response.request();
      return (
        isPrivacyPayload(request) &&
        request.headers()['next-router-segment-prefetch']?.endsWith('/__PAGE__') === true
      );
    }),
    privacy.hover(),
  ]);
  expect(prefetched.ok()).toBe(true);
  expect(await prefetched.text()).toContain('Datenschutz auf einen Blick');
  await expectAccessible(page);
  expect(await transitions()).toEqual([]);
  const preparedRequests = privacyRequests;

  await privacy.click();
  await expect(page).toHaveURL(/\/datenschutz$/);
  const privacyEntry = await historyKey();
  expect(privacyEntry).not.toBe(homeEntry);
  await expect(legal).toHaveAttribute('aria-expanded', 'false');
  expect(await page.locator('html').getAttribute('data-navigation-probe')).toBe('preserved');
  const privacyDocument = page.getByRole('region', { name: 'Datenschutzerklärung', exact: true });
  await expect(
    privacyDocument.getByRole('heading', { name: '1. Datenschutz auf einen Blick', exact: true }),
  ).toBeVisible();
  await settleEntryAnimations(page);
  expect(privacyRequests).toBe(preparedRequests);
  const forward = { root: false, outgoingPages: 1, incomingPages: 1, back: false };
  expect(await transitions()).toEqual([forward]);

  await page.goBack();
  await expect(
    page.getByRole('heading', { name: /Du probierst\.\s*Deine KI lernt\./ }),
  ).toBeVisible();
  expect(await historyKey()).toBe(homeEntry);
  await settleEntryAnimations(page);
  const back = { ...forward, back: true };
  expect(await transitions()).toEqual([forward, back]);
  await page.goForward();
  await expect(privacyDocument).toBeVisible();
  expect(await historyKey()).toBe(privacyEntry);
  await settleEntryAnimations(page);
  expect(privacyRequests).toBe(preparedRequests);
  expect(await transitions()).toEqual([forward, back, forward]);
  expect(failures).toEqual([]);
});
