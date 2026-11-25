import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
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

function holdCamera(page: Page) {
  return page.evaluateHandle(() => {
    const stream = document.createElement('canvas').captureStream();
    const request = Promise.withResolvers<MediaStream>();
    const state = { started: false, stream, resolve: () => request.resolve(stream) };
    navigator.mediaDevices.getUserMedia = () => {
      state.started = true;
      return request.promise;
    };
    return state;
  });
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
  const pending = await holdCamera(page);

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

test('canceling a direct workspace failure forgets consent and stops the camera', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  const network = await routeSyntheticModel(page, baseURL!);
  await page.goto(learningPaths.imagePractice);
  const workspaceRequest = Promise.withResolvers<void>();
  const pending = await holdCamera(page);
  const foregroundReturns: string[] = [];
  page.on('request', (request) => {
    const headers = request.headers();
    if (
      new URL(request.url()).pathname === learningPaths.images &&
      (request.isNavigationRequest() || headers.rsc === '1') &&
      headers['next-router-prefetch'] !== '1'
    ) {
      foregroundReturns.push(request.url());
    }
  });
  await page.route(`${baseURL}/_next/static/chunks/*.js`, async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const source = await readFile(`.next${pathname.slice('/_next'.length)}`, 'utf8');
    if (!source.includes('Die Ansicht konnte nicht geladen werden.')) return route.fallback();
    await workspaceRequest.promise;
    await route.abort();
  });

  try {
    await grantModelConsent(page, true);
    const camera = page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
    await camera.getByRole('button', { name: 'Erlauben', exact: true }).press('Enter');
    await expect.poll(() => pending.evaluate(({ started }) => started)).toBe(true);
    await pending.evaluate(({ resolve }) => resolve());
    const workspace = page.getByRole('dialog', { name: 'Arbeitsbereich vorbereiten' });
    await expect(workspace.getByRole('status')).toContainText('Arbeitsbereich wird geladen');
    workspaceRequest.resolve();
    await expect(workspace.getByRole('alert')).toContainText('konnte nicht geladen werden');
    await expectAccessible(page);
    const cancel = workspace.getByRole('button', { name: 'Abbrechen' });
    const prepared = page.waitForResponse((response) => {
      const headers = response.request().headers();
      return (
        new URL(response.url()).pathname === learningPaths.images &&
        headers['next-router-prefetch'] === '1' &&
        Boolean(headers['next-router-segment-prefetch']?.endsWith('/__PAGE__'))
      );
    });
    await cancel.focus();
    await expect(cancel).toBeFocused();
    const payload = await prepared;
    expect(payload.ok()).toBe(true);
    expect(await payload.text()).toContain('Bilderkennung verstehen');
    await expect(page).toHaveURL(learningPaths.imagePractice);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(learningPaths.images);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Du siehst eine Katze. Was sieht die KI?' }),
    ).toBeVisible();
    expect(foregroundReturns).toEqual([]);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect
      .poll(() =>
        pending.evaluate(({ stream }) => stream.getTracks().map((track) => track.readyState)),
      )
      .toEqual(['ended']);

    await page
      .getByRole('link', { name: 'Eigenes Bildmodell trainieren', exact: true })
      .press('Enter');
    const consent = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
    await expect(consent).toBeVisible();
    await expect(consent.getByRole('checkbox', { checked: true })).toHaveCount(0);
    await expectNoStoredTrainingData(page);
    expect(network.modelRequests).toEqual(['graph', 'weights']);
    expect(network.unexpectedRequests).toEqual([]);
  } finally {
    workspaceRequest.resolve();
    await pending.evaluate(({ stream }) => stream.getTracks().forEach((track) => track.stop()));
    await pending.dispose();
  }
});
