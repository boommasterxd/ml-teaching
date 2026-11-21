import { expect, test, type Page } from '@playwright/test';
import { diagnostics, expectAccessible } from './browser-checks';

const stylesheet = 'link[rel="stylesheet"][href="/error-recovery-transition.css"]';

async function observeDocumentTransitions(page: Page) {
  await page.addInitScript(() => {
    window.addEventListener('pagereveal', ({ viewTransition }) => {
      const root = document.documentElement;
      root.dataset.recoveryTransition = 'none';
      if (!viewTransition?.types.has('error-recovery')) return;
      root.dataset.recoveryTransition = 'pending';
      void viewTransition.ready
        .then(async () => {
          const layers = document.getAnimations().flatMap(({ effect }) => {
            if (!(effect instanceof KeyframeEffect) || !effect.pseudoElement) return [];
            return [effect.pseudoElement];
          });
          root.dataset.recoverySnapshots = layers
            .filter((layer) => layer.includes('(error-recovery-content)'))
            .sort()
            .join(' ');
          await viewTransition.finished;
          root.dataset.recoveryTransition = 'finished';
        })
        .catch(() => {
          root.dataset.recoveryTransition = 'skipped';
        });
    });
  });
}

async function recoverFrom500(page: Page) {
  const response = await page.goto('/500');
  expect(response?.status()).toBe(500);
  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-recovery-transition', 'none');
  await expect(page.locator(`head ${stylesheet}`)).toHaveAttribute(
    'media',
    '(prefers-reduced-motion: no-preference)',
  );
  const action = page.getByRole('main').getByRole('link', { name: 'Zur Startseite' });
  await action.focus();
  await expect(action).toBeFocused();
  const homepage = page.waitForResponse(
    (response) =>
      response.request().isNavigationRequest() && new URL(response.url()).pathname === '/',
  );
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const html = await (await homepage).text();
  const head = html.match(/<head>[\s\S]*?<\/head>/)?.[0];
  expect(head).toMatch(
    /<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="\/error-recovery-transition\.css")/,
  );
  await expect(page.locator(`head ${stylesheet}`)).toHaveAttribute(
    'media',
    '(prefers-reduced-motion: no-preference)',
  );
}

test('the HTTP 500 recovery animates only the document crossing to the homepage', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const failures = diagnostics(page);
  await observeDocumentTransitions(page);
  await recoverFrom500(page);

  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-recovery-transition', 'finished');
  await expect(root).toHaveAttribute(
    'data-recovery-snapshots',
    '::view-transition-new(error-recovery-content) ::view-transition-old(error-recovery-content)',
  );
  await expectAccessible(page);

  await page.reload();
  await expect(root).toHaveAttribute('data-recovery-transition', 'none');
  await page.getByRole('main').getByRole('link', { name: 'Lernlabor', exact: true }).click();
  await expect(page).toHaveURL('/lernen');
  await expect(page.locator(stylesheet)).toHaveCount(0);
  expect(
    failures.filter((message) => !/^Failed to load resource: .*status of 500\b/.test(message)),
  ).toEqual([]);
});

test('the recovery link also works with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await observeDocumentTransitions(page);
  await recoverFrom500(page);
  await expect(page.locator('html')).toHaveAttribute('data-recovery-transition', 'none');
});
