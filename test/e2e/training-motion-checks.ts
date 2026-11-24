import { expect, type Locator, type Page } from '@playwright/test';
import { settleEntryAnimations } from './browser-checks';

interface GlideSample {
  movingPastEdge: boolean;
  fading: boolean;
  clipped: boolean;
  scrolls: boolean;
}

function observeTrainingGlide(page: Page, direction: 'left' | 'right') {
  return page.locator('[data-training-panel]').evaluateHandle((panel, direction) => {
    const { left, right } = panel.getBoundingClientRect();
    const name = `training-panel-${panel.getAttribute('data-training-panel')}`;
    const pseudo = `::view-transition-old(${name})`;
    const start = document.startViewTransition;
    const capture: { sample?: Promise<GlideSample> } = {};
    const stop = () => {
      document.startViewTransition = start;
    };
    document.startViewTransition = new Proxy(start, {
      apply(target, receiver, args) {
        const transition = Reflect.apply(target, receiver, args) as ViewTransition;
        if (!['training-forward', 'training-back'].some((type) => transition.types.has(type)))
          return transition;
        stop();
        capture.sample = transition.ready.then(() => {
          const root = document.documentElement;
          const animation = document
            .getAnimations()
            .find(
              ({ effect }) => effect instanceof KeyframeEffect && effect.pseudoElement === pseudo,
            );
          if (!animation?.effect) throw new Error(`Missing animated snapshot: ${pseudo}`);
          // Sample the real animation before it ends, independent of runner frame cadence.
          animation.currentTime = Number(animation.effect.getComputedTiming().duration) * 0.98;
          const snapshot = getComputedStyle(root, pseudo);
          const pair = getComputedStyle(root, `::view-transition-image-pair(${name})`);
          const opacity = Number(snapshot.opacity);
          const offset = new DOMMatrixReadOnly(snapshot.transform).m41;
          return {
            movingPastEdge:
              direction === 'left' ? left + offset <= 0 : right + offset >= root.clientWidth,
            fading: opacity > 0 && opacity < 1,
            clipped: pair.overflowX !== 'visible',
            scrolls: root.scrollWidth !== root.clientWidth,
          };
        });
        void capture.sample.catch(() => {});
        return transition;
      },
    });
    return { capture, stop };
  }, direction);
}

export async function expectTrainingGlide(trigger: Locator, direction: 'left' | 'right') {
  const page = trigger.page();
  const probe = await observeTrainingGlide(page, direction);
  try {
    await trigger.press('Enter');
    await expect.poll(() => probe.evaluate(({ capture }) => Boolean(capture.sample))).toBe(true);
    expect(await probe.evaluate(({ capture }) => capture.sample)).toEqual({
      movingPastEdge: true,
      fading: true,
      clipped: false,
      scrolls: false,
    });
  } finally {
    await probe.evaluate(({ stop }) => stop());
    await probe.dispose();
  }
  await settleEntryAnimations(page);
}
