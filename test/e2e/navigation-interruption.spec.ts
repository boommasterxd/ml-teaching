import { expect, test, type Page } from '@playwright/test';
import { diagnostics, settleEntryAnimations } from './browser-checks';
import { learningPaths } from '../../src/lib/learning-paths';

function holdFirstPageTransition(page: Page) {
  return page.waitForFunction((destination) => {
    const transition = document.activeViewTransition;
    if (location.pathname !== destination || !transition?.types.has('nav-forward')) return false;

    const snapshots = document.getAnimations().filter(({ effect }) => {
      const pseudo = effect instanceof KeyframeEffect ? effect.pseudoElement : '';
      return /^::view-transition-(old|new)\(page-[ab]\)$/.test(pseudo ?? '');
    });
    if (!snapshots.length) return false;
    for (const snapshot of snapshots) snapshot.pause();
    return transition;
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
      await page.goto('/');
      await settleEntryAnimations(page);
      const start = page.getByRole('main').getByRole('link', { name: 'Lernlabor', exact: true });
      const home = page.getByRole('banner').getByRole('link', { name: 'ML Teaching – Startseite' });
      // Hold only the first route's snapshots so the regression has no timing threshold.
      const [previous] = await Promise.all([
        holdFirstPageTransition(page),
        touch ? start.tap() : start.press('Enter'),
      ]);

      try {
        await expect(page).toHaveURL(learningPaths.hub);
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
