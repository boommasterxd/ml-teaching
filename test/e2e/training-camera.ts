import { expect, type Locator, type Page } from '@playwright/test';
import { expectAccessible } from './browser-checks';

type ExpectCameraActivity = (
  requests: number,
  live: number,
  facingMode?: 'user' | 'environment',
  requestPath?: string,
) => Promise<void>;

async function observeCameraRetryCollapse(action: Locator) {
  const probe = await action.evaluateHandle((button) => {
    const surface = button.closest('[data-slot="dialog-content"]')!;
    const alert = surface.querySelector('[role="alert"]')!;
    const start = surface.getBoundingClientRect();
    const startButton = button.getBoundingClientRect();
    const bottomGap = start.bottom - startButton.bottom;
    const observed = new Promise<boolean>((resolve) => {
      const deadline = performance.now() + 1500;
      const sample = () => {
        const bounds = surface.getBoundingClientRect();
        const currentGap = bounds.bottom - button.getBoundingClientRect().bottom;
        let opacity = Number(alert.isConnected);
        for (
          let node: Element | null = alert;
          node && node !== surface;
          node = node.parentElement
        ) {
          opacity *= Number(getComputedStyle(node).opacity);
        }
        const collapsing = bounds.height < start.height - 4;
        const fading = opacity > 0.05 && opacity < 0.95;
        const footerMovesWithSurface = Math.abs(bottomGap - currentGap) < 4;
        if (collapsing && fading && footerMovesWithSurface) resolve(true);
        else if (!alert.isConnected || performance.now() >= deadline) resolve(false);
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    return { observed };
  });
  return async () => {
    try {
      expect(await probe.evaluate(({ observed }) => observed)).toBe(true);
    } finally {
      await probe.dispose();
    }
  };
}

export async function expectCameraDenialRetainsFocus(camera: Locator, requestNumber: number) {
  const page = camera.page();
  const action = camera.getByRole('button', { name: /^(Erlauben|Erneut versuchen)$/ });
  const requests = page.locator('html');
  const expectCollapse = requestNumber > 1 ? await observeCameraRetryCollapse(action) : undefined;
  await action.press('Enter');
  await expect(requests).toHaveAttribute('data-camera-requests', String(requestNumber));
  await expect(action).toBeDisabled();
  await expect(action).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect
    .poll(() =>
      action.evaluate((button) => {
        const { x, y, width, height } = button.getBoundingClientRect();
        return button.contains(document.elementFromPoint(x + width / 2, y + height / 2));
      }),
    )
    .toBe(true);
  await action.click({ force: true });
  await expect(action).toBeFocused();
  await expectCollapse?.();
  await page.evaluate(() => window.dispatchEvent(new Event('test:deny-camera')));
  await expect(camera.getByRole('alert')).toContainText('Kamerazugriff verweigert');
  const retry = camera.getByRole('button', { name: 'Erneut versuchen', exact: true });
  await expect(retry).toBeEnabled();
  await expect(retry).toBeFocused();
  await expect(requests).toHaveAttribute('data-camera-requests', String(requestNumber));
}

export async function observeWorkspaceCamera(
  page: Page,
  input: 'browser' | 'class-colors' = 'browser',
): Promise<ExpectCameraActivity> {
  const activity = await page.evaluateHandle((input) => {
    const state = {
      requests: 0,
      tracks: [] as MediaStreamTrack[],
      facingMode: undefined as MediaTrackConstraints['facingMode'],
      requestPath: '',
    };
    const devices = navigator.mediaDevices;
    const getUserMedia = devices.getUserMedia.bind(devices);
    function classColorStream(facingMode: MediaTrackConstraints['facingMode']) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 224;
      const pixels = canvas.getContext('2d');
      if (!pixels) throw new Error('Cannot create the synthetic camera frame.');
      const stream = canvas.captureStream();
      // Red and blue match the two uploaded training classes.
      pixels.fillStyle = facingMode === 'environment' ? '#0000ff' : '#ff0000';
      pixels.fillRect(0, 0, canvas.width, canvas.height);
      return stream;
    }
    devices.getUserMedia = async (constraints) => {
      state.requests++;
      state.requestPath = location.pathname;
      if (typeof constraints?.video === 'object') state.facingMode = constraints.video.facingMode;
      const stream =
        input === 'class-colors'
          ? classColorStream(state.facingMode)
          : await getUserMedia(constraints);
      state.tracks.push(...stream.getVideoTracks());
      return stream;
    };
    return state;
  }, input);
  return async (requests, live, facingMode, requestPath) => {
    const snapshot = () =>
      activity.evaluate(({ requests, tracks, facingMode, requestPath }) => ({
        requests,
        live: tracks.filter((track) => track.readyState === 'live').length,
        ended: tracks.filter((track) => track.readyState === 'ended').length,
        facingMode,
        requestPath,
      }));
    await expect.poll(snapshot).toMatchObject({
      requests,
      live,
      ended: requests - live,
      ...(facingMode && { facingMode }),
      ...(requestPath && { requestPath }),
    });
  };
}

function cameraControls(frame: Locator) {
  return {
    pause: frame.getByRole('button', { name: 'Kamera pausieren', exact: true }),
    play: frame.getByRole('button', { name: 'Kamera aktivieren', exact: true }),
    switchCamera: frame.getByRole('button', { name: 'Kamera wechseln', exact: true }),
  };
}

async function expectControlsInCorners(frame: Locator) {
  const { pause, switchCamera } = cameraControls(frame);
  await pause.scrollIntoViewIfNeeded();
  await expect(pause).toBeInViewport({ ratio: 1 });
  await expect(switchCamera).toBeInViewport({ ratio: 1 });
  const [preview, left, right] = await Promise.all([
    frame.boundingBox(),
    pause.boundingBox(),
    switchCamera.boundingBox(),
  ]);
  if (!preview || !left || !right) throw new Error('Camera preview controls are missing.');
  const center = preview.x + preview.width / 2;
  expect(left.x).toBeGreaterThanOrEqual(preview.x);
  expect(left.x + left.width).toBeLessThanOrEqual(center);
  expect(right.x).toBeGreaterThanOrEqual(center);
  expect(right.x + right.width).toBeLessThanOrEqual(preview.x + preview.width);
  for (const control of [left, right]) {
    expect(control.width).toBeGreaterThanOrEqual(44);
    expect(control.height).toBeGreaterThanOrEqual(44);
    expect(control.y).toBeGreaterThanOrEqual(preview.y + preview.height / 2);
    expect(control.y + control.height).toBeLessThanOrEqual(preview.y + preview.height);
  }
}

export async function expectCameraToggleKeepsImages(
  page: Page,
  expectCamera: ExpectCameraActivity,
) {
  const frames = page.locator('[data-slot="camera-preview"]');
  await expect(frames.getByRole('status')).toHaveText(['Kamera aus', 'Kamera aus']);
  await expect(frames.locator('video')).toHaveCount(0);
  const frame = frames.first();
  const { pause, play } = cameraControls(frame);
  const consent = page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
  await play.press('Enter');
  await expect(consent).toBeVisible();
  await expectCamera(0, 0);
  await consent.getByRole('button', { name: 'Erlauben', exact: true }).press('Enter');
  await expectCamera(1, 1);
  await expectControlsInCorners(frame);
  await expectAccessible(page);
  await pause.press('Enter');
  await expectCamera(1, 0);
  await expect(play).toBeFocused();
  await expect(page.getByRole('textbox', { name: /^Name für Klasse / })).toHaveCount(2);
  await expect(page.getByText('10 Bilder', { exact: true })).toHaveCount(2);
  const otherClass = cameraControls(frames.last());
  await otherClass.play.press('Enter');
  await expectCamera(2, 1);
  await expect(otherClass.pause).toBeFocused();
  await expect(consent).toHaveCount(0);
}

export async function expectLivePredictionControls(page: Page, expectCamera: ExpectCameraActivity) {
  const preview = page.getByLabel('Kameravorschau für Vorhersage');
  const space = page.getByRole('figure', { name: 'Merkmalsraum' });
  const legendItems = space.getByRole('list', { name: 'Legende' }).getByRole('listitem');
  const marker = space.locator('[data-slot="prediction-live-point"]');
  const frame = page.locator('[data-slot="prediction-camera"]');
  const { pause, play, switchCamera } = cameraControls(frame);
  const viewport = page.viewportSize()!;
  await page.setViewportSize({ width: 1280, height: viewport.height });
  await expectCamera(3, 1);
  await expect(preview).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Konfidenz für Klasse 1' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Konfidenz für Klasse 2' })).toBeVisible();
  await expectWinningClass(page, 'Klasse 1', 'Klasse 2');
  await expect(legendItems).toHaveText(['Kamerabild', 'Klasse 1', 'Klasse 2']);
  await space.scrollIntoViewIfNeeded();
  await expect(marker).toBeVisible();
  await expect(space.getByRole('button', { name: 'Diagramm beschreiben' })).toHaveCount(0);
  await expectControlsInCorners(frame);
  await switchCamera.press('Enter');
  await expectCamera(4, 1, 'environment');
  await expect(switchCamera).toBeFocused();
  await expect(page.getByRole('progressbar', { name: 'Konfidenz für Klasse 1' })).toBeVisible();
  await expectWinningClass(page, 'Klasse 2', 'Klasse 1');
  await expectAccessible(page);

  await page.setViewportSize({ width: 320, height: viewport.height });
  await expect
    .poll(() =>
      legendItems.evaluateAll(
        (items) => new Set(items.map((item) => item.getBoundingClientRect().top)).size,
      ),
    )
    .toBe(1);
  await page.setViewportSize({ width: 390, height: viewport.height });
  const theme = page.getByRole('switch', { name: 'Dunkle Darstellung' });
  await theme.press('Space');
  await expect(theme).not.toBeChecked();
  await expectControlsInCorners(frame);
  const recordSizes = await observePredictionSizes(frame);
  await pause.press('Space');
  await expect(play).toBeFocused();
  await expect(preview).toBeHidden();
  await expect(space).toBeVisible();
  await expect(marker).toHaveCount(0);
  await expectCamera(4, 0);
  await play.press('Space');
  await expectCamera(5, 1, 'environment');
  await expect(pause).toBeFocused();
  await expect(page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' })).toHaveCount(0);
  await space.scrollIntoViewIfNeeded();
  await expect(marker).toBeVisible();
  await recordSizes();
  await expectAccessible(page);
  await page.setViewportSize(viewport);
}

async function expectWinningClass(page: Page, winner: string, runnerUp: string) {
  await expect(page.getByRole('heading', { name: winner, exact: true })).toBeVisible();
  const confidence = async (name: string) =>
    Number.parseFloat(
      (await page
        .getByRole('progressbar', { name: `Konfidenz für ${name}`, exact: true })
        .getAttribute('aria-valuenow')) ?? '',
    );
  await expect
    .poll(async () => (await confidence(winner)) - (await confidence(runnerUp)))
    .toBeGreaterThan(0);
}

async function observePredictionSizes(frame: Locator) {
  const probe = await frame.evaluateHandle((node) => {
    const panel = node.closest('section')!;
    const sizes = new Set<string>();
    const record = () =>
      sizes.add(
        [node, panel]
          .map((element) => Math.round(element.getBoundingClientRect().height))
          .join('/'),
      );
    record();
    const observer = new ResizeObserver(record);
    observer.observe(node);
    observer.observe(panel);
    return { observer, sizes, record };
  });
  return async () => {
    const sizes = await probe.evaluate(({ observer, sizes, record }) => {
      record();
      observer.disconnect();
      return [...sizes];
    });
    await probe.dispose();
    expect(sizes).toHaveLength(1);
  };
}
