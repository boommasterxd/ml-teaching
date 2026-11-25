import { expect, test, type Page } from '@playwright/test';
import { diagnostics, settleEntryAnimations } from './browser-checks';
import { learningPaths } from '../../src/lib/learning-paths';

type TransitionWindow = Window & { heldTransition?: ViewTransition };

function holdFirstPageTransition(page: Page) {
  return page.addInitScript((destination) => {
    const state: TransitionWindow = window;
    document.startViewTransition = new Proxy(document.startViewTransition, {
      apply(target, receiver, args) {
        const transition = Reflect.apply(target, receiver, args) as ViewTransition;
        if (!transition.types.has('nav-forward')) return transition;

        // Pause the first route's snapshots as soon as the browser creates them.
        void transition.ready.then(
          () => {
            if (location.pathname !== destination || state.heldTransition) return;
            const snapshots = document.getAnimations().filter(({ effect }) => {
              const pseudo = effect instanceof KeyframeEffect ? effect.pseudoElement : '';
              return /^::view-transition-(old|new)\(page-[ab]\)$/.test(pseudo ?? '');
            });
            if (!snapshots.length) return;
            for (const snapshot of snapshots) snapshot.pause();
            state.heldTransition = transition;
          },
          () => undefined,
        );
        return transition;
      },
    });
  }, learningPaths.hub);
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
      const previous = await page.waitForFunction(
        () => (window as TransitionWindow).heldTransition,
      );

      try {
        await expect(page).toHaveURL(learningPaths.hub);
        expect(
          await previous.evaluate((transition) => document.activeViewTransition === transition),
        ).toBe(true);
        if (touch) await home.tap();
        else await home.press('Enter');
        await expect(page).toHaveURL('/');
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Deine KI lernt.');
        await settleEntryAnimations(page);
        expect(failures).toEqual([]);
      } finally {
        await previous.evaluate((transition) => {
          if (transition) transition.skipTransition();
        });
        await previous.dispose();
      }
    });
  });
}
