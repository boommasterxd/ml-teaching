import { expect, test, type Locator, type Page } from '@playwright/test';
import sharp from 'sharp';
import { ML } from '../../src/constants';
import { learningPaths } from '../../src/lib/learning-paths';
import { diagnostics, expectAccessible, settleEntryAnimations } from './browser-checks';
import { routeSyntheticModel } from './synthetic-model';
import { grantModelConsent, trainingSettingsTrigger } from './training-keyboard';

const limit = ML.MAX_IMAGES_PER_CLASS;

async function expectWindowed(gallery: Locator) {
  await expect
    .poll(() => gallery.getByRole('button', { name: /^Bild \d+ (auswählen|vergrößern)$/ }).count())
    .toBeLessThan(limit / 2);
}

async function expectGalleryReentry(gallery: Locator, selected: Locator) {
  const page = gallery.page();
  const position = () =>
    gallery.evaluate(({ scrollTop, scrollHeight }) => ({ scrollTop, scrollHeight }));
  const saved = await position();
  await trainingSettingsTrigger(page).focus();
  await expect(gallery).not.toBeInViewport();
  const choices = gallery.getByRole('button', { name: /^Bild \d+ auswählen$/ });
  await expect(choices).toHaveCount(0);
  expect(await position()).toEqual(saved);

  await gallery.focus();
  await expect(gallery).toBeFocused();
  await expect(selected).toBeInViewport();
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  expect(await position()).toEqual(saved);
  await page.keyboard.press('Tab');
  await expect(choices.and(page.locator(':focus'))).toBeInViewport();
  await gallery.press('End');
  await expect(selected).toBeInViewport();
  await selected.focus();
}

async function collectGalleryImages(page: Page, count: number, classIndex = 0) {
  const buffer = await sharp({
    create: { width: 16, height: 16, channels: 3, background: '#ff0000' },
  })
    .png()
    .toBuffer();
  await page
    .locator('input[type="file"]')
    .nth(classIndex)
    .setInputFiles(
      Array.from({ length: count }, (_, index) => ({
        name: `synthetic-${index}.png`,
        mimeType: 'image/png',
        buffer,
      })),
    );
}

async function beginTouchHold(target: Locator) {
  const bounds = (await target.boundingBox())!;
  const page = target.page();
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }],
  });
  return async (type: 'touchEnd' | 'touchCancel' = 'touchEnd') => {
    try {
      await session.send('Input.dispatchTouchEvent', { type, touchPoints: [] });
    } finally {
      await session.detach();
    }
  };
}

async function observeEncodedFrames(page: Page) {
  const counter = await page.evaluateHandle(() => {
    const state = { count: 0 };
    const encode = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (type, quality) {
      const output = encode.call(this, type, quality);
      if (type === 'image/jpeg') state.count++;
      return output;
    };
    return state;
  });
  return () => counter.evaluate(({ count }) => count);
}

async function expectCancelledHold(
  record: Locator,
  existingImageCount: Locator,
  encodedFrames: () => Promise<number>,
) {
  const release = await beginTouchHold(record);
  try {
    await expect.poll(encodedFrames).toBeGreaterThanOrEqual(3);
    await expect(existingImageCount).toBeVisible();
  } finally {
    await release('touchCancel');
  }
  await expect(record).toBeEnabled();
  await expect(existingImageCount).toBeVisible();
}

async function observeControlPosition(control: Locator) {
  const observation = await control.evaluateHandle((element) => {
    const center = () => {
      const { top, height } = element.getBoundingClientRect();
      return top + height / 2;
    };
    const initialScroll = window.scrollY;
    const initialCenter = center();
    let scrollMovement = 0;
    let controlMovement = 0;
    let frame = requestAnimationFrame(sample);
    function sample() {
      scrollMovement = Math.max(scrollMovement, Math.abs(window.scrollY - initialScroll));
      controlMovement = Math.max(controlMovement, Math.abs(center() - initialCenter));
      frame = requestAnimationFrame(sample);
    }
    return () => {
      cancelAnimationFrame(frame);
      return { scrollMovement, controlMovement };
    };
  });
  return async () => {
    const movement = await observation.evaluate((stop) => stop());
    await observation.dispose();
    return movement;
  };
}

async function expectStableRequirementsToggle(name: Locator, next: Locator) {
  const page = name.page();
  const hint = page.getByText(/^Mindestens \d+ Klassen, eindeutige Namen/);
  const original = await name.inputValue();
  await expect(hint).toBeHidden();
  await name.focus();
  await settleEntryAnimations(page);
  const readMovement = await observeControlPosition(name);
  const scrollHeight = () => page.evaluate(() => document.documentElement.scrollHeight);
  const initialHeight = await scrollHeight();

  await name.fill('');
  await expect(next).toBeDisabled();
  await expect(hint).toBeVisible();
  await settleEntryAnimations(page);
  expect(await scrollHeight()).toBe(initialHeight);
  await name.fill(original);
  await expect(next).toBeEnabled();
  await expect(hint).toBeHidden();
  await expect(name).toBeFocused();
  await settleEntryAnimations(page);

  const { scrollMovement, controlMovement } = await readMovement();
  expect(scrollMovement).toBeLessThanOrEqual(1);
  expect(controlMovement).toBeLessThanOrEqual(2);
}

test('a long import error stays in the mobile notification area and is dismissible by keyboard', async ({
  page,
  baseURL,
}) => {
  const network = await routeSyntheticModel(page, baseURL!);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto(learningPaths.imagePractice);
  await grantModelConsent(page);
  await page.getByRole('button', { name: 'Ohne Kamera fortfahren' }).click();
  await expect(page.getByRole('heading', { name: 'Bilder sammeln' })).toBeFocused();
  const upload = page.getByRole('button', { name: 'Bilder auswählen' }).first();
  const card = upload.locator('xpath=ancestor::*[@data-slot="card"][1]');
  const fileName = `${'untrennbarerdateiname'.repeat(6)}.png`;
  await upload.focus();
  await card.locator('input[type="file"]').setInputFiles({
    name: fileName,
    mimeType: 'image/png',
    buffer: Buffer.from('Invalid PNG'),
  });
  const viewport = page.getByRole('region', { name: 'Mitteilungen' });
  const error = viewport.getByRole('dialog', { name: 'Ein Bild konnte nicht hinzugefügt werden.' });
  await expect(error).toContainText(fileName);
  await expect(error).toBeInViewport({ ratio: 1 });
  await expect(card.getByText(fileName, { exact: false })).toHaveCount(0);
  await expect(upload).toBeFocused();
  expect((await error.boundingBox())!.y).toBeLessThan(185);
  await page.keyboard.press('F6');
  await expect(viewport).toBeFocused();
  await expectAccessible(page);
  await error.getByRole('button', { name: 'Meldung schließen' }).press('Enter');
  await expect(upload).toBeFocused();
  await expect(error).toBeHidden();
  expect(network.unexpectedRequests).toEqual([]);
});

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
  await expectGalleryReentry(gallery, last);

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

for (const width of [390, 1280]) {
  test(`the enlarged gallery restores visible focus after preview at ${width}px`, async ({
    page,
    baseURL,
  }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await routeSyntheticModel(page, baseURL!);
    await page.goto(learningPaths.imagePractice);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await grantModelConsent(page);
    await page.getByRole('button', { name: 'Ohne Kamera fortfahren' }).press('Enter');
    await collectGalleryImages(page, 20);
    await expect(page.getByText('20 Bilder', { exact: true })).toBeVisible();
    const gallery = page.getByRole('region', { name: /^Trainingsbilder von Klasse 1:/ });
    await gallery.focus();
    await gallery.press('Home');
    const thumbnail = gallery.getByRole('button', { name: 'Bild 1 vergrößern', exact: true });
    await thumbnail.press('Enter');
    const preview = page.getByRole('dialog', { name: 'Bild 1 aus Klasse 1' });
    await expect(preview).toBeVisible();
    await expect(preview.getByRole('button', { name: 'Schließen' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(preview).toHaveCount(0);
    const restoredFocus = thumbnail.or(gallery).and(page.locator(':focus'));
    await expect(restoredFocus).toBeInViewport();

    await thumbnail.press('Enter');
    await expect(preview).toBeVisible();
    await preview.getByRole('button', { name: 'Bild löschen' }).press('Enter');
    await expect(preview).toHaveCount(0);
    await expect(page.getByText('19 Bilder', { exact: true })).toBeVisible();
    await expect(gallery).toBeFocused();
    await expect(gallery).toBeInViewport();
  });
}

const touchOptions = {
  hasTouch: true,
  isMobile: true,
  viewport: { width: 390, height: 844 },
  colorScheme: 'dark',
  reducedMotion: 'reduce',
} as const;

test.describe('touch gallery', () => {
  test.use(touchOptions);

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
    await thumbnail.tap({ trial: true });
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
});

test.describe('touch recording', () => {
  test.use(touchOptions);

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
      has: page.getByRole('textbox', { name: /^Name für Klasse 2:/ }),
    });
    const next = page.getByRole('button', { name: 'Weiter zum Training' }).last();
    const record = second.getByRole('button', { name: 'Aufnehmen', exact: true });
    await collectGalleryImages(page, 1, 1);
    const existingImageCount = second.getByText(`1 / ${ML.MIN_IMAGES_PER_CLASS} Bilder`, {
      exact: true,
    });
    await expect(existingImageCount).toBeVisible();
    await expect(next).toBeDisabled();
    await expect(record).toBeEnabled();
    await record.evaluate((button) =>
      button.scrollIntoView({ block: 'center', behavior: 'instant' }),
    );
    await settleEntryAnimations(page);
    const video = second.locator('video');
    await expect
      .poll(() =>
        video.evaluate(
          (element) =>
            element instanceof HTMLVideoElement && element.readyState >= element.HAVE_CURRENT_DATA,
        ),
      )
      .toBe(true);
    await record.tap({ trial: true });
    const encodedFrames = await observeEncodedFrames(page);
    await expectCancelledHold(record, existingImageCount, encodedFrames);
    const beforeCommit = await encodedFrames();
    const readMovement = await observeControlPosition(record);
    const release = await beginTouchHold(record);
    try {
      await expect(second.getByRole('button', { name: 'Aufnahme stoppen' })).toBeVisible();
      await expect.poll(encodedFrames).toBeGreaterThanOrEqual(beforeCommit + 12);
      await expect(existingImageCount).toBeVisible();
      await expect(next).toBeDisabled();
    } finally {
      await release();
    }
    await expect(record).toBeEnabled();
    await expect(next).toBeEnabled();
    await expect(second.getByText(/^(1[2-9]|[2-9]\d) Bilder$/)).toBeVisible();
    const { scrollMovement, controlMovement } = await readMovement();
    expect(scrollMovement).toBeLessThanOrEqual(1);
    expect(controlMovement).toBeLessThanOrEqual(2);
    await expectAccessible(page);
    await expectStableRequirementsToggle(second.getByRole('textbox'), next);
    expect(failures).toEqual([]);
  });
});
