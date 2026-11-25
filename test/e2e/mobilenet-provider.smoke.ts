import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';
import { ML } from '../../src/constants';
import { learningPaths } from '../../src/lib/learning-paths';
import { modelDirectory, observeNativeModelTraffic } from './mobilenet-provider-client';
import { observeModelConsentRequests, prepareModelConsent } from './training-keyboard';

async function importSyntheticImage(page: Page) {
  const buffer = await sharp({
    create: { width: 16, height: 16, channels: 3, background: '#f00' },
  })
    .png()
    .toBuffer();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Bilder auswählen für Klasse 1', exact: true }).click();
  await (await chooser).setFiles({ name: 'synthetic.png', mimeType: 'image/png', buffer });
  await expect(
    page.getByText(`1 / ${ML.MIN_IMAGES_PER_CLASS} Bilder`, { exact: true }),
  ).toBeVisible();
}

test('the native browser loads MobileNet and extracts features from a synthetic local image', async ({
  page,
  baseURL,
}) => {
  const document = new URL(learningPaths.imagePractice, baseURL);
  expect(document.origin).toBe('http://127.0.0.1:3100');
  const consent = await observeModelConsentRequests(page, modelDirectory.href);
  const traffic = await observeNativeModelTraffic(page, document, async () => {
    const { submitted, earlyAttempts } = await consent.state();
    return submitted && earlyAttempts === 0;
  });

  try {
    await page.goto(document.href);
    const submit = await prepareModelConsent(page);
    expect(await consent.state()).toEqual({ submitted: false, earlyAttempts: 0 });
    expect(traffic.completed()).toEqual([]);
    await consent.submit(submit);

    const camera = page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
    await expect(camera).toBeVisible({ timeout: 40_000 });
    await camera.getByRole('button', { name: 'Ohne Kamera fortfahren' }).click();
    await expect(camera).toBeHidden();
    await importSyntheticImage(page);
    await expect(page.locator('video')).toHaveCount(0);
    expect(await consent.state()).toEqual({ submitted: true, earlyAttempts: 0 });
    expect(traffic.completed()).toEqual([
      'group1-shard1of4.bin',
      'group1-shard2of4.bin',
      'group1-shard3of4.bin',
      'group1-shard4of4.bin',
      'model.json',
    ]);
    expect(traffic.failure()).toBeUndefined();
  } catch (error) {
    const failure = traffic.failure();
    if (failure) throw new Error(failure);
    throw error;
  } finally {
    await traffic.close();
  }
});
