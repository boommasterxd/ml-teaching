import { expect, test, type Page } from '@playwright/test';
import {
  diagnostics,
  expectAccessible,
  expectMenuHighlight,
  settleEntryAnimations,
} from './browser-checks';

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
                return effect
                  .getKeyframes()
                  .some(
                    ({ transform }) =>
                      typeof transform === 'string' &&
                      transform !== 'none' &&
                      new DOMMatrixReadOnly(transform).m41 * direction > 0,
                  );
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
  const { background, activeColor } = await current.evaluate((link) => {
    const style = getComputedStyle(link);
    const swatch = document.createElement('span').style;
    swatch.backgroundColor = style.getPropertyValue('--primary-soft');
    return { background: swatch.backgroundColor, activeColor: style.color };
  });
  const neutral = await imprint.evaluate((link) => getComputedStyle(link).color);
  expect(neutral).not.toBe(activeColor);
  await expectMenuHighlight(current, background);
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
  await page.mouse.move(rightEdge, rowMiddle);
  await expectMenuHighlight(imprint, background);
  await expect(imprint).toHaveCSS('color', neutral);
  await expect(current).toHaveCSS('color', activeColor);
  await expect(current.locator('svg')).toHaveCSS('color', activeColor);
  const imprintBottom = await imprint.evaluate((link) => link.getBoundingClientRect().bottom);
  await page.mouse.move(rightEdge, imprintBottom + 1);
  expect(
    await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest('a')?.getAttribute('href'),
      { x: rightEdge, y: imprintBottom + 1 },
    ),
  ).toBe('/impressum');
  await expectMenuHighlight(imprint, background);
  await page.mouse.move(rightEdge, rowMiddle);
  await page.mouse.click(rightEdge, rowMiddle);
  await expect(page).toHaveURL(/\/impressum$/);
  await expect(page.getByRole('heading', { name: 'Impressum', exact: true })).toBeVisible();
  const back = sidebar.getByRole('link', { name: 'Zurück', exact: true });
  await expect(back).toHaveAttribute('href', '/datenschutz');
  await back.focus();
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

test('the keyboard legal back action animates the previous history entry', async ({ page }) => {
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
  await back.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/lernen$/);
  await expect(page.getByRole('heading', { name: 'Dein Lernlabor', exact: true })).toBeVisible();
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
