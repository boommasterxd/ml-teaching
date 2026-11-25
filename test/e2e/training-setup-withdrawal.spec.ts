import { expect, test, type Locator, type Page } from '@playwright/test';
import { learningPaths } from '../../src/lib/learning-paths';
import { expectAccessible, expectNoStoredTrainingData } from './browser-checks';
import { failSyntheticModel, routeSyntheticModel } from './synthetic-model';
import { grantModelConsent, trainingSettingsTrigger } from './training-keyboard';

const withdrawalName = 'Einwilligung widerrufen';

async function openTrainingSetup(page: Page) {
  await page.goto(learningPaths.images);
  const opener = page.getByRole('link', { name: 'Eigenes Bildmodell trainieren', exact: true });
  await opener.press('Enter');
  await grantModelConsent(page, true);
  return opener;
}

async function withdrawFromSetup(dialog: Locator) {
  const page = dialog.page();
  const action = dialog.getByRole('button', { name: withdrawalName, exact: true });
  await action.focus();
  await expect(action).toBeFocused();
  await expect(action).toBeInViewport({ ratio: 1 });
  await expectAccessible(page);
  await page.keyboard.press('Enter');

  const confirmation = page.getByRole('dialog', { name: withdrawalName, exact: true });
  await expect(confirmation).toBeVisible();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect
    .poll(() => confirmation.evaluate((dialog) => dialog.contains(document.activeElement)))
    .toBe(true);
  await expect(trainingSettingsTrigger(page)).toHaveCount(0);
  await expectNoStoredTrainingData(page);
  return confirmation;
}

test('withdraws remembered consent directly after a model load error', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ colorScheme: 'light' });
  const network = await routeSyntheticModel(page, baseURL!, failSyntheticModel);
  const opener = await openTrainingSetup(page);
  const error = page.getByRole('dialog', { name: 'KI-Modell konnte nicht geladen werden' });
  await expect(error).toBeVisible({ timeout: 20_000 });
  const attempts = network.modelRequests.length;
  expect(attempts).toBeGreaterThan(0);

  const confirmation = await withdrawFromSetup(error);
  await confirmation.getByRole('button', { name: 'Schließen', exact: true }).press('Enter');
  await expect(opener).toBeFocused();
  await expect(page).toHaveURL(learningPaths.images);
  await opener.press('Enter');

  const consent = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  await expect(consent).toBeVisible();
  await expect(consent.getByRole('checkbox', { checked: true })).toHaveCount(0);

  const imageConsent = consent.getByRole('checkbox', { name: /^Ich stimme zu, dass ML Teaching/ });
  await expect(imageConsent).toBeFocused();
  await page.keyboard.press('Space');
  await expect(imageConsent).toBeChecked();
  await page.keyboard.press('Tab');
  await expect(consent.getByRole('link', { name: 'Datenschutzerklärung' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    consent.getByRole('checkbox', { name: /^Ich stimme zu, dass mein Browser das KI-Modell lädt/ }),
  ).toBeFocused();
  await expect(consent.getByRole('button', { name: 'Zustimmen' })).toBeDisabled();
  expect(network.modelRequests).toHaveLength(attempts);
  expect(network.unexpectedRequests).toEqual([]);
});

test('withdraws during camera setup and stops a stream that arrives late', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  const network = await routeSyntheticModel(page, baseURL!);
  const opener = await openTrainingSetup(page);
  const pending = await page.evaluateHandle(() => {
    const stream = document.createElement('canvas').captureStream();
    const request = Promise.withResolvers<MediaStream>();
    const state = { started: false, stream, resolve: () => request.resolve(stream) };
    navigator.mediaDevices.getUserMedia = () => {
      state.started = true;
      return request.promise;
    };
    return state;
  });

  try {
    const camera = page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
    await camera.getByRole('button', { name: 'Erlauben', exact: true }).press('Enter');
    await expect.poll(() => pending.evaluate(({ started }) => started)).toBe(true);
    await expect(camera.getByRole('button', { name: 'Erlauben', exact: true })).toBeDisabled();
    const confirmation = await withdrawFromSetup(camera);
    await pending.evaluate(({ resolve }) => resolve());
    await expect
      .poll(() =>
        pending.evaluate(({ stream }) => stream.getTracks().map((track) => track.readyState)),
      )
      .toEqual(['ended']);

    await confirmation.getByRole('button', { name: 'Schließen', exact: true }).press('Escape');
    await expect(opener).toBeFocused();
    await expect(page).toHaveURL(learningPaths.images);
    await expect(page.locator('video')).toHaveCount(0);
    expect(network.modelRequests).toEqual(['graph', 'weights']);
    expect(network.unexpectedRequests).toEqual([]);
  } finally {
    await pending.evaluate(({ stream }) => stream.getTracks().forEach((track) => track.stop()));
    await pending.dispose();
  }
});
