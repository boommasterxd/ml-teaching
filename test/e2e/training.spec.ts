import { expect, test, type Locator, type Page } from '@playwright/test';
import sharp from 'sharp';
import { learningPaths } from '../../src/lib/learning-paths';
import { routeSyntheticModel } from './synthetic-model';

test.use({ reducedMotion: 'reduce' });

const consentName = 'Einwilligung zur Datenverarbeitung';
const cameraName = 'Berechtigung zur Kameranutzung';
const withdrawalName = 'Einwilligung widerrufen';

async function expectFreshConsent(page: Page) {
  const consent = page.getByRole('dialog', { name: consentName });
  await expect(consent).toBeVisible();
  await expect(consent.getByRole('checkbox', { checked: true })).toHaveCount(0);
  await expect(consent.getByRole('button', { name: 'Zustimmen', exact: true })).toBeDisabled();
  return consent;
}

async function prepareModelConsent(page: Page, remember = false) {
  const dialog = page.getByRole('dialog', { name: consentName });
  const required = dialog.getByRole('checkbox', { name: /^Ich stimme zu/ });
  const submit = dialog.getByRole('button', { name: 'Zustimmen', exact: true });
  await expect(required).toHaveCount(2);
  await required.first().press('Space');
  await expect(submit).toBeDisabled();
  await required.last().press('Space');
  if (remember) {
    await dialog
      .getByRole('checkbox', { name: 'Für 30 Minuten in diesem Tab merken' })
      .press('Space');
  }
  return submit;
}

async function declineCamera(page: Page) {
  await page
    .getByRole('dialog', { name: cameraName })
    .getByRole('button', { name: 'Ohne Kamera fortfahren' })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

async function importImages(page: Page, index: number, background: string, count: number) {
  const buffer = await sharp({ create: { width: 224, height: 224, channels: 3, background } })
    .png()
    .toBuffer();
  await page
    .locator('input[type="file"]')
    .nth(index)
    .setInputFiles(
      Array.from({ length: count }, (_, image) => ({
        name: `synthetic-${image}.png`,
        mimeType: 'image/png',
        buffer,
      })),
    );
}

type CameraProbeWindow = Window & { trainingTestTracks?: MediaStreamTrack[] };

async function installCameraProbe(page: Page) {
  await page.addInitScript(() => {
    const tracks: MediaStreamTrack[] = [];
    (window as CameraProbeWindow).trainingTestTracks = tracks;
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 224;
      const pixels = canvas.getContext('2d');
      if (!pixels) throw new Error('Cannot create a synthetic camera frame.');
      const stream = canvas.captureStream();
      const video = constraints?.video;
      pixels.fillStyle =
        typeof video === 'object' && video.facingMode === 'environment' ? '#0000ff' : '#ff0000';
      pixels.fillRect(0, 0, canvas.width, canvas.height);
      tracks.push(...stream.getVideoTracks());
      return stream;
    };
  });
}

function cameraTrackStates(page: Page) {
  return page.evaluate(() => {
    const tracks = (window as CameraProbeWindow).trainingTestTracks;
    if (!tracks) throw new Error('The camera probe did not start.');
    return tracks.map((track) => track.readyState);
  });
}

async function expectNoStoredTrainingData(page: Page) {
  expect(await page.context().cookies()).toEqual([]);
  expect(
    await page.evaluate(async () => ({
      local: localStorage.length,
      session: sessionStorage.length,
      databases: (await indexedDB.databases()).length,
      caches: (await caches.keys()).length,
    })),
  ).toEqual({ local: 0, session: 0, databases: 0, caches: 0 });
}

function trainingSteps(page: Page) {
  return page.getByRole('navigation', { name: 'Trainingsablauf' });
}

async function expectEmptyTraining(page: Page) {
  await (await prepareModelConsent(page)).click();
  await declineCamera(page);
  await expect(page.getByText('0 / 10 Bilder', { exact: true })).toHaveCount(2);
  await expect(
    trainingSteps(page).getByRole('button', { name: 'Training', exact: true }),
  ).toBeDisabled();
  await expect(
    trainingSteps(page).getByRole('button', { name: 'Vorhersage', exact: true }),
  ).toBeDisabled();
}

async function withdrawFromTraining(page: Page) {
  await page
    .getByRole('contentinfo')
    .getByRole('button', { name: 'Einstellungen zum Bildtraining', exact: true })
    .click();
  await page
    .getByRole('alertdialog', { name: 'Einstellungen zum Bildtraining' })
    .getByRole('button', { name: withdrawalName, exact: true })
    .click();
  const confirmation = page.getByRole('dialog', { name: withdrawalName, exact: true });
  await expect(confirmation).toBeVisible();
  return confirmation;
}

test('the full static consent remains visible and keeps its controls through hydration', async ({
  page,
  baseURL,
}) => {
  const network = await routeSyntheticModel(page, baseURL!);
  const scripts = Promise.withResolvers<void>();
  let heldScripts = 0;
  await page.route(/\/_next\/static\/chunks\/[^?]+\.js(?:\?|$)/, async (route) => {
    heldScripts++;
    await scripts.promise;
    await route.fallback();
  });
  try {
    const response = await page.goto(learningPaths.imagePractice, { waitUntil: 'commit' });
    expect(response?.status()).toBe(200);
    await response?.finished();
    await expect.poll(() => heldScripts).toBeGreaterThan(0);
    const dialog = await expectFreshConsent(page);
    const choices = dialog.getByRole('checkbox');
    const cancel = dialog.getByRole('link', { name: 'Abbrechen', exact: true });
    await expect(page.locator('dialog:modal')).toHaveCount(0);
    await expect(dialog).toHaveCSS('opacity', '1');
    await expect(page.locator('.training-workspace')).toHaveJSProperty('inert', true);
    await expect(dialog.getByText(/bleiben Bilder und daraus gewonnene Daten/)).toBeVisible();
    await expect(
      dialog.getByText(/Google und Kaggle erhalten dabei meine IP-Adresse/),
    ).toBeVisible();
    await expect(dialog.getByText(/Du kannst deine Einwilligung/)).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Datenschutzerklärung' })).toHaveAttribute(
      'href',
      '/datenschutz',
    );
    await expect(choices).toHaveCount(3);
    await expect(
      dialog.getByRole('checkbox', { name: 'Für 30 Minuten in diesem Tab merken' }),
    ).toBeVisible();
    await expect(cancel).toHaveAttribute('href', learningPaths.images);
    const original = await dialog.elementHandle();
    const originalChoices = await choices.elementHandles();

    scripts.resolve();
    await expect(dialog.and(page.locator('dialog:modal'))).toBeVisible();
    expect(await dialog.evaluate((current, initial) => current === initial, original)).toBe(true);
    for (const [index, choice] of (await choices.all()).entries()) {
      expect(
        await choice.evaluate((current, initial) => current === initial, originalChoices[index]),
      ).toBe(true);
    }
    await expect(await prepareModelConsent(page)).toBeEnabled();
    expect(network.modelRequests).toEqual([]);
    expect(network.unexpectedRequests).toEqual([]);
  } finally {
    scripts.resolve();
  }
});

test('a failed model download offers a retry and starts setup without opening the camera', async ({
  page,
  baseURL,
}) => {
  let unavailable = true;
  const network = await routeSyntheticModel(page, baseURL!, () => unavailable);
  await installCameraProbe(page);
  await page.goto(learningPaths.images);
  await page
    .getByRole('main')
    .getByRole('link', { name: 'Eigenes Bildmodell trainieren', exact: true })
    .click();
  await (await prepareModelConsent(page)).click();
  const failure = page.getByRole('dialog', { name: 'KI-Modell konnte nicht geladen werden' });
  await expect(failure).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(learningPaths.images);
  const failedRequests = network.modelRequests.length;
  expect(failedRequests).toBeGreaterThan(0);
  expect(network.modelRequests.every((file) => file === 'graph')).toBe(true);
  expect(await cameraTrackStates(page)).toEqual([]);

  unavailable = false;
  await failure.getByRole('button', { name: 'Erneut versuchen', exact: true }).click();
  await expect(page.getByRole('dialog', { name: cameraName })).toBeVisible();
  await declineCamera(page);
  await expect(page).toHaveURL(learningPaths.imagePractice);
  await expect(page.getByText('0 / 10 Bilder', { exact: true })).toHaveCount(2);
  expect(network.modelRequests.slice(failedRequests)).toEqual(['graph', 'weights']);
  expect(await cameraTrackStates(page)).toEqual([]);
  expect(network.unexpectedRequests).toEqual([]);
});

async function finishCaptureHold(
  record: Locator,
  encodedFrames: () => Promise<number>,
  finish: 'touchEnd' | 'touchCancel',
) {
  await record.tap({ trial: true });
  const bounds = await record.boundingBox();
  if (!bounds) throw new Error('The capture button is outside the viewport.');
  const before = await encodedFrames();
  const page = record.page();
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }],
    });
    try {
      await expect.poll(encodedFrames).toBeGreaterThan(before);
    } finally {
      await session.send('Input.dispatchTouchEvent', { type: finish, touchPoints: [] });
    }
  } finally {
    await session.detach();
  }
}

test.describe('touch camera capture', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('a released camera capture adds examples only to its class and a cancelled capture adds none', async ({
    page,
    baseURL,
  }) => {
    const network = await routeSyntheticModel(page, baseURL!);
    await installCameraProbe(page);
    await page.goto(learningPaths.imagePractice);
    await (await prepareModelConsent(page)).click();
    await page
      .getByRole('dialog', { name: cameraName })
      .getByRole('button', {
        name: 'Erlauben',
        exact: true,
      })
      .tap();
    const first = page.getByRole('group', { name: 'Klasse 1', exact: true });
    const second = page.getByRole('group', { name: 'Klasse 2', exact: true });
    const record = second.getByRole('button', { name: 'Aufnehmen für Klasse 2', exact: true });
    await record.scrollIntoViewIfNeeded();
    const counter = await page.evaluateHandle(() => {
      const state = { count: 0 };
      const encode = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function (type, quality) {
        const image = encode.call(this, type, quality);
        if (type === 'image/jpeg') state.count++;
        return image;
      };
      return state;
    });
    const encodedFrames = () => counter.evaluate(({ count }) => count);
    try {
      await finishCaptureHold(record, encodedFrames, 'touchCancel');
      await expect(record).toBeEnabled();
      await expect(second.getByText('0 / 10 Bilder', { exact: true })).toBeVisible();

      await finishCaptureHold(record, encodedFrames, 'touchEnd');
      await expect(
        second.getByRole('button', { name: 'Bild 1 vergrößern', exact: true }),
      ).toBeVisible();
      await expect(first.getByText('0 / 10 Bilder', { exact: true })).toBeVisible();
      expect(network.unexpectedRequests).toEqual([]);
    } finally {
      await counter.dispose();
    }
  });
});

test('consent gates the private training flow, local examples drive predictions, and withdrawal releases data', async ({
  page,
  baseURL,
}) => {
  const network = await routeSyntheticModel(page, baseURL!);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Content Security Policy')) {
      errors.push(message.text());
    }
  });

  await installCameraProbe(page);
  await page.goto(learningPaths.imagePractice);
  await expectFreshConsent(page);
  const submit = await prepareModelConsent(page);
  expect(network.modelRequests).toEqual([]);
  expect(await cameraTrackStates(page)).toEqual([]);
  await submit.click();
  const camera = page.getByRole('dialog', { name: cameraName });
  await expect(camera).toBeVisible();
  expect(network.modelRequests).toEqual(['graph', 'weights']);
  expect(await cameraTrackStates(page)).toEqual([]);
  await declineCamera(page);

  await expect(
    trainingSteps(page).getByRole('button', { name: 'Training', exact: true }),
  ).toBeDisabled();
  await importImages(page, 0, '#ff0000', 10);
  await importImages(page, 1, '#0000ff', 10);
  await expect(page.getByText('10 Bilder', { exact: true })).toHaveCount(2);
  await expectNoStoredTrainingData(page);
  const firstClass = page.getByRole('group', { name: 'Klasse 1', exact: true });
  await firstClass.getByRole('button', { name: 'Kamera aktivieren' }).click();
  await expect(camera).toBeVisible();
  expect(await cameraTrackStates(page)).toEqual([]);
  await camera.getByRole('button', { name: 'Erlauben', exact: true }).click();
  await expect(camera).toHaveCount(0);

  await page.getByRole('button', { name: 'Weiter zum Training' }).click();
  await page.getByRole('button', { name: 'Modell trainieren' }).click();
  await page.getByRole('button', { name: 'Weiter zur Vorhersage' }).click();
  const prediction = page.getByRole('region', { name: 'Vorhersage', exact: true });
  await expect(prediction.getByRole('heading', { name: 'Klasse 1', exact: true })).toBeVisible();
  await prediction.getByRole('button', { name: 'Kamera wechseln' }).click();
  await expect(prediction.getByRole('heading', { name: 'Klasse 2', exact: true })).toBeVisible();

  const steps = trainingSteps(page);
  await steps.getByRole('button', { name: 'Bilder sammeln', exact: true }).click();
  await page.getByRole('button', { name: /^Alle Bilder löschen: Klasse 1,/ }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Alle Bilder löschen' }).click();
  await expect(steps.getByRole('button', { name: 'Vorhersage', exact: true })).toBeDisabled();
  await expect(firstClass.locator('video')).toBeVisible();
  expect(await cameraTrackStates(page)).toContain('live');

  const confirmation = await withdrawFromTraining(page);
  await expect.poll(() => cameraTrackStates(page)).not.toContain('live');
  await confirmation.getByRole('button', { name: 'Training verlassen', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expectNoStoredTrainingData(page);
  await page
    .getByRole('link', { name: 'Eigenes Bildmodell trainieren', exact: true })
    .press('Enter');
  await expectFreshConsent(page);
  expect(network.unexpectedRequests).toEqual([]);
  expect(errors).toEqual([]);
});

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
    // A restored document has no load event for Playwright's navigation wait.
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

test('a genuine back-forward cache restore requires fresh consent and clears imported images', async ({
  page,
  baseURL,
}) => {
  const network = await routeSyntheticModel(page, baseURL!);
  await installCameraProbe(page);
  await page.goto(learningPaths.imagePractice);
  await page.evaluate(() => {
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) document.documentElement.dataset.restoredTrainingDocument = 'true';
    });
  });
  await (await prepareModelConsent(page, true)).click();
  await declineCamera(page);
  await importImages(page, 0, '#ff0000', 1);
  await expect(page.getByText('1 / 10 Bilder', { exact: true })).toBeVisible();

  await page.goto(learningPaths.images);
  await restoreTrainingDocument(page);
  await expectFreshConsent(page);
  expect(network.modelRequests).toEqual(['graph', 'weights']);
  expect(await cameraTrackStates(page)).toEqual([]);
  await expectNoStoredTrainingData(page);
  await expectEmptyTraining(page);
  expect(await cameraTrackStates(page)).toEqual([]);
  expect(network.unexpectedRequests).toEqual([]);
});
