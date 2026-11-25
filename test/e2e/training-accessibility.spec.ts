import { expect, test, type Locator } from '@playwright/test';
import { ML } from '../../src/constants';
import { learningPaths } from '../../src/lib/learning-paths';
import { failSyntheticModel, routeSyntheticModel } from './synthetic-model';
import { grantModelConsent } from './training-keyboard';

async function expectReachable(action: Locator, singleLine = false) {
  await action.scrollIntoViewIfNeeded();
  await expect(action).toBeInViewport({ ratio: 0.99 });
  await action.click({ trial: true });
  const labelFits = await action.evaluate((button, requireSingleLine) => {
    const bounds = button.getBoundingClientRect();
    let leftEdge = bounds.left;
    let rightEdge = bounds.right;
    for (let parent = button.parentElement; parent; parent = parent.parentElement) {
      if (!['hidden', 'clip'].includes(getComputedStyle(parent).overflowX)) continue;
      const clip = parent.getBoundingClientRect();
      leftEdge = Math.max(leftEdge, clip.left);
      rightEdge = Math.min(rightEdge, clip.right);
    }
    const text = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    while (text.nextNode()) {
      if (!text.currentNode.textContent?.trim()) continue;
      range.selectNodeContents(text.currentNode);
      const lines = range.getClientRects();
      if (requireSingleLine && lines.length !== 1) return false;
      for (const { left, right } of lines) {
        if (left < leftEdge - 1 || right > rightEdge + 1) return false;
      }
    }
    return true;
  }, singleLine);
  expect(labelFits).toBe(true);
}

test('the add-class action keeps its name at the class limit', async ({ page, baseURL }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await routeSyntheticModel(page, baseURL!);
  await page.goto(learningPaths.imagePractice);
  await grantModelConsent(page);
  await page.getByRole('button', { name: 'Ohne Kamera fortfahren' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Bilder sammeln' })).toBeFocused();
  const add = page.getByRole('button', { name: 'Neue Klasse hinzufügen', exact: true });
  const classNames = page.getByRole('textbox', { name: /^Name für Klasse / });
  for (let count = ML.MIN_CLASSES + 1; count <= ML.MAX_CLASSES; count++) {
    await add.focus();
    await expect(add).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(classNames).toHaveCount(count);
  }
  await expect(add).toBeDisabled();
  await expect(add).toHaveAccessibleDescription(
    `Maximale Klassenanzahl von ${ML.MAX_CLASSES} erreicht.`,
  );
});

for (const failed of [false, true]) {
  const name = failed ? 'KI-Modell konnte nicht geladen werden' : 'Berechtigung zur Kameranutzung';
  test(`${name}: actions use one row or three rows with single-line labels`, async ({
    page,
    baseURL,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await routeSyntheticModel(page, baseURL!, failed ? failSyntheticModel : undefined);
    await page.goto(learningPaths.images);
    await page
      .getByRole('link', { name: 'Eigenes Bildmodell trainieren', exact: true })
      .press('Enter');
    await grantModelConsent(page);
    const dialog = page.getByRole('dialog', { name });
    const names = failed
      ? ['Abbrechen', 'Einwilligung widerrufen', 'Erneut versuchen']
      : ['Ohne Kamera fortfahren', 'Einwilligung widerrufen', 'Erlauben'];
    const actions = names.map((label) => dialog.getByRole('button', { name: label }));
    for (const [width, rows] of [
      [1280, 1],
      [500, 3],
      [320, 3],
    ]) {
      await page.setViewportSize({ width, height: 900 });
      for (const action of actions) await expectReachable(action, true);
      const positions = await Promise.all(actions.map((action) => action.boundingBox()));
      const verticalPositions = positions.map((position) => Math.round(position!.y));
      expect(new Set(verticalPositions).size).toBe(rows);
    }
  });
}

test('camera dialog actions remain visible and operable with custom text spacing', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await routeSyntheticModel(page, baseURL!);
  await page.goto(learningPaths.imagePractice);
  await grantModelConsent(page);
  const camera = page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
  await expect(camera).toBeVisible();
  await page.evaluate(() => {
    const spacing = new CSSStyleSheet();
    spacing.replaceSync(
      '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }',
    );
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, spacing];
  });
  for (const name of ['Ohne Kamera fortfahren', 'Einwilligung widerrufen', 'Erlauben']) {
    await expectReachable(camera.getByRole('button', { name, exact: true }));
  }
  await camera.getByRole('button', { name: 'Ohne Kamera fortfahren', exact: true }).press('Enter');
  await expect(camera).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Bilder sammeln' })).toBeFocused();
});

test('camera and class actions stay reachable when text size doubles', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await routeSyntheticModel(page, baseURL!);
  await page.goto(learningPaths.imagePractice);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await grantModelConsent(page);
  const camera = page.getByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
  const withoutCamera = camera.getByRole('button', { name: 'Ohne Kamera fortfahren' });
  await expectReachable(withoutCamera);
  await expectReachable(camera.getByRole('button', { name: 'Einwilligung widerrufen' }));
  await expectReachable(camera.getByRole('button', { name: 'Erlauben' }));
  await withoutCamera.press('Enter');

  const firstClass = page.getByRole('group', { name: 'Klasse 1', exact: true });
  const secondClass = page.getByRole('group', { name: 'Klasse 2', exact: true });
  const upload = firstClass.getByRole('button', { name: 'Bilder auswählen für Klasse 1' });
  await expect(upload).toHaveAccessibleDescription(
    `Noch Platz für ${ML.MAX_IMAGES_PER_CLASS} Bilder.`,
  );
  await expect(
    secondClass.getByRole('button', { name: 'Bilder auswählen für Klasse 2' }),
  ).toBeEnabled();
  const reset = page.getByRole('button', { name: 'Bilder der Klasse 1: Klasse 1 zurücksetzen' });
  const remove = page.getByRole('button', { name: 'Klasse 1: Klasse 1 löschen' });
  for (const action of [upload, reset, remove]) await expectReachable(action);

  await remove.press('Enter');
  await expect(page.getByRole('alertdialog', { name: 'Klasse löschen?' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(remove).toBeFocused();
  await expect(remove).toBeInViewport({ ratio: 0.99 });

  const add = page.getByRole('button', { name: 'Neue Klasse hinzufügen', exact: true });
  await expectReachable(add);
  await add.press('Enter');
  await expect(page.getByRole('textbox', { name: /^Name für Klasse 3:/ })).toBeFocused();
});
