import { expect, test, type Page } from '@playwright/test';
import { diagnostics, settleEntryAnimations } from './browser-checks';
import { learningPaths } from '../../src/lib/learning-paths';

type HeldTransition = {
  transition: ViewTransition;
  release: () => void;
};
type TransitionWindow = Window & { heldTransition?: HeldTransition };
type ExtendableTransition = ViewTransition & { waitUntil(promise: Promise<void>): void };

function holdFirstPageTransition(page: Page) {
  return page.addInitScript(() => {
    const state: TransitionWindow = window;
    document.startViewTransition = new Proxy(document.startViewTransition, {
      apply(target, receiver, args) {
        const transition = Reflect.apply(target, receiver, args) as ExtendableTransition;
        if (!transition.types.has('nav-forward') || state.heldTransition) return transition;

        // Keep the native transition pending independently of the CSS animation timing.
        const hold = Promise.withResolvers<void>();
        transition.waitUntil(hold.promise);
        state.heldTransition = { transition, release: hold.resolve };
        return transition;
      },
    });
  });
}

for (const touch of [false, true]) {
  test.describe(touch ? 'touch navigation' : 'keyboard navigation', () => {
    test.use({
      hasTouch: touch,
      reducedMotion: 'no-preference',
      viewport: touch ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    });

    test('a new activation proceeds during an unfinished page transition', async ({ page }) => {
      const failures = diagnostics(page);
      await holdFirstPageTransition(page);
      await page.goto('/');
      await expect(page.locator('[data-home-header-surface="top"]')).toBeAttached();
      await settleEntryAnimations(page);
      const start = page.getByRole('main').getByRole('link', { name: 'Lernlabor', exact: true });
      const home = page.getByRole('banner').getByRole('link', { name: 'ML Teaching – Startseite' });
      if (touch) await start.tap();
      else await start.press('Enter');
      await expect(page).toHaveURL(learningPaths.hub);
      const previous = await page.waitForFunction(
        () => (window as TransitionWindow).heldTransition!,
      );

      try {
        expect(
          await previous.evaluate(async ({ transition }) => {
            await transition.ready;
            return document.activeViewTransition === transition;
          }),
        ).toBe(true);
        if (touch) await home.tap();
        else await home.press('Enter');
        await expect(page).toHaveURL('/');
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Deine KI lernt.');
        await settleEntryAnimations(page);
        expect(failures).toEqual([]);
      } finally {
        await previous.evaluate(({ transition, release }) => {
          release();
          transition.skipTransition();
        });
        await previous.dispose();
      }
    });
  });
}
