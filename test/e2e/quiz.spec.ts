import { expect, test, type Locator } from '@playwright/test';
import { QUIZ_EXAMPLES } from '../../src/content/recognition-examples';
import { diagnostics, expectAccessible } from './browser-checks';
import { learningPaths } from '../../src/lib/learning-paths';

test.use({ hasTouch: true });

async function currentRound(quiz: Locator) {
  const names = await quiz
    .getByRole('button', { name: /^Auswählen: / })
    .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')));
  const round = names.map((name) => {
    const example = QUIZ_EXAMPLES.find((item) => name === `Auswählen: ${item.title}`);
    if (!example) throw new Error('Quiz choice is missing from the everyday example pool.');
    return example;
  });
  expect(round).toHaveLength(6);
  expect(new Set(round.map((example) => example.id)).size).toBe(6);
  expect(round.filter((example) => example.correct)).toHaveLength(3);
  return round;
}

async function clickChoiceTitle(quiz: Locator, titleText: string) {
  const correct = quiz.getByRole('button', { name: `Auswählen: ${titleText}`, exact: true });
  const heading = quiz.getByRole('heading', { name: titleText, exact: true });
  await heading.scrollIntoViewIfNeeded();
  const [title, control] = await Promise.all([heading.boundingBox(), correct.boundingBox()]);
  if (!title || !control) throw new Error('Quiz choice has no visible title or hit target.');
  await correct.click({
    position: {
      x: title.x - control.x + title.width / 2,
      y: title.y - control.y + title.height / 2,
    },
  });
}

test('everyday quiz explains answers locally and resets keyboard focus', async ({ page }) => {
  const failures = diagnostics(page);
  const external: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:3100') external.push(request.url());
  });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(learningPaths.images);
  const quiz = page.locator('section[aria-labelledby="section-examples"]');
  const tooltip = page.getByRole('tooltip');
  await quiz.scrollIntoViewIfNeeded();
  await expect(quiz.getByRole('button', { name: /^Auswählen: / })).toHaveCount(6);
  const initialRound = await currentRound(quiz);
  const wrongExample = initialRound.find((example) => !example.correct)!;
  const correctExample = initialRound.find((example) => example.correct)!;
  const wrong = quiz.getByRole('button', {
    name: `Auswählen: ${wrongExample.title}`,
    exact: true,
  });
  await wrong.focus();
  await page.keyboard.press('Enter');
  await expect(quiz.getByRole('status')).toContainText(wrongExample.title);
  await expect(quiz.getByText('0 von 3 gefunden', { exact: true })).toBeVisible();
  await expect(wrong).toBeFocused();
  await expect(wrong).not.toHaveAttribute('aria-describedby');
  const incorrect = quiz.getByRole('button', {
    name: `Hier nicht: ${wrongExample.title}. Erklärung anzeigen`,
  });
  await expect(tooltip).toHaveCount(0);
  await incorrect.focus();
  await expect(tooltip).toContainText(wrongExample.explanation);
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveCount(0);
  const correct = quiz.getByRole('button', {
    name: `Auswählen: ${correctExample.title}`,
    exact: true,
  });
  await clickChoiceTitle(quiz, correctExample.title);
  await expect(quiz.getByText('1 von 3 gefunden', { exact: true })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(quiz.getByText('1 von 3 gefunden', { exact: true })).toBeVisible();
  await expect(correct).toBeFocused();
  await expect(correct).not.toHaveAttribute('aria-describedby');
  const result = quiz.getByRole('button', {
    name: `Richtig: ${correctExample.title}. Erklärung anzeigen`,
  });
  await expect(tooltip).toHaveCount(0);
  await result.hover();
  await expect(tooltip).toContainText(correctExample.explanation);
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveCount(0);
  await correct.focus();
  await result.focus();
  await expect(tooltip).toContainText(correctExample.explanation);
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveCount(0);
  await result.tap();
  await expect(tooltip).toContainText(correctExample.explanation);
  await quiz.getByText('1 von 3 gefunden', { exact: true }).click();
  await expect(tooltip).toHaveCount(0);
  await result.tap();
  await expect(tooltip).toContainText(correctExample.explanation);
  for (const example of initialRound.filter(
    (item) => item.correct && item.id !== correctExample.id,
  ))
    await clickChoiceTitle(quiz, example.title);
  await expect(quiz.getByRole('heading', { name: 'Alle drei gefunden.' })).toBeVisible();
  await expect(quiz.getByRole('status')).toContainText('Alle drei gefunden.');
  await page.keyboard.press('Escape');
  await expectAccessible(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await quiz.getByRole('button', { name: 'Nochmal spielen', exact: true }).click();
  await expect(quiz.getByText('0 von 3 gefunden', { exact: true })).toBeVisible();
  await expect(quiz.getByRole('heading', { name: 'Alle drei gefunden.' })).toHaveCount(0);
  expect(await tooltip.count()).toBe(0);
  await expect(result).toHaveCount(0);
  const nextRound = await currentRound(quiz);
  expect(nextRound.map((example) => example.id).sort()).not.toEqual(
    initialRound.map((example) => example.id).sort(),
  );
  const first = quiz.getByRole('button', {
    name: `Auswählen: ${nextRound[0]!.title}`,
    exact: true,
  });
  await expect(first).toBeFocused();
  await expect(quiz.getByText('0 von 3 gefunden', { exact: true })).toBeVisible();
  await expect(quiz.getByRole('status')).toContainText('Neue Runde.');
  await page.keyboard.press('Space');
  await expect(
    quiz.getByText(`${nextRound[0]!.correct ? 1 : 0} von 3 gefunden`, { exact: true }),
  ).toBeVisible();
  await expect(first).toBeFocused();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
  expect(external).toEqual([]);
  expect(failures).toEqual([]);
});
