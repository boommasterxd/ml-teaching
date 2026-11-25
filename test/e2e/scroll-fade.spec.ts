import { expect, test, type Locator } from '@playwright/test';
import sharp from 'sharp';
import { learningPaths } from '../../src/lib/learning-paths';
import { diagnostics, expectAccessible } from './browser-checks';
import { routeSyntheticModel } from './synthetic-model';
import { grantModelConsent } from './training-keyboard';

const fadeViewport = '[data-scroll-fade]';

async function expectEdges(viewport: Locator, top: boolean, bottom: boolean) {
  await expect
    .poll(() =>
      viewport.evaluate((element) => {
        const style = getComputedStyle(element);
        if (style.maskImage === 'none') return [false, false];
        return ['top', 'bottom'].map(
          (edge) => Number(style.getPropertyValue(`--scroll-fade-${edge}`)) > 0.01,
        );
      }),
    )
    .toEqual([top, bottom]);
}

async function scrollViewport(viewport: Locator, position: 'start' | 'middle' | 'end') {
  await viewport.evaluate((element, target) => {
    const extent = element.scrollHeight - element.clientHeight;
    element.scrollTop = target === 'start' ? 0 : target === 'middle' ? extent / 2 : extent;
  }, position);
}

async function continueWithoutCamera(camera: Locator) {
  const page = camera.page();
  const skipCamera = camera.getByRole('button', { name: 'Ohne Kamera fortfahren' });
  const withdraw = camera.getByRole('button', { name: 'Einwilligung widerrufen' });
  const allowCamera = camera.getByRole('button', { name: 'Erlauben' });
  for (const action of [skipCamera, withdraw, allowCamera])
    await expect(action).toBeInViewport({ ratio: 1 });
  await expectAccessible(page);
  const labelFitsOnOneLine = await skipCamera.evaluate((button) => {
    const label = document.createRange();
    const text = document.createTreeWalker(button, NodeFilter.SHOW_TEXT).nextNode();
    if (!text) return false;
    label.selectNodeContents(text);
    const { left, right } = label.getBoundingClientRect();
    const bounds = button.getBoundingClientRect();
    return label.getClientRects().length === 1 && left >= bounds.left && right <= bounds.right;
  });
  expect(labelFitsOnOneLine).toBe(true);
  await allowCamera.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(withdraw).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(skipCamera).toBeFocused();
  await page.keyboard.press('Enter');
}

test('consent and the virtual gallery fade only while more content is available', async ({
  page,
  baseURL,
}) => {
  const failures = diagnostics(page);
  await page.setViewportSize({ width: 390, height: 350 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await routeSyntheticModel(page, baseURL!);
  await page.goto(learningPaths.imagePractice);
  const dialog = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  const consent = dialog.locator(fadeViewport);
  const title = dialog.getByRole('heading');
  const cancel = dialog.getByRole('link', { name: 'Abbrechen', exact: true });
  const confirm = dialog.getByRole('button', { name: 'Zustimmen' });
  for (const fixedPart of [title, cancel, confirm]) {
    await expect(fixedPart).toBeInViewport({ ratio: 1 });
  }
  await expectEdges(consent, false, true);
  const dialogBounds = await dialog.boundingBox();
  const pageScroll = await page.evaluate(() => scrollY);
  await consent.hover();
  await page.mouse.wheel(0, 2000);
  await expectEdges(consent, true, false);
  expect(await dialog.boundingBox()).toEqual(dialogBounds);
  expect(await page.evaluate(() => scrollY)).toBe(pageScroll);
  for (const fixedPart of [title, cancel, confirm]) {
    await expect(fixedPart).toBeInViewport({ ratio: 1 });
  }
  await cancel.focus();
  await page.keyboard.press('Tab');
  const firstChoice = dialog.getByRole('checkbox').first();
  await expect(firstChoice).toBeFocused();
  await expect(firstChoice).toBeInViewport({ ratio: 1 });
  await expectAccessible(page);
  await grantModelConsent(page);
  await continueWithoutCamera(page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' }));

  await page.setViewportSize({ width: 390, height: 844 });
  const gallery = page.getByRole('region', { name: /Trainingsbilder von Klasse 1:/ });
  await expectEdges(gallery, false, false);
  const photo = await sharp({
    create: { width: 80, height: 80, channels: 3, background: '#d22843' },
  })
    .png()
    .toBuffer();
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(
      Array.from({ length: 20 }, (_, index) => ({
        name: `image-${index}.png`,
        mimeType: 'image/png',
        buffer: photo,
      })),
    );
  await expect(page.getByText('20 Bilder', { exact: true })).toBeVisible();
  await expectEdges(gallery, false, true);
  await scrollViewport(gallery, 'middle');
  await expectEdges(gallery, true, true);
  await scrollViewport(gallery, 'end');
  await expectEdges(gallery, true, false);
  const last = gallery.getByRole('button', { name: 'Bild 20 vergrößern' });
  await last.press('Enter');
  const preview = page.getByRole('dialog', { name: 'Bild 20 aus Klasse 1' });
  await expect(preview).toBeVisible();
  await page.setViewportSize({ width: 390, height: 245 });
  const previewViewport = preview.getByRole('region');
  const closePreview = preview.getByRole('button', { name: 'Schließen' });
  const deleteImage = preview.getByRole('button', { name: 'Bild löschen' });
  await expect(closePreview).toBeInViewport({ ratio: 1 });
  await expect(deleteImage).toBeInViewport({ ratio: 1 });
  await expectEdges(previewViewport, false, true);
  await closePreview.focus();
  await page.keyboard.press('Tab');
  await expect(previewViewport).toBeFocused();
  await page.keyboard.press('End');
  await expectEdges(previewViewport, true, false);
  await expect(closePreview).toBeInViewport({ ratio: 1 });
  await expect(deleteImage).toBeInViewport({ ratio: 1 });
  await page.keyboard.press('Escape');
  await expect(last).toBeFocused();
  expect(failures).toEqual([]);
});

test('short navigation and options menus fade their scrollable content', async ({ page }) => {
  const failures = diagnostics(page);
  await page.setViewportSize({ width: 390, height: 225 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.header-menu-desktop')).toHaveCount(0);
  const headerTrigger = page.getByRole('button', { name: 'Menü', exact: true });
  await headerTrigger.press('Enter');
  const headerViewport = page.locator('.header-menu-viewport');
  await expect(headerViewport.getByRole('link', { name: 'Startseite' })).toBeVisible();
  await expectEdges(headerViewport, false, true);
  await scrollViewport(headerViewport, 'end');
  await expectEdges(headerViewport, true, false);
  await page.keyboard.press('Escape');
  await expect(headerTrigger).toBeFocused();

  const themeTrigger = page.getByRole('button', { name: 'Darstellung einstellen' });
  await themeTrigger.press('Enter');
  const themeMenu = page.getByRole('menu', { name: 'Darstellung einstellen' });
  const themeViewport = themeMenu.locator(fadeViewport);
  await expectEdges(themeViewport, false, true);
  await scrollViewport(themeViewport, 'end');
  await expectEdges(themeViewport, true, false);
  await expectAccessible(page);
  await page.keyboard.press('Escape');
  await expect(themeTrigger).toBeFocused();
  await themeTrigger.press('ArrowUp');
  const remember = themeMenu.getByRole('menuitemcheckbox', { name: 'Auswahl merken' });
  await expect(remember).toBeFocused();
  await expect(remember).toBeInViewport({ ratio: 1 });
  await page.keyboard.press('Escape');
  await expect(themeTrigger).toBeFocused();
  expect(failures).toEqual([]);
});
