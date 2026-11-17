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
      // These routes share the shell; their first heading, explanation and action
      // exercise the distinct page render paths without walking optional content.
      await expectReadable(main.getByRole('heading', { level: 2 }).first());
      await expectReadable(main.locator('p:not(.sr-only)').first());
      await expectReadable(main.getByRole('link').first());
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
        /MobileNet[\s\S]*Google[\s\S]*IP-Adresse[\s\S]*kein Upload/,
      );
      await expect(model.getByRole('link')).toHaveAttribute(
        'href',
        'https://policies.google.com/privacy',
      );
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
