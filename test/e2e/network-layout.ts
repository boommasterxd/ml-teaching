import { expect, type Page } from '@playwright/test';

/** Ordered geometry and arrow directions must describe the same four-step process. */
export async function expectNetworkLayout(page: Page, layout: 'column' | 'grid' | 'row') {
  const stages = page.getByRole('list', { name: 'Vom Beispielbild zur Ausgabe' });
  const boxes = await stages.locator('.network-station').evaluateAll((items) =>
    items.map((item) => {
      const { x, y } = item.getBoundingClientRect();
      return { x, y };
    }),
  );
  expect(boxes).toHaveLength(4);
  if (layout === 'grid') {
    expect(boxes[0].y).toBeCloseTo(boxes[1].y, 0);
    expect(boxes[2].y).toBeCloseTo(boxes[3].y, 0);
    expect(boxes[2].x).toBeCloseTo(boxes[1].x, 0);
    expect(boxes[3].x).toBeCloseTo(boxes[0].x, 0);
    expect(boxes[1].x).toBeGreaterThan(boxes[0].x);
    expect(boxes[2].y).toBeGreaterThan(boxes[1].y);
  } else {
    for (let index = 1; index < boxes.length; index++) {
      expect(boxes[index][layout === 'row' ? 'y' : 'x']).toBeCloseTo(
        boxes[0][layout === 'row' ? 'y' : 'x'],
        0,
      );
      expect(boxes[index][layout === 'row' ? 'x' : 'y']).toBeGreaterThan(
        boxes[index - 1][layout === 'row' ? 'x' : 'y'],
      );
    }
  }
  const arrows = await stages.evaluate((list) =>
    Array.from(list.querySelectorAll<SVGSVGElement>('.network-bridge > svg:first-child'), (svg) => {
      const path = svg.querySelector('path')!;
      const matrix = svg.getScreenCTM()!;
      const from = path.getPointAtLength(0).matrixTransform(matrix);
      const to = path.getPointAtLength(path.getTotalLength()).matrixTransform(matrix);
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : 'down';
    }),
  );
  expect(arrows).toEqual(
    layout === 'grid'
      ? ['right', 'down', 'left']
      : Array.from({ length: 3 }, () => (layout === 'row' ? 'right' : 'down')),
  );
  if (layout !== 'column') {
    const card = await page.locator('.landing-demo [data-slot="card"]').boundingBox();
    const header = await page.locator('.site-header').boundingBox();
    expect(card!.height + header!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  }
}
