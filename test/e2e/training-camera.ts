import { expect, type Locator, type Page } from '@playwright/test';
import { expectAccessible } from './browser-checks';

type ExpectCameraActivity = (
  requests: number,
  live: number,
  facingMode?: 'user' | 'environment',
) => Promise<void>;

export async function observeWorkspaceCamera(page: Page): Promise<ExpectCameraActivity> {
  const activity = await page.evaluateHandle(() => {
    const state = {
      requests: 0,
      tracks: [] as MediaStreamTrack[],
      facingMode: undefined as MediaTrackConstraints['facingMode'],
    };
    const devices = navigator.mediaDevices;
    const getUserMedia = devices.getUserMedia.bind(devices);
    devices.getUserMedia = async (constraints) => {
      state.requests++;
      if (typeof constraints?.video === 'object') state.facingMode = constraints.video.facingMode;
      const stream = await getUserMedia(constraints);
      state.tracks.push(...stream.getVideoTracks());
      return stream;
    };
    return state;
  });
  return async (requests, live, facingMode) => {
    const snapshot = () =>
      activity.evaluate(({ requests, tracks, facingMode }) => ({
        requests,
        live: tracks.filter((track) => track.readyState === 'live').length,
        ended: tracks.filter((track) => track.readyState === 'ended').length,
        facingMode,
      }));
    await expect.poll(snapshot).toMatchObject({
      requests,
      live,
      ended: requests - live,
      ...(facingMode && { facingMode }),
    });
  };
}

function cameraControls(frame: Locator) {
  return {
    pause: frame.getByRole('button', { name: 'Kamera ausschalten', exact: true }),
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

async function enableCamera(
  page: Page,
  play: Locator,
  expectCamera: ExpectCameraActivity,
  requests: number,
) {
  const consent = page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
  await play.press('Enter');
  await expect(consent).toBeVisible();
  await expectCamera(requests, 0);
  await consent.getByRole('button', { name: 'Erlauben', exact: true }).press('Enter');
  await expectCamera(requests + 1, 1);
}

export async function expectCameraToggleKeepsImages(
  page: Page,
  expectCamera: ExpectCameraActivity,
) {
  await enableCamera(
    page,
    page.getByRole('button', { name: 'Kamera aktivieren', exact: true }),
    expectCamera,
    0,
  );
  const frame = page.locator('[data-slot="camera-preview"]').first();
  const { pause, play } = cameraControls(frame);
  await expectControlsInCorners(frame);
  await expectAccessible(page);
  await pause.press('Enter');
  await expectCamera(1, 0);
  await expect(play).toBeFocused();
  await expect(page.getByRole('textbox', { name: /^Name für Klasse / })).toHaveCount(2);
  await expect(page.getByText('10 Bilder', { exact: true })).toHaveCount(2);
  await enableCamera(page, play, expectCamera, 1);
}

export async function expectLivePredictionControls(page: Page, expectCamera: ExpectCameraActivity) {
  const preview = page.getByLabel('Kameravorschau für Vorhersage');
  const space = page.getByRole('figure', { name: 'Merkmalsraum' });
  const marker = space.locator('[data-slot="prediction-live-point"]');
  const frame = page.locator('[data-slot="prediction-camera"]');
  const { pause, play, switchCamera } = cameraControls(frame);
  const viewport = page.viewportSize()!;
  await expectCamera(3, 1);
  await expect(preview).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Konfidenz für Klasse 1' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Konfidenz für Klasse 2' })).toBeVisible();
  await expect(space.getByRole('listitem').filter({ hasText: /Klasse 1.*10/ })).toBeVisible();
  await expect(space.getByRole('listitem').filter({ hasText: /Klasse 2.*10/ })).toBeVisible();
  await space.scrollIntoViewIfNeeded();
  await expect(marker).toBeVisible();
  await expectControlsInCorners(frame);
  await switchCamera.press('Enter');
  await expectCamera(4, 1, 'environment');
  await expect(switchCamera).toBeFocused();
  await expect(page.getByRole('progressbar', { name: 'Konfidenz für Klasse 1' })).toBeVisible();
  await expectAccessible(page);

  await page.setViewportSize({ width: 390, height: viewport.height });
  await expectControlsInCorners(frame);
  const recordSizes = await observePredictionSizes(frame);
  await pause.press('Space');
  await expect(play).toBeFocused();
  await expect(preview).toBeHidden();
  await expect(space).toBeVisible();
  await expect(marker).toHaveCount(0);
  await expectCamera(4, 0);
  await enableCamera(page, play, expectCamera, 4);
  await space.scrollIntoViewIfNeeded();
  await expect(marker).toBeVisible();
  await recordSizes();

  await page.setViewportSize(viewport);
  const describe = space.getByRole('button', { name: 'Diagramm beschreiben', exact: true });
  await describe.press('Enter');
  await expect(space.getByRole('heading', { name: 'Diagrammbeschreibung' })).toBeFocused();
  await expect(space.getByText(/^Kamerabild:/)).toBeVisible();
  await expectAccessible(page);
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
