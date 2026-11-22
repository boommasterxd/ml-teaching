import { expect, test, type Locator, type Page } from '@playwright/test';
import sharp from 'sharp';
import { ML } from '../../src/constants';
import { learningPaths } from '../../src/lib/learning-paths';
import { diagnostics, expectAccessible, settleEntryAnimations } from './browser-checks';
import { routeSyntheticModel } from './synthetic-model';
import { grantModelConsent } from './training-keyboard';

const limit = ML.MAX_IMAGES_PER_CLASS;

async function expectWindowed(gallery: Locator) {
  await expect
    .poll(() => gallery.getByRole('button', { name: /^Bild \d+ (auswählen|vergrößern)$/ }).count())
    .toBeLessThan(limit / 2);
}

async function collectGalleryImages(page: Page, count: number) {
  const buffer = await sharp({
    create: { width: 16, height: 16, channels: 3, background: '#ff0000' },
  })
    .png()
    .toBuffer();
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(
      Array.from({ length: count }, (_, index) => ({
        name: `synthetic-${index}.png`,
        mimeType: 'image/png',
        buffer,
      })),
    );
}

async function beginTouchHold(target: Locator) {
  await target.tap({ trial: true });
  const bounds = (await target.boundingBox())!;
  const page = target.page();
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }],
  });
  return async () => {
    try {
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally {
      await session.detach();
    }
  };
}

async function observeCapturePosition(record: Locator) {
  const observation = await record.evaluateHandle((button) => {
    const center = () => {
      const { top, height } = button.getBoundingClientRect();
      return top + height / 2;
    };
    const initialScroll = window.scrollY;
    const initialCenter = center();
    let scrollMovement = 0;
    let buttonMovement = 0;
    let frame = requestAnimationFrame(sample);
    function sample() {
      scrollMovement = Math.max(scrollMovement, Math.abs(window.scrollY - initialScroll));
      buttonMovement = Math.max(buttonMovement, Math.abs(center() - initialCenter));
      frame = requestAnimationFrame(sample);
    }
    return () => {
      cancelAnimationFrame(frame);
      return { scrollMovement, buttonMovement };
    };
  });
  return async () => {
    const movement = await observation.evaluate((stop) => stop());
    await observation.dispose();
    return movement;
  };
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
  await collectGalleryImages(page, limit);
  // The full gallery processes each file sequentially before the next can start.
  await expect(page.getByText(`${limit} Bilder · Limit erreicht`, { exact: true })).toBeVisible({
    timeout: 20_000,
  });
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
  expect(network.unexpectedRequests).toEqual([]);
  expect(failures).toEqual([]);
});

test.describe('touch gallery', () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });

  test('holding a thumbnail selects it once and leaves short taps available', async ({
    page,
    baseURL,
  }) => {
    const failures = diagnostics(page);
    await routeSyntheticModel(page, baseURL!);
    await page.goto(learningPaths.imagePractice);
    await grantModelConsent(page);
    await page.getByRole('button', { name: 'Ohne Kamera fortfahren' }).tap();
    await collectGalleryImages(page, 2);
    const gallery = page.getByRole('region', { name: /Trainingsbilder von Klasse 1:/ });
    const thumbnail = gallery.getByRole('button', { name: 'Bild 1 vergrößern', exact: true });
    await thumbnail.scrollIntoViewIfNeeded();
    const release = await beginTouchHold(thumbnail);
    const first = gallery.getByRole('button', { name: 'Bild 1 auswählen', exact: true });
    try {
      await expect(first).toHaveAttribute('aria-pressed', 'true');
    } finally {
      await release();
    }
    await expect(page.getByText('1 ausgewählt', { exact: true })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await gallery.getByRole('button', { name: 'Bild 2 auswählen', exact: true }).tap();
    await expect(page.getByText('2 ausgewählt', { exact: true })).toBeVisible();
    await first.tap();
    await expect(first).toHaveAttribute('aria-pressed', 'false');
    await expectAccessible(page);
    await page.getByRole('button', { name: 'Auswahl abbrechen' }).tap();
    await thumbnail.tap();
    await expect(page.getByRole('dialog', { name: 'Bild 1 aus Klasse 1' })).toBeVisible();
    expect(failures).toEqual([]);
  });

  test('recording in the second class stays in place when training unlocks', async ({
    page,
    baseURL,
  }) => {
    const failures = diagnostics(page);
    await page.setViewportSize({ width: 390, height: 700 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await routeSyntheticModel(page, baseURL!);
    await page.goto(learningPaths.imagePractice);
    await grantModelConsent(page);
    await page.getByRole('button', { name: 'Erlauben', exact: true }).tap();
    await collectGalleryImages(page, ML.MIN_IMAGES_PER_CLASS);
    await expect(
      page.getByText(`${ML.MIN_IMAGES_PER_CLASS} Bilder`, { exact: true }),
    ).toBeVisible();

    const second = page.locator('[data-slot="card"]').filter({
      has: page.getByRole('textbox', { name: 'Name für Klasse 2: Klasse 2', exact: true }),
    });
    const next = page.getByRole('button', { name: 'Weiter zum Training' }).last();
    const record = second.getByRole('button', { name: 'Aufnehmen', exact: true });
    await expect(next).toBeDisabled();
    await expect(record).toBeEnabled();
    await record.evaluate((button) =>
      button.scrollIntoView({ block: 'center', behavior: 'instant' }),
    );
    await settleEntryAnimations(page);
    const video = second.locator('video');
    await expect
      .poll(() => video.evaluate((element) => element.readyState >= element.HAVE_CURRENT_DATA))
      .toBe(true);
    const readMovement = await observeCapturePosition(record);
    const release = await beginTouchHold(record);
    try {
      await expect(second.getByRole('button', { name: 'Aufnahme stoppen' })).toBeVisible();
      await expect(next).toBeEnabled();
      await expect(second.getByText(/^(1[2-9]|[2-9]\d) Bilder$/)).toBeVisible();
    } finally {
      await release();
    }
    await expect(record).toBeEnabled();
    const { scrollMovement, buttonMovement } = await readMovement();
    expect(scrollMovement).toBeLessThanOrEqual(1);
    expect(buttonMovement).toBeLessThanOrEqual(2);
    await expectAccessible(page);
    expect(failures).toEqual([]);
  });
});
