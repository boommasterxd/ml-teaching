import { expect, type Locator, type Page } from '@playwright/test';
import { learningPaths } from '../../src/lib/learning-paths';
import {
  expectAccessible,
  settleEntryAnimations,
  type observeViewTransitions,
} from './browser-checks';

export function navigationStatus(page: Page) {
  return page.getByRole('status').filter({ hasText: 'Seite wird geladen …' });
}

export async function expectHiddenNavigationStatus(page: Page, link: Locator, name: string) {
  const status = navigationStatus(page);
  await expect(status).toHaveText('Seite wird geladen …');
  await expect(link).toHaveAccessibleName(name);
  await expect
    .poll(() =>
      status.evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        const clipped = ['hidden', 'clip'];
        return {
          outsideLink: !node.closest('a'),
          outOfFlow: ['absolute', 'fixed'].includes(style.position),
          clippedToPixel:
            bounds.width <= 1 &&
            bounds.height <= 1 &&
            clipped.includes(style.overflowX) &&
            clipped.includes(style.overflowY),
        };
      }),
    )
    .toEqual({ outsideLink: true, outOfFlow: true, clippedToPixel: true });
}

export function measureLinkLayout(link: Locator) {
  return link.evaluate((element) => {
    const anchor = element as HTMLAnchorElement;
    return [anchor.offsetLeft, anchor.offsetTop, anchor.offsetWidth, anchor.offsetHeight];
  });
}

export async function expectTrainingSetupOnSource(page: Page, actionName: string) {
  const practice = page.getByRole('link', { name: actionName, exact: true });
  await expect(practice).toHaveAttribute('href', learningPaths.imagePractice);
  await practice.focus();
  await page.keyboard.press('Enter');
  const consent = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  await expect(consent).toBeVisible();
  await expect(navigationStatus(page)).toHaveCount(0);
  await expect(page).toHaveURL(learningPaths.images);
  await expect(consent.getByRole('button', { name: 'Zustimmen', exact: true })).toBeDisabled();
  await page.keyboard.press('Tab');
  expect(await consent.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  await expectAccessible(page);
}

export function feedbackArrow(link: Locator) {
  return link.locator('svg').last().locator('g').first();
}

export function arrowOffset(link: Locator) {
  return feedbackArrow(link).evaluate((arrow) => {
    const transform = getComputedStyle(arrow).transform;
    return transform === 'none' ? 0 : new DOMMatrix(transform).m41;
  });
}

export async function watchStationaryHover(link: Locator) {
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

export async function expectPageTransitions(
  page: Page,
  read: Awaited<ReturnType<typeof observeViewTransitions>>,
  ...directions: ('forward' | 'back')[]
) {
  const expected = directions.map((direction) => ({
    root: false,
    outgoingPages: 1,
    incomingPages: 1,
    back: direction === 'back',
  }));
  await expect.poll(read).toEqual(expected);
  await settleEntryAnimations(page);
  expect(await read()).toEqual(expected);
}
