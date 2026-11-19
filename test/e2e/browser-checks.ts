import { expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export async function settleEntryAnimations(page: Page) {
  await page.evaluate(async () => {
    const transition = (document as Document & { activeViewTransition?: ViewTransition })
      .activeViewTransition;
    await transition?.finished.catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
    });
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    const animations = document.getAnimations().filter((animation) => {
      const target = (animation.effect as KeyframeEffect | null)?.target;
      return target instanceof Element && target.hasAttribute('data-entry-reveal');
    });
    await Promise.all(
      animations.map((animation) =>
        animation.finished.catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
        }),
      ),
    );
  });
  for (const entry of await page.locator('[data-entry-reveal]').all()) {
    const settlingInView = await entry.evaluate((node) => {
      const { top, bottom } = node.getBoundingClientRect();
      const opacity = Number(getComputedStyle(node).opacity);
      return top < innerHeight - 24 && bottom > 24 && opacity > 0 && opacity < 1;
    });
    if (settlingInView) await expect(entry).toHaveCSS('opacity', '1');
  }
}

export async function expectAccessible(page: Page) {
  await settleEntryAnimations(page);
  await expect(page.locator(':is([role="dialog"], [role="alertdialog"])[data-closed]')).toHaveCount(
    0,
  );
  for (const surface of await page
    .locator(
      ':is([role="dialog"], [role="alertdialog"], [role="menu"], [data-slot="tooltip-content"])[data-open], [data-slot="animated-feedback"]:not([aria-hidden="true"]) > div > div',
    )
    .all()) {
    await expect(surface).toHaveCSS('opacity', '1');
  }
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const violations = result.violations
    .map((rule) => {
      if (rule.id !== 'aria-hidden-focus') return rule;
      // Base UI's empty focus guards redirect synchronously (upstream #4668).
      // The menu keyboard flows exercise both tab directions independently.
      return { ...rule, nodes: rule.nodes.filter(({ html }) => !isBaseFocusGuard(html)) };
    })
    .filter(({ nodes }) => nodes.length > 0);
  expect(violations).toEqual([]);
}

function isBaseFocusGuard(html: string) {
  return (
    /^<span [^<>]+><\/span>$/.test(html) &&
    html.includes(' data-base-ui-focus-guard=""') &&
    html.includes(' aria-hidden="true"') &&
    html.includes(' tabindex="0"')
  );
}

export function diagnostics(page: Page, expectedMissingDocument?: string) {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('console', (message) => {
    const invalidMotion = /not.animatable|trying to animate|interpolat/i;
    const text = message.text();
    if (
      expectedMissingDocument &&
      message.location().url.endsWith(expectedMissingDocument) &&
      text.startsWith('Failed to load resource:') &&
      text.includes('status of 404')
    )
      return;
    if (message.type() === 'error' || invalidMotion.test(text)) failures.push(text);
  });
  return failures;
}

export async function expectMenuHighlight(row: Locator, background: string) {
  await expect
    .poll(() =>
      row.evaluate((item) => {
        const container = item.closest('[data-slot="motion-highlight-container"]');
        if (!container) throw new Error('The item has no menu highlight container.');
        const rowBounds = item.getBoundingClientRect();
        return Array.from(
          container.querySelectorAll('[data-slot="motion-highlight"]'),
          (surface) => {
            const bounds = surface.getBoundingClientRect();
            const style = getComputedStyle(surface);
            return {
              background: style.backgroundColor,
              opacity: style.opacity,
              onRow:
                Math.abs(bounds.left - rowBounds.left) <= 2 &&
                Math.abs(bounds.top - rowBounds.top) <= 2 &&
                Math.abs(bounds.width - rowBounds.width) <= 2 &&
                Math.abs(bounds.height - rowBounds.height) <= 2,
            };
          },
        );
      }),
    )
    .toEqual([{ background, opacity: '1', onRow: true }]);
}
