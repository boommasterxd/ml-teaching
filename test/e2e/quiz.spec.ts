import { expect, test } from '@playwright/test';
import { diagnostics, expectAccessible } from './browser-checks';

test.use({ hasTouch: true });

test('everyday quiz explains answers locally and resets keyboard focus', async ({ page }) => {
  const failures = diagnostics(page);
  const external: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:3100') external.push(request.url());
  });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const quiz = page.locator('section[aria-labelledby="section-examples"]');
  const tooltip = page.getByRole('tooltip');
  await expect(quiz.getByRole('button', { name: /^Auswählen: / })).toHaveCount(6);
  const wrong = quiz.getByRole('button', {
    name: 'Auswählen: Sprachnachrichten abtippen',
    exact: true,
  });
  await wrong.focus();
  await page.keyboard.press('Enter');
  await expect(quiz.getByRole('status')).toContainText('Sprachnachrichten abtippen');
  await expect(quiz.getByText('0 von 3 gefunden', { exact: true })).toBeVisible();
  await expect(wrong).toBeFocused();
  await expect(wrong).not.toHaveAttribute('aria-describedby');
  const incorrect = quiz.getByRole('button', {
    name: 'Hier nicht: Sprachnachrichten abtippen. Erklärung anzeigen',
  });
  await expect(tooltip).toHaveCount(0);
  await incorrect.focus();
  await expect(tooltip).toContainText('Spracherkennung');
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveCount(0);
  const correct = quiz.getByRole('button', {
    name: 'Auswählen: Katzen in Fotos finden',
    exact: true,
  });
  const heading = quiz.getByRole('heading', { name: 'Katzen in Fotos finden' });
  await heading.scrollIntoViewIfNeeded();
  const [title, control] = await Promise.all([heading.boundingBox(), correct.boundingBox()]);
  if (!title || !control) throw new Error('Quiz choice has no visible title or hit target.');
  await correct.click({
    position: {
      x: title.x - control.x + title.width / 2,
      y: title.y - control.y + title.height / 2,
    },
  });
  await expect(quiz.getByText('1 von 3 gefunden', { exact: true })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(quiz.getByText('1 von 3 gefunden', { exact: true })).toBeVisible();
  await expect(correct).toBeFocused();
  await expect(correct).not.toHaveAttribute('aria-describedby');
  const result = quiz.getByRole('button', {
    name: 'Richtig: Katzen in Fotos finden. Erklärung anzeigen',
  });
  await expect(tooltip).toHaveCount(0);
  await result.hover();
  await expect(tooltip).toContainText('sichtbaren Merkmalen');
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveCount(0);
  await correct.focus();
  await result.focus();
  await expect(tooltip).toContainText('sichtbaren Merkmalen');
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveCount(0);
  await result.tap();
  await expect(tooltip).toContainText('sichtbaren Merkmalen');
  await quiz.getByText('1 von 3 gefunden', { exact: true }).click();
  await expect(tooltip).toHaveCount(0);
  await result.tap();
  await expect(tooltip).toContainText('sichtbaren Merkmalen');
  await expectAccessible(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await quiz.getByRole('button', { name: 'Nochmal spielen', exact: true }).click();
  await expect(quiz.getByText('0 von 3 gefunden', { exact: true })).toBeVisible();
  expect(await tooltip.count()).toBe(0);
  await expect(result).toHaveCount(0);
  await expect(
    quiz.getByRole('button', { name: 'Auswählen: Katzen in Fotos finden', exact: true }),
  ).toBeFocused();
  await expect(quiz.getByText('0 von 3 gefunden', { exact: true })).toBeVisible();
  await expect(quiz.getByRole('status')).toContainText('Quiz zurückgesetzt.');
  await page.keyboard.press('Space');
  await expect(quiz.getByText('1 von 3 gefunden', { exact: true })).toBeVisible();
  await expect(correct).toBeFocused();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
  expect(external).toEqual([]);
  expect(failures).toEqual([]);
});
