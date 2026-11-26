import { expect, test, type Page } from '@playwright/test';
import { observeViewTransitions } from './browser-checks';
import { openThemeMenu } from './training-keyboard';

async function expectCanonicalFavicon(page: Page) {
  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveCount(1);
  await expect(icon).toHaveAttribute('href', '/favicon.svg');
}

test('the browser canvas follows the dark system preference during a reload with pending CSS', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  let holdStyles = false;
  let stylesRequested = false;
  let releaseStyles!: () => void;
  const pending = new Promise<void>((resolve) => {
    releaseStyles = resolve;
  });
  await page.route('**/_next/static/**/*.css', async (route) => {
    if (holdStyles) {
      stylesRequested = true;
      await pending;
    }
    await route.continue();
  });
  await page.goto('/');
  try {
    holdStyles = true;
    await page.reload({ waitUntil: 'commit' });
    await expect.poll(() => stylesRequested).toBe(true);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const probe = document.createElement('div');
          probe.style.backgroundColor = 'Canvas';
          document.documentElement.append(probe);
          const color = getComputedStyle(probe).backgroundColor;
          probe.remove();
          const channels = color.match(/\d+/g)?.map(Number);
          return (
            document.readyState === 'loading' && Boolean(channels?.every((value) => value < 128))
          );
        }),
      )
      .toBe(true);
  } finally {
    releaseStyles();
  }
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await expectCanonicalFavicon(page);
});

test('changing the motion preference disables the theme wipe without losing the selected theme', async ({
  page,
}) => {
  const transitions = await observeViewTransitions(page);
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  await page.goto('/lernen');
  await expectCanonicalFavicon(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const theme = page.getByRole('switch', { name: 'Dunkle Darstellung' });
  await theme.press('Space');
  await expect(theme).toBeChecked();
  await expect(theme).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expectCanonicalFavicon(page);
  expect(await transitions()).toEqual([]);
});

test('the appearance menu can fade out while the page theme wipe is active', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  await page.goto('/impressum');
  const menu = await openThemeMenu(page);
  await expect(menu).toHaveCSS('opacity', '1');
  const observation = await menu.evaluateHandle((popup) => {
    const recorded = Promise.withResolvers<{
      independentCapture: boolean;
      fadedDuringWipe: boolean;
      completedWipe: boolean;
    }>();
    const start = document.startViewTransition;
    document.startViewTransition = new Proxy(start, {
      apply(target, receiver, args) {
        document.startViewTransition = start;
        const transition = Reflect.apply(target, receiver, args) as ViewTransition;
        const sample = async () => {
          await transition.ready;
          // The theme toggler starts the wipe in its own ready handler.
          await Promise.resolve();
          const root = document.documentElement;
          const positioner = popup.parentElement;
          const name = positioner && getComputedStyle(positioner).viewTransitionName;
          const independentCapture = Boolean(
            name &&
            name !== 'none' &&
            Number.isFinite(
              parseFloat(getComputedStyle(root, `::view-transition-group(${name})`).width),
            ) &&
            getComputedStyle(root, `::view-transition-old(${name})`).display === 'none' &&
            getComputedStyle(root, `::view-transition-new(${name})`).opacity === '1',
          );
          const wipe = document.getAnimations().find(({ effect }) => {
            return (
              effect instanceof KeyframeEffect &&
              effect.pseudoElement === '::view-transition-new(root)'
            );
          });
          let fadedDuringWipe = false;
          while (wipe?.playState === 'running' && document.activeViewTransition === transition) {
            if (popup.hasAttribute('inert') && Number(getComputedStyle(popup).opacity) <= 0.01) {
              fadedDuringWipe = true;
              break;
            }
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          }
          await transition.finished;
          return {
            independentCapture,
            fadedDuringWipe,
            completedWipe: wipe?.playState === 'finished',
          };
        };
        void sample().then(recorded.resolve, recorded.reject);
        return transition;
      },
    });
    return { result: recorded.promise };
  });
  await menu.getByRole('menuitemradio', { name: 'Dunkel', exact: true }).press('Enter');
  expect(await observation.evaluate(({ result }) => result)).toEqual({
    independentCapture: true,
    fadedDuringWipe: true,
    completedWipe: true,
  });
  await observation.dispose();
  await expect(menu).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Darstellung einstellen', exact: true }),
  ).toBeFocused();
  await expect(page.locator('[data-theme-menu]')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('the native error document restores a remembered theme without changing the favicon URL', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/lernen');
  const appearance = await openThemeMenu(page);
  await appearance.getByRole('menuitemradio', { name: 'Dunkel', exact: true }).press('Enter');
  await expect(appearance).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  const menu = await openThemeMenu(page);
  const remember = menu.getByRole('menuitemcheckbox', { name: 'Auswahl merken' });
  await remember.press('Space');
  await expect(remember).toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem('ml-teaching-theme'))).toBe('dark');

  const response = await page.goto('/500');
  expect(response?.status()).toBe(500);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expectCanonicalFavicon(page);
});

test('the appearance menu reuses the module loaded by the navigation', async ({ page }) => {
  await page.goto('/lernen');
  await expect(page.locator('.header-menu-mobile')).toHaveCount(0);
  await page.getByRole('button', { name: 'Lernlabor', exact: true }).press('Enter');
  await expect(page.getByRole('link', { name: 'Lernlabor-Übersicht', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');

  const scripts = '**/_next/static/chunks/*.js';
  await page.route(scripts, (route) => route.abort('failed'));
  try {
    await page.getByRole('button', { name: 'Darstellung einstellen' }).press('ArrowUp');
    const menu = page.getByRole('menu', { name: 'Darstellung einstellen' });
    await expect(menu.getByRole('menuitemcheckbox', { name: 'Auswahl merken' })).toBeFocused();
  } finally {
    await page.unroute(scripts);
  }
});
