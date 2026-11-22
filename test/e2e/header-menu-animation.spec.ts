import { expect, test } from '@playwright/test';

test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

test('switching to the shorter header menu keeps its animated and settled heights equal', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/lernen');
  const learning = page.getByRole('button', { name: 'Lernlabor', exact: true });
  const legal = page.getByRole('button', { name: 'Rechtliches', exact: true });
  const panel = page.locator('.header-menu-panel');
  await learning.hover();
  await expect(panel.getByRole('link', { name: 'Lernlabor-Übersicht' })).toBeVisible();
  await expect(panel).toHaveCSS('transform', 'none');
  await expect(panel).toHaveCSS('--popup-height', 'auto');

  const target = await panel.evaluateHandle((node) => ({
    height: new Promise<number>((resolve) => {
      function captureHeight(event: Event) {
        if (!(event instanceof TransitionEvent) || event.target !== node) return;
        if (event.propertyName !== 'height') return;
        node.removeEventListener('transitionrun', captureHeight);
        resolve(parseFloat(node.style.getPropertyValue('--popup-height')));
      }
      node.addEventListener('transitionrun', captureHeight);
    }),
  }));
  const { x, y, width, height } = (await legal.boundingBox())!;
  await page.mouse.move(x + width / 2, y + height / 2, { steps: 6 });
  await expect(panel.getByRole('link', { name: 'Barrierefreiheit' })).toBeVisible();
  const animatedHeight = await target.evaluate(({ height }) => height);
  await target.dispose();
  await expect(panel).toHaveCSS('--popup-height', 'auto');
  expect((await panel.boundingBox())!.height).toBeCloseTo(animatedHeight, 0);
});
