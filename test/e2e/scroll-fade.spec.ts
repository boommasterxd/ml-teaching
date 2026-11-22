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
  await expectEdges(consent, false, true);
  await scrollViewport(consent, 'end');
  await expectEdges(consent, true, false);
  await expect(dialog.getByRole('button', { name: 'Zustimmen' })).toBeInViewport({ ratio: 1 });
  await expectAccessible(page);
  await grantModelConsent(page);
  await page.getByRole('button', { name: 'Ohne Kamera fortfahren' }).press('Enter');

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
  const previewViewport = page.locator('[data-slot="dialog-viewport"]');
  await expectEdges(previewViewport, false, true);
  await scrollViewport(previewViewport, 'end');
  await expectEdges(previewViewport, true, false);
  await expect(preview.getByRole('button', { name: 'Bild löschen' })).toBeInViewport({ ratio: 1 });
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
