import { expect, test } from '@playwright/test';
import { diagnostics, expectAccessible, observeViewTransitions } from './browser-checks';
import { expectPageTransitions, navigationStatus } from './intent-navigation-checks';

test('mobile information menu keeps the activated link usable until the destination commits', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });
  const failures = diagnostics(page);
  const transitions = await observeViewTransitions(page);
  const pending = Promise.withResolvers<void>();
  let heldDestination = false;
  await page.route('**/datenschutz?*', async (route) => {
    if (route.request().headers().rsc === '1') {
      heldDestination = true;
      await pending.promise;
    }
    await route.continue();
  });

  try {
    await page.goto('/barrierefreiheit');
    const trigger = page.getByRole('button', { name: 'Informationen', exact: true });
    const menu = page.getByRole('menu', { name: 'Informationen', exact: true });
    const destination = menu.getByRole('menuitem', { name: 'Datenschutz', exact: true });
    await trigger.press('Enter');
    await destination.press('Enter');

    await expect.poll(() => heldDestination).toBe(true);
    await expect(destination.locator('[data-slot="spinner"]')).toBeVisible();
    await expect(destination).toBeFocused();
    await expect(navigationStatus(page)).toHaveCount(1);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page).toHaveURL('/barrierefreiheit');
    await expectAccessible(page);

    pending.resolve();
    await expect(page).toHaveURL('/datenschutz');
    await expect(
      page.getByRole('heading', { name: 'Datenschutzerklärung', exact: true }),
    ).toBeVisible();
    await expect(menu).toHaveCount(0);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(navigationStatus(page)).toHaveCount(0);
    await expectPageTransitions(page, transitions, 'forward');
    expect(failures).toEqual([]);
  } finally {
    pending.resolve();
    await page.unrouteAll({ behavior: 'wait' });
  }
});

test('a focused information item transfers to its visible desktop link on resize', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/barrierefreiheit');
  await page.getByRole('button', { name: 'Informationen', exact: true }).press('Enter');
  const menu = page.getByRole('menu', { name: 'Informationen', exact: true });
  const item = menu.getByRole('menuitem', { name: 'Datenschutz', exact: true });
  await item.focus();
  await expect(item).toBeFocused();

  await page.setViewportSize({ width: 1280, height: 844 });
  const navigation = page.getByRole('navigation', { name: 'Informationsseiten' });
  const link = navigation.getByRole('link', { name: 'Datenschutz', exact: true });
  await expect(menu).toHaveCount(0);
  await expect(link).toBeFocused();
});
