import { expect, test, type Locator, type Page } from '@playwright/test';
import { diagnostics, expectAccessible } from './browser-checks';
import { learningPaths } from '../../src/lib/learning-paths';

async function holdApplicationScripts(page: Page) {
  let held = 0;
  let delivered = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/_next/static/**/*.js', async (route) => {
    held++;
    await pending;
    delivered++;
    await route.continue();
  });
  return {
    release,
    async expectHeld() {
      await expect.poll(() => held).toBeGreaterThan(0);
      expect(delivered).toBe(0);
    },
  };
}

async function expectReadable(content: Locator) {
  await content.scrollIntoViewIfNeeded();
  await expect(content).toBeVisible();
  expect(
    await content.evaluate((element) => {
      for (let node: Element | null = element; node; node = node.parentElement) {
        if (Number(getComputedStyle(node).opacity) === 0) return false;
      }
      return element.getClientRects().length > 0;
    }),
  ).toBe(true);
}

const publicRoutes = [
  '/',
  learningPaths.hub,
  learningPaths.images,
  learningPaths.qLearning,
  '/impressum',
  '/datenschutz',
  '/barrierefreiheit',
];

for (const path of publicRoutes) {
  test(`initial public content is readable before hydration at ${path}`, async ({ page }) => {
    const failures = diagnostics(page);
    const scripts = await holdApplicationScripts(page);
    try {
      const response = await page.goto(path, { waitUntil: 'commit' });
      expect(response?.status()).toBe(200);
      await response?.finished();
      await scripts.expectHeld();
      await expectReadable(page.getByRole('navigation', { name: 'Hauptnavigation' }));
      const main = page.getByRole('main');
      await expectReadable(main.getByRole('heading', { level: 1 }));
      if (path === learningPaths.qLearning) {
        await expect(main).toHaveText('Coming Soon');
        await expect(main.getByRole('heading', { level: 1 })).toHaveText('Coming Soon');
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      } else {
        await expectReadable(main.getByRole('heading', { level: 2 }).first());
        await expectReadable(main.locator('p:not(.sr-only)').first());
        await expectReadable(main.getByRole('link').first());
      }
      await scripts.expectHeld();
      scripts.release();
      await page.waitForLoadState('load');
      await expect(main.getByRole('heading', { level: 1 })).toBeVisible();
      const appearance = page.getByRole('switch', { name: 'Dunkle Darstellung' });
      const checked = await appearance.isChecked();
      await appearance.focus();
      await page.keyboard.press('Space');
      await expect(appearance).toBeChecked({ checked: !checked });
      expect(failures).toEqual([]);
    } finally {
      scripts.release();
    }
  });
}

for (const [path, systemTheme] of [
  ['/', 'dark'],
  ['/500', 'light'],
] as const) {
  test(`the theme switch starts in its dark position before hydration at ${path}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: systemTheme, reducedMotion: 'no-preference' });
    if (systemTheme === 'light') {
      await page.addInitScript(() => localStorage.setItem('ml-teaching-theme', 'dark'));
    }
    const scripts = await holdApplicationScripts(page);
    try {
      const response = await page.goto(path, { waitUntil: 'commit' });
      expect(response?.status()).toBe(path === '/500' ? 500 : 200);
      await scripts.expectHeld();
      await expect(page.locator('html')).toHaveClass(/\bdark\b/);

      const theme = page.getByRole('switch', { name: 'Dunkle Darstellung' });
      const thumbOffset = () =>
        theme.evaluate((track) => {
          const trackBox = track.getBoundingClientRect();
          const thumb = track.querySelector('[data-slot="switch-thumb"]')!.getBoundingClientRect();
          return thumb.x + thumb.width / 2 - (trackBox.x + trackBox.width / 2);
        });
      await expect.poll(thumbOffset).toBeGreaterThan(0);
      const initialOffset = await thumbOffset();
      scripts.release();
      await expect(theme).toBeChecked();
      expect(await thumbOffset()).toBeCloseTo(initialOffset);
    } finally {
      scripts.release();
    }
  });
}

test('the focused header trigger remains keyboard-operable across hydration', async ({ page }) => {
  const scripts = await holdApplicationScripts(page);
  try {
    await page.goto('/', { waitUntil: 'commit' });
    const trigger = page.getByRole('button', { name: 'Lernlabor', exact: true });
    await scripts.expectHeld();
    await trigger.focus();
    await expect(trigger).toBeFocused();
    scripts.release();
    await page.waitForLoadState('load');
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  } finally {
    scripts.release();
  }
});

test('the static error header retains its triggers across hydration and a viewport change', async ({
  page,
}) => {
  await page.setViewportSize({ width: 412, height: 823 });
  const scripts = await holdApplicationScripts(page);
  try {
    const response = await page.goto('/500', { waitUntil: 'commit' });
    expect(response?.status()).toBe(500);
    await scripts.expectHeld();
    const mobile = page.getByRole('button', { name: 'Menü', exact: true });
    const desktop = page.getByRole('button', {
      name: 'Lernlabor',
      exact: true,
      includeHidden: true,
    });
    await expect(mobile).toBeVisible();
    const mobileBefore = await mobile.elementHandle();
    const desktopBefore = await desktop.elementHandle();
    await mobile.focus();
    scripts.release();
    await page.waitForLoadState('load');
    await expect(mobile).toBeFocused();
    await mobile.press('Enter');
    const overview = page.getByRole('link', { name: 'Lernlabor-Übersicht', exact: true });
    await expect(overview).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(mobile).toHaveAttribute('aria-expanded', 'false');

    await page.setViewportSize({ width: 1280, height: 823 });
    await expect(desktop).toBeVisible();
    expect(await desktop.evaluate((node, first) => node === first, desktopBefore)).toBe(true);
    expect(await mobileBefore.evaluate((node) => node.isConnected)).toBe(true);
    await desktop.press('Enter');
    await expect(overview).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(desktop).toBeFocused();
  } finally {
    scripts.release();
  }
});

for (const [width, colorScheme] of [
  [390, 'dark'],
  [1280, 'light'],
] as const) {
  test(`complete initial consent survives hydration at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme });
    const failures = diagnostics(page);
    const external: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== 'http://127.0.0.1:3100') external.push(request.url());
    });
    const scripts = await holdApplicationScripts(page);
    try {
      const response = await page.goto(learningPaths.imagePractice, { waitUntil: 'commit' });
      expect(response?.status()).toBe(200);
      await response?.finished();
      await scripts.expectHeld();
      const dialog = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
      await expectReadable(dialog.getByRole('heading'));
      const local = dialog.locator('label[for="privacy-consent"]');
      const model = dialog.locator('label[for="model-consent"]');
      await expectReadable(local);
      await expect(local).toContainText(/Bilder[\s\S]*Kamerabilder[\s\S]*Merkmale[\s\S]*lokal/);
      await expect(local.getByRole('link')).toHaveAttribute('href', '/datenschutz');
      await expectReadable(model);
      await expect(model).toContainText(
        /KI-Modell[\s\S]*Google über Kaggle[\s\S]*Google und Kaggle meine IP-Adresse/,
      );
      await expect(model.getByRole('link')).toHaveAttribute('href', '/datenschutz');
      await expectReadable(dialog.getByRole('note'));
      const choices = dialog.getByRole('checkbox');
      await expect(choices).toHaveCount(2);
      for (const choice of await choices.all()) {
        await expectReadable(choice);
        await expect(choice).not.toBeChecked();
      }
      const confirm = dialog.getByRole('button', { name: 'Zustimmen', exact: true });
      const cancel = dialog.getByRole('button', { name: 'Abbrechen', exact: true });
      await expectReadable(confirm);
      await expect(confirm).toBeDisabled();
      await expectReadable(cancel);
      await expect(cancel).toBeEnabled();
      const initialDialog = await dialog.elementHandle();
      const initialChoices = await choices.elementHandles();
      await scripts.expectHeld();
      scripts.release();
      await page.waitForLoadState('load');
      expect(await dialog.evaluate((node, original) => node === original, initialDialog)).toBe(
        true,
      );
      await expect
        .poll(() => dialog.evaluate((node) => node.contains(document.activeElement)))
        .toBe(true);
      for (const [index, choice] of (await choices.all()).entries()) {
        expect(
          await choice.evaluate((node, original) => node === original, initialChoices[index]),
        ).toBe(true);
        await choice.focus();
        await page.keyboard.press('Space');
        await expect(choice).toBeChecked();
        if (index === 0) await expect(confirm).toBeDisabled();
        else await expect(confirm).toBeEnabled();
      }
      await expectAccessible(page);
      await cancel.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`${learningPaths.images}$`));
      expect(external).toEqual([]);
      expect(failures).toEqual([]);
    } finally {
      scripts.release();
    }
  });
}
