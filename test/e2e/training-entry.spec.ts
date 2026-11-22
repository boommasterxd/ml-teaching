import { expect, test, type Locator, type Page, type Request } from '@playwright/test';
import { learningPaths } from '../../src/lib/learning-paths';
import {
  diagnostics,
  expectAccessible,
  expectNoStoredTrainingData,
  observeViewTransitions,
  settleEntryAnimations,
} from './browser-checks';
import { routeSyntheticModel } from './synthetic-model';
import { observeWorkspaceCamera } from './training-camera';
import { confirmTrainingWithdrawal, grantModelConsent } from './training-keyboard';

const classAddCases = [
  { input: 'mouse', width: 1280, colorScheme: 'light', reducedMotion: 'no-preference' },
  { input: 'touch', width: 390, colorScheme: 'dark', reducedMotion: 'reduce' },
  { input: 'keyboard', width: 390, colorScheme: 'light', reducedMotion: 'no-preference' },
] as const;

for (const { input, width, colorScheme, reducedMotion } of classAddCases) {
  test.describe(`adding a class with ${input}`, () => {
    test.use({ viewport: { width, height: 844 }, hasTouch: input === 'touch' });

    test('preserves the document scroll position', async ({ page, baseURL }) => {
      await page.emulateMedia({ colorScheme, reducedMotion });
      await routeSyntheticModel(page, baseURL!);
      await page.goto(learningPaths.imagePractice);
      await grantModelConsent(page);
      await page.getByRole('button', { name: 'Ohne Kamera fortfahren' }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Bilder sammeln' })).toBeFocused();

      const add = page.getByRole('button', { name: 'Neue Klasse hinzufügen' });
      await add.evaluate((button) => {
        const { bottom } = button.getBoundingClientRect();
        window.scrollBy({ top: bottom - innerHeight + 120, behavior: 'instant' });
      });
      await settleEntryAnimations(page);
      await expect(add).toBeInViewport({ ratio: 1 });
      if (input === 'keyboard') await add.focus();
      const scrollPositions = await page.evaluateHandle(() => {
        const positions = [window.scrollY];
        window.addEventListener('scroll', () => positions.push(window.scrollY));
        return positions;
      });

      if (input === 'keyboard') {
        await expect(add).toBeFocused();
        await page.keyboard.press('Enter');
      } else if (input === 'touch') await add.tap();
      else await add.click();

      const name = page.getByRole('textbox', { name: 'Name für Klasse 3: Klasse 3' });
      const card = page.locator('[data-slot="card"]').filter({ has: name });
      await expect(name).toHaveValue('Klasse 3');
      await expect
        .poll(async () => {
          const [cardBounds, addBounds] = await Promise.all([
            card.boundingBox(),
            add.boundingBox(),
          ]);
          return Boolean(
            cardBounds && addBounds && addBounds.y >= cardBounds.y + cardBounds.height,
          );
        })
        .toBe(true);
      if (input === 'keyboard') await expect(name).toBeFocused();
      await expect(name).toBeInViewport({ ratio: 1 });
      await expectAccessible(page);
      const positions = await scrollPositions.evaluate((samples) => [
        ...new Set([...samples, window.scrollY]),
      ]);
      expect(positions[0]).toBeGreaterThan(0);
      expect(positions).toHaveLength(1);
    });
  });
}

async function followPreparedRoute(
  page: Page,
  link: Locator,
  path: string,
  content: Locator,
  text: string,
  afterActivation?: () => Promise<void>,
) {
  const requests: Request[] = [];
  const recordDestination = (request: Request) => {
    if (new URL(request.url()).pathname === path && request.headers().rsc === '1') {
      requests.push(request);
    }
  };
  page.on('request', recordDestination);
  try {
    const prepared = page.waitForResponse((response) => {
      const request = response.request();
      return (
        new URL(request.url()).pathname === path &&
        request.headers().rsc === '1' &&
        Boolean(request.headers()['next-router-segment-prefetch']?.endsWith('/__PAGE__'))
      );
    });
    await link.focus();
    await expect(link).toBeFocused();
    const payload = await prepared;
    expect(payload.ok()).toBe(true);
    expect(payload.headers()['content-type']).toContain('text/x-component');
    expect(await payload.text()).toContain(text);
    await settleEntryAnimations(page);
    const preparedRequests = requests.length;
    await page.keyboard.press('Enter');
    await afterActivation?.();
    await expect(page).toHaveURL(path);
    await expect(content).toBeVisible();
    await settleEntryAnimations(page);
    expect(requests).toHaveLength(preparedRequests);
  } finally {
    page.off('request', recordDestination);
  }
}

test('keyboard setup hands off a single model and camera stream before Flow navigation', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  const transitions = await observeViewTransitions(page, { checkDialogExit: true });
  const failures = diagnostics(page);
  await page.goto(learningPaths.hub);
  await settleEntryAnimations(page);
  expect(await transitions()).toEqual([]);

  const main = page.getByRole('main');
  await followPreparedRoute(
    page,
    main.getByRole('link', { name: 'Bilderkennung verstehen', exact: true }),
    learningPaths.images,
    main.getByRole('heading', { level: 1, name: /Was sieht die KI\?/ }),
    'Was sieht die KI?',
  );
  const imageTransition = { root: false, outgoingPages: 1, incomingPages: 1, back: false };
  expect(await transitions()).toEqual([imageTransition]);

  const network = await routeSyntheticModel(page, baseURL!);
  const expectCamera = await observeWorkspaceCamera(page);
  const consent = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  const trainingTitle = 'Eigenes Bilderkennungsmodell trainieren | ML Teaching';
  const workspace = main.getByRole('heading', { name: 'Bilder sammeln', exact: true });
  await followPreparedRoute(
    page,
    main.getByRole('link', { name: 'Eigenes Bildmodell trainieren', exact: true }),
    learningPaths.imagePractice,
    workspace,
    trainingTitle,
    async () => {
      await expect(consent).toBeVisible();
      await expect(page).toHaveURL(learningPaths.images);
      expect(await transitions()).toEqual([imageTransition]);
      expect(network.modelRequests).toEqual([]);
      await expectCamera(0, 0);
      await grantModelConsent(page);
      const camera = page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
      await expect(camera).toBeVisible();
      await expect(page).toHaveURL(learningPaths.images);
      await expectCamera(0, 0);
      await camera.getByRole('button', { name: 'Erlauben', exact: true }).press('Enter');
    },
  );
  await expect(page).toHaveTitle(trainingTitle);
  await expect(page.locator('main script').filter({ hasText: 'data.trainingConsent' })).toHaveCount(
    0,
  );
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(workspace).toBeFocused();
  await expectCamera(1, 1, 'user', learningPaths.images);
  expect(network.modelRequests).toEqual(['graph', 'weights']);
  await expectAccessible(page);
  expect(await transitions()).toEqual([imageTransition, imageTransition]);
  const shield = page.locator('button[data-training-settings-trigger="floating"]');
  await expect(shield).toBeVisible();
  await shield.press('Enter');
  const settings = page.getByRole('alertdialog', { name: 'Einstellungen zum Bildtraining' });
  await expect(settings.getByRole('button', { name: 'Schließen' })).toBeFocused();
  await expectAccessible(page);
  await page.keyboard.press('Escape');
  await expect(shield).toBeFocused();

  await page.goBack();
  await expect(page).toHaveURL(learningPaths.images);
  await settleEntryAnimations(page);
  await expectCamera(1, 0);
  const beforeForward = (await transitions()).length;
  await page.goForward();
  await expect(page).toHaveURL(learningPaths.imagePractice);
  await expect(consent).toBeVisible();
  await settleEntryAnimations(page);
  const forward = (await transitions()).slice(beforeForward);
  expect(forward.length).toBeLessThanOrEqual(1);
  for (const transition of forward) {
    expect(transition).not.toHaveProperty('setupDialog');
    expect(transition).not.toHaveProperty('dialogPresentAtStart');
  }
  expect(network.modelRequests).toEqual(['graph', 'weights']);
  expect(network.unexpectedRequests).toEqual([]);
  expect(failures).toEqual([]);
});

async function expectFirstDialogWithoutFlash(page: Page) {
  await page.goto(learningPaths.images);
  await page.reload();
  const frames = page.evaluate(
    () =>
      new Promise<{ popup: number; backdrop: string }[]>((resolve) => {
        const samples: { popup: number; backdrop: string }[] = [];
        function sample() {
          const popup = document.querySelector('[data-slot="dialog-content"]');
          const backdrop = document.querySelector('[role="presentation"].bg-media-overlay');
          if (popup && backdrop) {
            const opacity = Number(getComputedStyle(popup).opacity);
            samples.push({ popup: opacity, backdrop: getComputedStyle(backdrop).backgroundColor });
            if (opacity === 1) {
              resolve(samples);
              return;
            }
          }
          requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      }),
  );
  await page
    .getByRole('link', { name: 'Eigenes Bildmodell trainieren', exact: true })
    .press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  await expect(dialog).toBeVisible();
  const observed = await frames;
  expect(observed.some(({ popup }) => popup > 0 && popup < 1)).toBe(true);
  const settledBackdrop = observed.at(-1)!.backdrop;
  expect(settledBackdrop).not.toBe('rgba(0, 0, 0, 0)');
  expect(
    observed.filter(({ popup }) => popup > 0).every(({ backdrop }) => backdrop === settledBackdrop),
  ).toBe(true);
  await expectAccessible(page);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
}

for (const [width, colorScheme] of [
  [1440, 'light'],
  [390, 'dark'],
] as const) {
  test(`the first dialog after reload dims the page before the popup appears at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ colorScheme, reducedMotion: 'no-preference' });
    await expectFirstDialogWithoutFlash(page);
  });
}

test('a denied camera request keeps setup on the source page until the user continues', async ({
  page,
  baseURL,
}) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('Camera permission denied', 'NotAllowedError'));
  });
  const network = await routeSyntheticModel(page, baseURL!);
  const transitions = await observeViewTransitions(page, { checkDialogExit: true });
  await page.goto(learningPaths.images);
  await page
    .getByRole('link', { name: 'Eigenes Bildmodell trainieren', exact: true })
    .first()
    .click();
  await grantModelConsent(page);
  const camera = page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
  await camera.getByRole('button', { name: 'Erlauben', exact: true }).press('Enter');
  await expect(camera.getByText(/Kamerazugriff verweigert/)).toBeVisible();
  await expect(page).toHaveURL(learningPaths.images);
  expect(await transitions()).toEqual([]);
  await camera.getByRole('button', { name: 'Ohne Kamera fortfahren' }).press('Enter');
  await expect(page).toHaveURL(learningPaths.imagePractice);
  await expect(page.getByRole('heading', { name: 'Bilder sammeln', exact: true })).toBeFocused();
  await expect(
    page.getByRole('button', { name: 'Bilder auswählen', exact: true }).first(),
  ).toBeEnabled();
  const notices = page.getByRole('region', { name: 'Mitteilungen' });
  const notice = notices.getByRole('dialog', { name: /Kamerazugriff verweigert/ });
  await expect(notice).toBeVisible();
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Bilder sammeln', exact: true })).toBeFocused();
  await page.keyboard.press('F6');
  await expect(notices).toBeFocused();
  await expectAccessible(page);
  await notice.getByRole('button', { name: 'Meldung schließen' }).press('Enter');
  await expect(notice).toBeHidden();
  await expect(page.locator('video')).toHaveCount(0);
  expect(await transitions()).toEqual([
    { root: false, outgoingPages: 1, incomingPages: 1, back: false },
  ]);
  expect(network.modelRequests).toEqual(['graph', 'weights']);
  expect(network.unexpectedRequests).toEqual([]);
});

test('a missing camera leaves the direct-entry dialog visible through its fade before notifying', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('Camera unavailable', 'NotFoundError'));
  });
  await routeSyntheticModel(page, baseURL!);
  const failures = diagnostics(page);
  await page.goto(learningPaths.imagePractice);
  await grantModelConsent(page);
  const camera = page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
  await expect(camera).toBeVisible();
  const samples = await camera.evaluateHandle((dialog) => {
    const frames: { opacity: number; hasCameraText: boolean; toastShown: boolean }[] = [];
    let frame = 0;
    function sample() {
      if (!dialog.isConnected) return;
      frames.push({
        opacity: Number(getComputedStyle(dialog).opacity),
        hasCameraText: Boolean(dialog.querySelector('#camera-modal-title')),
        toastShown: Boolean(document.querySelector('[data-slot="toast"]')),
      });
      frame = requestAnimationFrame(sample);
    }
    frame = requestAnimationFrame(sample);
    return { frames, stop: () => cancelAnimationFrame(frame) };
  });
  try {
    await camera.getByRole('button', { name: 'Erlauben', exact: true }).press('Enter');
    const notices = page.getByRole('region', { name: 'Mitteilungen' });
    const notice = notices.getByRole('dialog', { name: /Kamerazugriff verweigert/ });
    await expect(notice).toBeVisible();
    const frames = await samples.evaluate(({ frames, stop }) => {
      stop();
      return frames;
    });
    expect(frames.some(({ opacity }) => opacity > 0 && opacity < 1)).toBe(true);
    expect(frames.every(({ hasCameraText, toastShown }) => hasCameraText && !toastShown)).toBe(
      true,
    );
    await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Bilder sammeln', exact: true })).toBeFocused();
    await page.keyboard.press('F6');
    await expect(notices).toBeFocused();
    await expectAccessible(page);
    await notice.getByRole('button', { name: 'Meldung schließen' }).press('Enter');
    await expect(notice).toBeHidden();

    const preview = page.locator('[data-slot="camera-preview"]').first();
    await preview.getByRole('button', { name: 'Kamera erneut verbinden' }).press('Enter');
    const spinner = preview.locator('[data-slot="spinner"]');
    await expect(spinner).toBeVisible();
    const [frameBounds, spinnerBounds, labelBounds] = await Promise.all([
      preview.boundingBox(),
      spinner.boundingBox(),
      preview.getByText('Kamera wird verbunden …').boundingBox(),
    ]);
    if (!frameBounds || !spinnerBounds || !labelBounds) throw new Error('Missing camera status.');
    expect(spinnerBounds.x + spinnerBounds.width / 2).toBeCloseTo(
      frameBounds.x + frameBounds.width / 2,
      0,
    );
    expect(spinnerBounds.y + spinnerBounds.height / 2).toBeCloseTo(
      frameBounds.y + frameBounds.height / 2,
      0,
    );
    expect(labelBounds.height).toBe(1);
    await expect(notice).toBeHidden();
    await expect(notice).toBeVisible();
    await expect(spinner).toHaveCount(0);
    expect(failures).toEqual([]);
  } finally {
    await samples.dispose();
  }
});

test('withdrawing remembered consent from training returns to the homepage', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  const network = await routeSyntheticModel(page, baseURL!);
  const source = '/datenschutz';
  await page.goto(source);
  const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
  await navigation.getByRole('button', { name: 'Menü', exact: true }).press('Enter');
  await navigation.getByRole('link', { name: 'Bildmodell trainieren', exact: true }).click();
  await expect(page).toHaveURL(source);
  await grantModelConsent(page, true);
  await page.getByRole('button', { name: 'Ohne Kamera fortfahren', exact: true }).press('Enter');
  await expect(page).toHaveURL(learningPaths.imagePractice);
  await expect.poll(() => page.evaluate(() => sessionStorage.length)).toBe(1);

  await page.setViewportSize({ width: 320, height: 256 });
  const confirmation = await confirmTrainingWithdrawal(page);
  await expect(confirmation.getByRole('heading')).toBeInViewport({ ratio: 1 });
  const leaveTraining = confirmation.getByRole('button', {
    name: 'Training verlassen',
    exact: true,
  });
  await expect(leaveTraining).toBeInViewport({ ratio: 1 });
  await expect(page).toHaveURL(learningPaths.imagePractice);
  await expectNoStoredTrainingData(page);
  await leaveTraining.press('Enter');
  await expect(page).toHaveURL('/');
  await expect(confirmation).toBeHidden();
  await expect(page.getByRole('heading', { level: 1, name: /Du probierst/ })).toBeVisible();
  await expectNoStoredTrainingData(page);
  expect(network.modelRequests).toEqual(['graph', 'weights']);
  expect(network.unexpectedRequests).toEqual([]);
});
