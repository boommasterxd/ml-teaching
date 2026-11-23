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

async function collectExamples(page: Page) {
  const names = page.getByRole('textbox', { name: /^Name für Klasse / });
  const uploads = page.locator('input[type="file"]');
  for (const [index, { name, color }] of classNames.entries()) {
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

async function expectUnclippedConfidenceLabels(page: Page) {
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
  await routeSyntheticModel(page, baseURL!);
  await page.goto(learningPaths.imagePractice);
  await observeWorkspaceCamera(page, 'class-colors');
  await grantModelConsent(page);
  await page.getByRole('button', { name: 'Erlauben', exact: true }).click();
  await collectExamples(page);
  await page.getByRole('button', { name: 'Weiter zum Training', exact: true }).first().click();
  await page.getByRole('button', { name: 'Modell trainieren', exact: true }).click();
  await page.getByRole('button', { name: 'Weiter zur Vorhersage', exact: true }).click();
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
