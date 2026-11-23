import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';
import { learningPaths } from '../../src/lib/learning-paths';
import { routeSyntheticModel } from './synthetic-model';
import { expectEmptyTrainingAfterConsent, grantModelConsent } from './training-keyboard';

test.use({
  channel: 'chromium',
  launchOptions: {
    args: ['--enable-unsafe-swiftshader'],
    ignoreDefaultArgs: ['--disable-back-forward-cache'],
  },
});

async function observeTrainingDocument(page: Page) {
  await page.evaluate(() => {
    const root = document.documentElement;
    const devices = navigator.mediaDevices;
    const getUserMedia = devices.getUserMedia.bind(devices);
    root.dataset.cameraRequests = '0';
    devices.getUserMedia = (constraints) => {
      root.dataset.cameraRequests = String(Number(root.dataset.cameraRequests) + 1);
      return getUserMedia(constraints);
    };
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) root.dataset.restoredTrainingDocument = 'true';
    });
  });
}

async function restoreTrainingDocument(page: Page) {
  const session = await page.context().newCDPSession(page);
  const notRestored: string[] = [];
  try {
    await session.send('Page.enable');
    session.on('Page.backForwardCacheNotUsed', ({ notRestoredExplanations }) => {
      notRestored.push(...notRestoredExplanations.map(({ reason }) => reason));
    });
    const { currentIndex, entries } = await session.send('Page.getNavigationHistory');
    const previous = entries[currentIndex - 1];
    expect(new URL(previous.url).pathname).toBe(learningPaths.imagePractice);

    // A cached document does not emit the load event that Playwright navigation waits for.
    await session.send('Page.navigateToHistoryEntry', { entryId: previous.id });
    await expect
      .poll(async () => {
        const { result } = await session.send('Runtime.evaluate', {
          expression: 'document.documentElement.dataset.restoredTrainingDocument',
          returnByValue: true,
        });
        return { restored: result.value, notRestored };
      })
      .toEqual({ restored: 'true', notRestored: [] });
  } finally {
    await session.detach();
  }
}

test('restoring a cached training document requires fresh consent and clears its images', async ({
  page,
  baseURL,
}) => {
  const network = await routeSyntheticModel(page, baseURL!);
  await page.goto(learningPaths.imagePractice);
  await observeTrainingDocument(page);
  await grantModelConsent(page, true);
  await page.getByRole('button', { name: 'Ohne Kamera fortfahren' }).click();

  const buffer = await sharp({
    create: { width: 16, height: 16, channels: 3, background: '#ff0000' },
  })
    .png()
    .toBuffer();
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'synthetic.png',
    mimeType: 'image/png',
    buffer,
  });
  await expect(page.getByText('1 / 10 Bilder', { exact: true })).toBeVisible();
  expect(network.modelRequests).toEqual(['graph', 'weights']);

  await page.goto(learningPaths.images);
  await restoreTrainingDocument(page);

  const consent = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  await expect(consent).toBeVisible();
  await expect(consent.getByRole('button', { name: 'Zustimmen', exact: true })).toBeDisabled();
  for (const checkbox of await consent.getByRole('checkbox').all()) {
    await expect(checkbox).not.toBeChecked();
  }
  await expect(page.locator('html')).toHaveAttribute('data-camera-requests', '0');
  expect(network.modelRequests).toEqual(['graph', 'weights']);
  await expectEmptyTrainingAfterConsent(page);
  await expect(page.locator('html')).toHaveAttribute('data-camera-requests', '0');
  expect(network.unexpectedRequests).toEqual([]);
});
