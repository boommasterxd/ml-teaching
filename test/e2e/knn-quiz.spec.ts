import { expect, test, type Locator, type Page } from '@playwright/test';
import { diagnostics, expectAccessible, holdApplicationScripts } from './browser-checks';
import { learningPaths } from '../../src/lib/learning-paths';

async function rankedTargets(exercise: Locator) {
  const query = await exercise
    .getByRole('img', { name: 'Raute: der neue Datenpunkt' })
    .boundingBox();
  if (!query) throw new Error('The query point is not visible.');
  const controls = await exercise.getByRole('button', { name: /^(Hund|Katze), Punkt / }).all();
  const points = await Promise.all(
    controls.map(async (control) => {
      const box = await control.boundingBox();
      if (!box) throw new Error('A plotted point is not visible.');
      // Container-unit translation can leave subpixel floating-point residue in native boxes.
      expect(Number(box.width.toFixed(3))).toBeGreaterThanOrEqual(44);
      expect(Number(box.height.toFixed(3))).toBeGreaterThanOrEqual(44);
      return {
        control,
        label: (await control.getAttribute('aria-label'))!,
        distance: Math.hypot(
          box.x + box.width / 2 - query.x - query.width / 2,
          box.y + box.height / 2 - query.y - query.height / 2,
        ),
      };
    }),
  );
  return points.sort((a, b) => a.distance - b.distance);
}

async function rankedAccessibleTargets(exercise: Locator) {
  const controls = await exercise.getByRole('button', { name: /^(Hund|Katze), Punkt / }).all();
  const points = await Promise.all(
    controls.map(async (control) => {
      const label = (await control.getAttribute('aria-label'))!;
      const match = label.match(/Abstand zur Raute: ([\d,]+) Einheiten/);
      if (!match) throw new Error('The point has no accessible distance.');
      return { control, label, distance: Number(match[1].replace(',', '.')) };
    }),
  );
  return points.sort((a, b) => a.distance - b.distance);
}

async function plottedData(exercise: Locator) {
  return exercise.getByRole('button', { name: /^(Hund|Katze), Punkt / }).evaluateAll((buttons) =>
    buttons.map((button) => ({
      label: button.getAttribute('aria-label'),
      position: button.getAttribute('style'),
    })),
  );
}

async function expectResponsivePlot(exercise: Locator, width: number) {
  const geometry = await exercise.evaluate((section) => {
    const card = section.querySelector<HTMLElement>('.knn-quiz-card')!;
    const content = card.querySelector<HTMLElement>('.knn-quiz-layout')!;
    const plot = card.querySelector<HTMLElement>('.knn-quiz-plot')!;
    const sectionStyle = getComputedStyle(section);
    const contentStyle = getComputedStyle(content);
    return {
      available:
        section.getBoundingClientRect().width -
        parseFloat(sectionStyle.paddingLeft) -
        parseFloat(sectionStyle.paddingRight),
      card: card.getBoundingClientRect().width,
      content:
        content.getBoundingClientRect().width -
        parseFloat(contentStyle.paddingLeft) -
        parseFloat(contentStyle.paddingRight),
      plot: {
        width: plot.getBoundingClientRect().width,
        height: plot.getBoundingClientRect().height,
      },
      mobileHeightLimit: 24 * parseFloat(getComputedStyle(document.documentElement).fontSize),
    };
  });
  expect(geometry.card).toBeCloseTo(geometry.available, 0);
  if (width < 1024) {
    expect(geometry.plot.width).toBeCloseTo(geometry.content, 0);
    expect(geometry.plot.height).toBeLessThanOrEqual(geometry.mobileHeightLimit + 0.5);
  }
  return geometry.plot;
}

async function expectConnections(exercise: Locator, expectedCount = 3) {
  const distances = await exercise.evaluate((section) => {
    const center = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    };
    const query = center(section.querySelector('.knn-query-position')!);
    const rings = [
      ...section.querySelectorAll('.knn-point-control[aria-pressed="true"] circle[stroke]'),
    ].map((circle) => ({
      ...center(circle),
      radius: circle.getBoundingClientRect().width / 2,
    }));
    return [...section.querySelectorAll<SVGPathElement>('.knn-quiz-connections > path')].map(
      (path) => {
        const matrix = path.getScreenCTM()!;
        const start = path.getPointAtLength(0).matrixTransform(matrix);
        const end = path.getPointAtLength(path.getTotalLength()).matrixTransform(matrix);
        return {
          start: Math.hypot(start.x - query.x, start.y - query.y),
          end: Math.min(
            ...rings.map((ring) => {
              const dx = query.x - ring.x;
              const dy = query.y - ring.y;
              const scale = ring.radius / Math.hypot(dx, dy);
              return Math.hypot(end.x - (ring.x + dx * scale), end.y - (ring.y + dy * scale));
            }),
          ),
        };
      },
    );
  });
  expect(distances).toHaveLength(expectedCount);
  for (const distance of distances) {
    expect(distance.start).toBeLessThan(1);
    expect(distance.end).toBeLessThan(1);
  }
}

async function expectResizeContinuity(exercise: Locator, page: Page, originalWidth: number) {
  const selected = exercise.locator('.knn-point-control[aria-pressed="true"]');
  const labels = await selected.evaluateAll((points) =>
    points.map((point) => point.getAttribute('aria-label')),
  );
  const focused = selected.first();
  await focused.focus();
  for (const width of [1023, 1024, originalWidth]) {
    await page.setViewportSize({ width, height: 1000 });
    await expectResponsivePlot(exercise, width);
    await expect(focused).toBeFocused();
    expect(
      await selected.evaluateAll((points) =>
        points.map((point) => point.getAttribute('aria-label')),
      ),
    ).toEqual(labels);
    await expectConnections(exercise);
  }
}

async function expectOddNeighborVote(exercise: Locator, count: number) {
  const nearest = (await rankedAccessibleTargets(exercise)).slice(0, count);
  for (const point of nearest) {
    await point.control.click();
    await expect(point.control).toHaveAttribute('aria-pressed', 'true');
  }
  const dogs = nearest.filter((point) => point.label.startsWith('Hund')).length;
  const winner = dogs > count / 2 ? 'Hund' : 'Katze';
  await exercise.getByRole('button', { name: winner, exact: true }).click();
  await expect(exercise.locator('[data-slot="alert"]')).toContainText('Richtig zugeordnet!');
}

async function expectAnswerRows(exercise: Locator, rows: number) {
  const answers = exercise.getByRole('button', { name: /^(Hund|Katze|Gleichstand)$/ });
  await expect(answers).toHaveCount(3);
  const bounds = await answers.evaluateAll((buttons) =>
    buttons.map((button) => {
      const { top, height } = button.getBoundingClientRect();
      return { top, height };
    }),
  );
  expect(new Set(bounds.map(({ top }) => Math.round(top))).size).toBe(rows);
  expect(Math.min(...bounds.map(({ height }) => height))).toBeGreaterThanOrEqual(44);
}

async function expectResponsiveFeedback(page: Page, exercise: Locator, originalWidth: number) {
  const answers = exercise.getByRole('group', { name: '2. Welche Klasse gewinnt?' });
  const feedback = exercise.locator('[data-slot="alert"]');
  for (const width of [originalWidth, 390, 1280, originalWidth]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect
      .poll(async () => {
        const [choices, result] = await Promise.all([
          answers.boundingBox(),
          feedback.boundingBox(),
        ]);
        if (!choices || !result) return false;
        if (width === originalWidth) {
          return result.x >= choices.x + choices.width && result.y < choices.y + choices.height;
        }
        return result.y >= choices.y + choices.height;
      })
      .toBe(true);
  }
}

for (const [width, colorScheme] of [
  [320, 'dark'],
  [1280, 'light'],
] as const) {
  test(`KNN controls fit and support keyboard selection at ${width}px`, async ({ page }) => {
    const failures = diagnostics(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({
      colorScheme,
      reducedMotion: width === 320 ? 'reduce' : 'no-preference',
    });
    await page.goto(learningPaths.images);
    const exercise = page.getByRole('region', { name: 'Welche Nachbarn zählen?' });
    const slider = exercise.getByRole('slider');
    await expect(slider).toHaveCount(0);
    await exercise.getByRole('heading', { name: 'Hund oder Katze?' }).scrollIntoViewIfNeeded();
    await expect(slider).toHaveAttribute('aria-valuenow', '3');
    await expectAnswerRows(exercise, width === 320 ? 2 : 1);
    if (width === 320) {
      await page.setViewportSize({ width: 375, height: 1000 });
      await expectAnswerRows(exercise, 1);
      await page.setViewportSize({ width, height: 1000 });
    }
    const points = await rankedTargets(exercise);
    const plot = await expectResponsivePlot(exercise, width);
    expect(points[3].distance - points[2].distance).toBeGreaterThan(
      Math.min(plot.width, plot.height) * 0.14,
    );
    const nearest = points[0].control;
    await nearest.focus();
    await expect(nearest).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(nearest).toHaveAttribute('aria-pressed', 'true');
    await expect(nearest).toBeFocused();
    await expectConnections(exercise, 1);
    await expectAccessible(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    expect(failures).toEqual([]);
  });
}

test('KNN keeps selected neighbors until a slider change is committed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(learningPaths.images);
  const exercise = page.getByRole('region', { name: 'Welche Nachbarn zählen?' });
  await exercise.getByRole('heading', { name: 'Hund oder Katze?' }).scrollIntoViewIfNeeded();
  const slider = exercise.getByRole('slider');
  await expect(slider).toHaveAttribute('aria-valuenow', '3');
  const [nearest] = await rankedAccessibleTargets(exercise);
  await nearest.control.press('Enter');
  await expect(nearest.control).toHaveAttribute('aria-pressed', 'true');

  const track = exercise.locator('[data-slot="slider-control"]');
  await track.scrollIntoViewIfNeeded();
  const bounds = await track.boundingBox();
  const thumb = await exercise.locator('[data-slot="slider-thumb"]').boundingBox();
  if (!bounds || !thumb) throw new Error('KNN slider is not visible.');
  const y = thumb.y + thumb.height / 2;
  const newX = bounds.x + bounds.width * 0.85;

  await page.mouse.move(newX, y);
  await page.mouse.down();
  await expect(slider).not.toHaveAttribute('aria-valuenow', '3');
  await expect(nearest.control).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.move(thumb.x + thumb.width / 2, y);
  await page.mouse.up();
  await expect(slider).toHaveAttribute('aria-valuenow', '3');
  await expect(nearest.control).toHaveAttribute('aria-pressed', 'true');

  await page.mouse.click(newX, y);
  await expect(slider).not.toHaveAttribute('aria-valuenow', '3');
  await expect(nearest.control).toHaveAttribute('aria-pressed', 'false');
  await slider.press('Home');
  await expect(slider).toHaveAttribute('aria-valuenow', '1');
  await expect(exercise.getByRole('status')).toContainText('Finde jetzt 1 Nachbarn.');
});

test('KNN exercise supports retries, voting limits, and new rounds @ci', async ({ page }) => {
  const failures = diagnostics(page);
  const width = 800;
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(learningPaths.images);
  const exercise = page.getByRole('region', { name: 'Welche Nachbarn zählen?' });
  await exercise.getByRole('heading', { name: 'Hund oder Katze?' }).scrollIntoViewIfNeeded();
  const slider = exercise.getByRole('slider');
  await expect(slider).toHaveAttribute('aria-valuenow', '3');
  const points = await rankedTargets(exercise);
  const plot = await expectResponsivePlot(exercise, width);
  expect(points[3].distance - points[2].distance).toBeGreaterThan(
    Math.min(plot.width, plot.height) * 0.14,
  );
  await expect(exercise.getByRole('button', { name: 'Hund', exact: true })).toBeDisabled();
  await points.at(-1)!.control.focus();
  await page.keyboard.press('Enter');
  await expect(points.at(-1)!.control).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('tooltip')).toContainText('Wähle einen Punkt näher an der Raute.');
  await expectAccessible(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  const accessiblePoints = await rankedAccessibleTargets(exercise);
  for (const point of accessiblePoints.slice(0, 3)) {
    await point.control.focus();
    await page.keyboard.press('Enter');
    await expect(point.control).toHaveAttribute('aria-pressed', 'true');
  }
  await expectConnections(exercise);
  await expectResizeContinuity(exercise, page, width);
  const dogs = accessiblePoints
    .slice(0, 3)
    .filter((point) => point.label.startsWith('Hund')).length;
  const winner = dogs >= 2 ? 'Hund' : 'Katze';
  const loser = dogs >= 2 ? 'Katze' : 'Hund';
  const wrongAnswer = exercise.getByRole('button', { name: loser, exact: true });
  await wrongAnswer.focus();
  await page.keyboard.press('Enter');
  const feedback = exercise.locator('[data-slot="alert"]');
  await expect(feedback).toContainText('Zähle noch einmal.');
  const status = exercise.getByRole('status');
  await expect(status).toContainText('Fehlversuch 1: Zähle noch einmal');
  await expect(
    exercise.locator(
      ':is([role="alert"], [role="status"], [aria-live="assertive"], [aria-live="polite"])',
    ),
  ).toHaveCount(1);
  await expect(wrongAnswer).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('Fehlversuch 2: Zähle noch einmal');
  await expect(wrongAnswer).toBeFocused();
  await exercise.getByRole('button', { name: winner, exact: true }).focus();
  await page.keyboard.press('Enter');
  const restart = exercise.getByRole('button', { name: 'Neue Runde', exact: true });
  await expect(restart).toBeFocused();
  const disabledPoints = exercise
    .getByRole('button', { name: /^(Hund|Katze), Punkt / })
    .and(page.locator(':disabled'));
  await expect(disabledPoints).toHaveCount(12);
  await expect(feedback).toContainText('Richtig zugeordnet!');
  await expect(exercise.getByRole('status')).toContainText(
    `2 von 3 Nachbarn stimmen für ${winner}`,
  );
  await expectResponsiveFeedback(page, exercise, width);
  await expect(restart).toBeFocused();
  await expectAccessible(page);
  const before = await plottedData(exercise);
  await page.keyboard.press('Enter');
  await expect(exercise.getByRole('status')).toContainText('Neue Runde.');
  await expect(disabledPoints).toHaveCount(0);
  expect(await plottedData(exercise)).not.toEqual(before);
  await slider.focus();
  const stablePoints = await plottedData(exercise);
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuenow', '4');
  await expect(exercise.getByText('K = 4 · 0 von 4 gefunden')).toBeVisible();
  await page.keyboard.press('End');
  await expect(slider).toHaveAttribute('aria-valuenow', '10');
  expect(await plottedData(exercise)).toEqual(stablePoints);
  const nearest = (await rankedTargets(exercise)).slice(0, 10);
  for (const point of nearest) await point.control.click();
  await expect(exercise.getByText('K = 10 · 10 von 10 gefunden')).toBeVisible();
  await slider.focus();
  await page.keyboard.press('Home');
  await expect(slider).toHaveAttribute('aria-valuenow', '1');
  await expectOddNeighborVote(exercise, 1);
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuenow', '2');
  for (const point of (await rankedTargets(exercise)).slice(0, 2)) await point.control.click();
  await exercise.getByRole('button', { name: 'Gleichstand', exact: true }).click();
  await expect(feedback).toContainText('Gleichstand erkannt!');
  await expectAccessible(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(failures).toEqual([]);
});

test('touch opens and dismisses an everyday quiz explanation', async ({ browser, baseURL }) => {
  const page = await browser.newPage({
    baseURL,
    viewport: { width: 390, height: 960 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  try {
    await page.goto(learningPaths.images);
    const quiz = page.getByRole('region', { name: 'Wo steckt Bilderkennung drin?' });
    await quiz
      .getByRole('button', { name: /^Auswählen:/ })
      .first()
      .tap();
    const result = quiz.getByRole('button', { name: /Erklärung anzeigen$/ });
    await result.tap();
    const explanation = page.getByRole('tooltip');
    await expect(explanation).toBeVisible();
    await expect(result).toHaveAccessibleDescription((await explanation.textContent())!);
    await page.keyboard.press('Escape');
    await expect(explanation).toHaveCount(0);
    await expect(result).toBeFocused();
  } finally {
    await page.close();
  }
});

test('KNN keyboard focus starts the exercise and advances to its controls', async ({ page }) => {
  const failures = diagnostics(page);
  await page.goto(learningPaths.images);
  const exercise = page.getByRole('region', { name: 'Welche Nachbarn zählen?' });
  const exerciseControls = exercise.getByRole('group', { name: 'KNN-Übung' });
  // Keep the viewport out of range to exercise focus preparation by itself.
  const initialScroll = await page.evaluate(() => scrollY);
  await expect(exercise.getByRole('slider')).toHaveCount(0);
  await exerciseControls.evaluate((group) => group.focus({ preventScroll: true }));
  await expect(exercise.getByRole('slider')).toBeVisible();
  await expect(exerciseControls).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(initialScroll);
  await page.keyboard.press('Tab');
  await expect(exercise.getByRole('button', { name: 'Neue Runde' })).toBeFocused();
  await page.keyboard.press('Tab');
  const slider = exercise.getByRole('slider');
  await expect(slider).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuenow', '4');
  expect(failures).toEqual([]);
});

for (const width of [390, 1280]) {
  test(`KNN reload preserves the exercise footprint and scroll position at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Keep font metrics identical across documents to isolate scroll restoration from font timing.
    await page.route('**/_next/static/media/*.woff2', (route) => route.abort());
    await page.goto(learningPaths.images);
    const exercise = page.getByRole('region', { name: 'Welche Nachbarn zählen?' });
    const heading = exercise.getByRole('heading', { name: 'Hund oder Katze?' });
    const slider = exercise.getByRole('slider');
    // Scroll after hydration so the initial browser viewport is still above the exercise.
    await heading.scrollIntoViewIfNeeded();
    await expect(slider).toBeVisible();
    const height = () => exercise.evaluate((section) => section.getBoundingClientRect().height);
    const readyHeight = await height();
    const scroll = await page.evaluate(() => scrollY);
    const scripts = await holdApplicationScripts(page);
    try {
      await page.reload({ waitUntil: 'commit' });
      await scripts.expectHeld();
      await expect(exercise.getByText('Die Übung wird geladen …')).toBeVisible();
      await expect.poll(async () => Math.abs((await height()) - readyHeight)).toBeLessThan(1);
      await expect.poll(() => page.evaluate((y) => Math.abs(scrollY - y), scroll)).toBeLessThan(1);
    } finally {
      scripts.release();
    }
    await expect(slider).toBeVisible();
    await expect(heading).toBeInViewport();
    await expect.poll(() => page.evaluate((y) => Math.abs(scrollY - y), scroll)).toBeLessThan(1);
  });
}
