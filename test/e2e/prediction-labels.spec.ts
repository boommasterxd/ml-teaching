import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';
import { ML } from '../../src/constants';
import { learningPaths } from '../../src/lib/learning-paths';
import { expectAccessible } from './browser-checks';
import { routeSyntheticModel } from './synthetic-model';
import { observeWorkspaceCamera } from './training-camera';
import { grantModelConsent } from './training-keyboard';

const classNames = [
  { name: 'Gemeinsamer sehr langer Klassenname: Variante A', color: '#ff0000' },
  { name: 'Gemeinsamer sehr langer Klassenname: Variante B', color: '#0000ff' },
] as const;

const classColors = ['#ff0000', '#0000ff', '#00ff00', '#ffff00'];
const filterClasses = Array.from({ length: ML.MAX_CLASSES }, (_, index) => ({
  name: `Klasse ${index + 1}`,
  color: classColors[index % classColors.length],
}));

type ExampleClass = { name: string; color: string };

async function collectExamples(page: Page, examples: readonly ExampleClass[]) {
  const names = page.getByRole('textbox', { name: /^Name für Klasse / });
  const uploads = page.locator('input[type="file"]');
  const addClass = page.getByRole('button', { name: 'Neue Klasse hinzufügen', exact: true });
  for (const [index, { name, color }] of examples.entries()) {
    if (index >= 2) await addClass.click();
    await names.nth(index).fill(name);
    const buffer = await sharp({
      create: { width: 16, height: 16, channels: 3, background: color },
    })
      .png()
      .toBuffer();
    await uploads.nth(index).setInputFiles(
      Array.from({ length: ML.MIN_IMAGES_PER_CLASS }, (_, number) => ({
        name: `example-${number}.png`,
        mimeType: 'image/png',
        buffer,
      })),
    );
  }
}

async function openLivePrediction(page: Page, baseURL: string, examples: readonly ExampleClass[]) {
  await routeSyntheticModel(page, baseURL);
  await page.goto(learningPaths.imagePractice);
  await observeWorkspaceCamera(page, 'class-colors');
  await grantModelConsent(page);
  await page.getByRole('button', { name: 'Erlauben', exact: true }).click();
  await collectExamples(page, examples);
  await page.getByRole('button', { name: 'Weiter zum Training', exact: true }).first().click();
  await page.getByRole('button', { name: 'Modell trainieren', exact: true }).click();
  await page.getByRole('button', { name: 'Weiter zur Vorhersage', exact: true }).click();
}

async function expectUnclippedConfidenceLabels(page: Page) {
  const heading = page.getByRole('heading', { name: 'Vorhersage', exact: true });
  await heading.evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
  for (const { name } of classNames) {
    const progress = page.getByRole('progressbar', {
      name: `Konfidenz für ${name}`,
      exact: true,
    });
    const row = progress.locator('..');
    const label = row.getByText(name, { exact: true });
    await expect(label).toBeVisible();
    await expect(row.getByText(/^\d{1,3}%$/)).toBeVisible();
    await expect
      .poll(() =>
        label.evaluate((node) => {
          const bounds = node.getBoundingClientRect();
          const rowBounds = node.parentElement!.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(node);
          const lines = [...range.getClientRects()];
          return (
            lines.length > 0 &&
            bounds.right <= rowBounds.right &&
            lines.every(
              (line) =>
                line.left >= bounds.left - 1 &&
                line.right <= bounds.right + 1 &&
                line.top >= bounds.top - 1 &&
                line.bottom <= bounds.bottom + 1,
            )
          );
        }),
      )
      .toBe(true);
  }
}

test('live confidence values remain distinguishable for long class names', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await openLivePrediction(page, baseURL!, classNames);
  await expectUnclippedConfidenceLabels(page);
  await expectAccessible(page);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await expectUnclippedConfidenceLabels(page);
  await page.evaluate(() => {
    document.documentElement.style.removeProperty('font-size');
  });

  await page.setViewportSize({ width: 1280, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  await expectUnclippedConfidenceLabels(page);
  await expectAccessible(page);
});

test.describe('live prediction class filters', () => {
  test.use({ hasTouch: true });

  test('filter all 15 classes with keyboard and touch', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 1280, height: 844 });
    await page.emulateMedia({ colorScheme: 'dark' });
    const styleViolations: string[] = [];
    page.on('console', (message) => {
      const text = message.text();
      if (message.type() === 'error' && /Content Security Policy.*style-src/i.test(text)) {
        styleViolations.push(text);
      }
    });
    await openLivePrediction(page, baseURL!, filterClasses);

    const chart = page.getByRole('figure', { name: /Merkmalsraum/ });
    const trigger = chart.getByRole('button', { name: /^Klassenfilter:/ });
    const filters = page.getByRole('menu', { name: 'Klassenfilter' });
    const all = filters.getByRole('menuitemcheckbox', { name: 'Alle Klassen', exact: true });
    const first = filters.getByRole('menuitemcheckbox', { name: 'Klasse 1', exact: true });
    const last = filters.getByRole('menuitemcheckbox', { name: 'Klasse 15', exact: true });
    const camera = chart.locator('[data-slot="prediction-live-point"]');
    const markers = chart.locator('[data-slot="prediction-training-points"] [data-class-marker]');
    await chart.scrollIntoViewIfNeeded();
    await expect(markers).toHaveCount(ML.MAX_CLASSES);
    await expect(camera).toBeVisible();
    await trigger.press('ArrowDown');
    await expect(all).toBeFocused();
    await expect(filters.getByRole('menuitemcheckbox')).toHaveCount(ML.MAX_CLASSES + 1);
    await page.keyboard.press('Space');
    await expect(markers).toHaveCount(0);
    await page.keyboard.press('ArrowDown');
    await expect(first).toBeFocused();
    await page.keyboard.press('Space');
    await expect(first).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('End');
    await expect(last).toBeFocused();
    await expect(last).toBeInViewport();
    await page.keyboard.press('Space');
    await expect(last).toHaveAttribute('aria-checked', 'true');
    await expect(markers).toHaveCount(2);
    await expect(markers.first()).toHaveAttribute('data-class-marker', 'circle');
    await expect(markers.last()).toHaveAttribute('data-class-marker', 'hourglass');
    await expect(last.locator('[data-class-marker]')).toHaveAttribute(
      'data-class-marker',
      'hourglass',
    );
    await expect(all).toHaveAttribute('aria-checked', 'mixed');
    await expect(camera).toBeVisible();
    await expectAccessible(page);
    await page.keyboard.press('Escape');
    await expect(filters).toBeHidden();
    await expect(trigger).toBeFocused();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await trigger.tap();
    await last.tap();
    await expect(last).toHaveAttribute('aria-checked', 'false');
    await expect(markers).toHaveCount(1);
    await expect(markers.first()).toHaveAttribute('data-class-marker', 'circle');
    await all.tap();
    await expect(all).toHaveAttribute('aria-checked', 'true');
    await expect(markers).toHaveCount(ML.MAX_CLASSES);
    await expect(camera).toBeVisible();
    await expectAccessible(page);
    expect(styleViolations).toEqual([]);
  });
});
