import { expect, test, type Locator } from '@playwright/test';
import sharp from 'sharp';
import { ML } from '../../src/constants';
import { learningPaths } from '../../src/lib/learning-paths';
import { diagnostics, expectAccessible } from './browser-checks';
import { routeSyntheticModel } from './synthetic-model';
import { grantModelConsent } from './training-keyboard';

const limit = ML.MAX_IMAGES_PER_CLASS;

async function expectWindowed(gallery: Locator) {
  await expect
    .poll(() => gallery.getByRole('button', { name: /^Bild \d+ (auswählen|vergrößern)$/ }).count())
    .toBeLessThan(limit / 2);
}

test('a full training gallery keeps keyboard focus and selection across virtual windows', async ({
  page,
  baseURL,
}) => {
  const failures = diagnostics(page);
  const network = await routeSyntheticModel(page, baseURL!);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(learningPaths.imagePractice);
  await grantModelConsent(page);
  await page.getByRole('button', { name: 'Ohne Kamera fortfahren' }).click();

  const buffer = await sharp({
    create: { width: 16, height: 16, channels: 3, background: '#ff0000' },
  })
    .png()
    .toBuffer();
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(
      Array.from({ length: limit }, (_, index) => ({
        name: `synthetic-${index}.png`,
        mimeType: 'image/png',
        buffer,
      })),
    );
  await expect(page.getByText(`${limit} Bilder · Limit erreicht`, { exact: true })).toBeVisible();
  const gallery = page.getByRole('region', { name: /Trainingsbilder von Klasse 1:/ });
  const selection = page.getByRole('button', { name: 'Mehrere markieren', exact: true });
  await selection.press('Enter');
  const cancel = page.getByRole('button', { name: 'Auswahl abbrechen', exact: true });
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(gallery).toBeFocused();
  await page.keyboard.press('Tab');
  const first = gallery.getByRole('button', { name: 'Bild 1 auswählen', exact: true });
  await expect(first).toBeFocused();
  await page.keyboard.press('Space');
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expectWindowed(gallery);

  await gallery.press('End');
  const penultimate = gallery.getByRole('button', {
    name: `Bild ${limit - 1} auswählen`,
    exact: true,
  });
  const last = gallery.getByRole('button', { name: `Bild ${limit} auswählen`, exact: true });
  await expect(last).toBeInViewport();
  await expect(first).toHaveCount(0);
  await penultimate.focus();
  await page.keyboard.press('Tab');
  await expect(last).toBeFocused();
  await page.keyboard.press('Space');
  await expect(last).toHaveAttribute('aria-pressed', 'true');

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(last).toBeInViewport();
  await expect(last).toBeFocused();
  await expect(last).toHaveAttribute('aria-pressed', 'true');
  await expectWindowed(gallery);
  await gallery.press('Home');
  await expect(first).toBeInViewport();
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  const remove = page.getByRole('button', { name: '2 ausgewählte Bilder löschen' });
  await expectAccessible(page);
  await remove.press('Enter');
  await expect(page.getByText(`${limit - 2} Bilder`, { exact: true })).toBeVisible();
  await expect(selection).toBeFocused();
  const thumbnail = gallery.getByRole('button', { name: 'Bild 1 vergrößern', exact: true });
  await thumbnail.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Bild 1 aus Klasse 1' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(thumbnail).toBeFocused();
  expect(network.modelRequests).toEqual(['graph', 'weights']);
  expect(network.unexpectedRequests()).toBe(0);
  expect(failures).toEqual([]);
});
