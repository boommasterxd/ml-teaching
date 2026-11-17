import { expect, test, type Locator, type Page } from '@playwright/test';
import { diagnostics, expectAccessible } from './browser-checks';
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
    expect(geometry.plot.height).toBeLessThanOrEqual(geometry.mobileHeightLimit);
  }
  return geometry.plot;
}

async function expectConnections(exercise: Locator) {
  const distances = await exercise.evaluate((section) => {
    const center = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    };
    const query = center(section.querySelector('.knn-query-position')!);
    const selected = [...section.querySelectorAll('.knn-point-control[aria-pressed="true"]')].map(
      center,
    );
    return [...section.querySelectorAll<SVGPathElement>('.knn-quiz-connections > path')].map(
      (path) => {
        const matrix = path.getScreenCTM()!;
        const start = path.getPointAtLength(0).matrixTransform(matrix);
        const end = path.getPointAtLength(path.getTotalLength()).matrixTransform(matrix);
        return {
          start: Math.hypot(start.x - query.x, start.y - query.y),
          end: Math.min(...selected.map((point) => Math.hypot(end.x - point.x, end.y - point.y))),
        };
      },
    );
  });
  expect(distances).toHaveLength(3);
  for (const distance of distances) {
    expect(distance.start).toBeLessThan(1);
    expect(distance.end).toBeLessThan(1);
  }
}

async function expectResizeContinuity(exercise: Locator, page: Page) {
  const selected = exercise.locator('.knn-point-control[aria-pressed="true"]');
  const labels = await selected.evaluateAll((points) =>
    points.map((point) => point.getAttribute('aria-label')),
  );
  const focused = selected.first();
  await focused.focus();
  for (const width of [1023, 1024, 712]) {
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
  const nearest = (await rankedTargets(exercise)).slice(0, count);
  for (const point of nearest) {
    await point.control.click();
    await expect(point.control).toHaveAttribute('aria-pressed', 'true');
  }
  const dogs = nearest.filter((point) => point.label.startsWith('Hund')).length;
  const winner = dogs > count / 2 ? 'Hund' : 'Katze';
  await exercise.getByRole('button', { name: winner, exact: true }).click();
  await expect(exercise.getByRole('alert')).toContainText('Richtig zugeordnet!');
}

for (const [width, colorScheme] of [
  [320, 'dark'],
  [712, 'light'],
  [1280, 'light'],
] as const) {
  test(`KNN exercise supports retries, voting and new rounds at ${width}px`, async ({ page }) => {
    const failures = diagnostics(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme });
    await page.goto(learningPaths.images);
    const exercise = page.locator('section[aria-labelledby="section-knn-quiz"]');
    await exercise.scrollIntoViewIfNeeded();
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
    await expect(page.getByRole('tooltip')).toContainText('Suche näher an der Raute.');
    await expectAccessible(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    for (const point of points.slice(0, 3)) {
      await point.control.click();
      await expect(point.control).toHaveAttribute('aria-pressed', 'true');
    }
    await expectConnections(exercise);
    if (width === 712) await expectResizeContinuity(exercise, page);
    const dogs = points.slice(0, 3).filter((point) => point.label.startsWith('Hund')).length;
    const winner = dogs >= 2 ? 'Hund' : 'Katze';
    const loser = dogs >= 2 ? 'Katze' : 'Hund';
    await exercise.getByRole('button', { name: loser, exact: true }).click();
    await expect(exercise.getByRole('alert')).toContainText('Zähle noch einmal.');
    await exercise.getByRole('button', { name: winner, exact: true }).click();
    await expect(exercise.getByRole('alert')).toContainText('Richtig zugeordnet!');
    await expect(exercise.getByRole('status')).toContainText(
      `2 von 3 Nachbarn stimmen für ${winner}`,
    );
    await expectAccessible(page);
    const before = await plottedData(exercise);
    await exercise.getByRole('button', { name: 'Neue Runde', exact: true }).click();
    await expect(exercise.getByRole('status')).toContainText('Neue Runde.');
    expect(await plottedData(exercise)).not.toEqual(before);
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveAttribute('aria-valuenow', '5');
    await expect(exercise.getByText('K = 5 · 0 von 5 gefunden')).toBeVisible();
    const fiveNeighbors = await rankedTargets(exercise);
    expect(fiveNeighbors[5].distance - fiveNeighbors[4].distance).toBeGreaterThan(
      Math.min(plot.width, plot.height) * 0.14,
    );
    if (width === 712) {
      await expectOddNeighborVote(exercise, 5);
      await slider.focus();
      await page.keyboard.press('Home');
      await expect(slider).toHaveAttribute('aria-valuenow', '1');
      await expectOddNeighborVote(exercise, 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    expect(failures).toEqual([]);
  });
}
