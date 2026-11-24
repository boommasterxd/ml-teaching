import { expect, type Locator, type Page } from '@playwright/test';
import { settleEntryAnimations, type observeViewTransitions } from './browser-checks';

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
