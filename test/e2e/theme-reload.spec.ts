import { expect, test } from '@playwright/test';
import { observeViewTransitions } from './browser-checks';

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
});

test('changing the motion preference disables the theme wipe without losing the selected theme', async ({
  page,
}) => {
  const transitions = await observeViewTransitions(page);
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  await page.goto('/lernen');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const theme = page.getByRole('switch', { name: 'Dunkle Darstellung' });
  await theme.press('Space');
  await expect(theme).toBeChecked();
  await expect(theme).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await transitions()).toEqual([]);
});
