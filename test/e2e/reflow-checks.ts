import type { Locator, Page } from '@playwright/test';

export async function waitForReflow(page: Page) {
  await page.evaluate(async () => {
    const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await nextFrame();
    await document.fonts.ready;
    await nextFrame();
  });
}

export async function withReflowDiagnostics(target: Locator, check: () => Promise<void>) {
  try {
    await check();
  } catch (error) {
    const page = target.page();
    const viewport = await page.evaluate(() => {
      const root = document.documentElement;
      const identify = (element: Element) => {
        const slot = element.getAttribute('data-slot');
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id || undefined,
          slot: slot || undefined,
          classes: [...element.classList].slice(0, 4),
        };
      };
      const extendingPastViewport = [...document.body.querySelectorAll('*')]
        .filter((element) => element.getClientRects().length)
        .map((element) => {
          const { left, right } = element.getBoundingClientRect();
          return { element, left, right, overhang: Math.max(-left, right - innerWidth) };
        })
        .filter(({ overhang }) => overhang > 0)
        .sort((first, second) => second.overhang - first.overhang)
        .slice(0, 8)
        .map(({ element, left, right }) => ({
          ...identify(element),
          parent: element.parentElement ? identify(element.parentElement) : undefined,
          position: getComputedStyle(element).position,
          left,
          right,
        }));

      return {
        width: innerWidth,
        height: innerHeight,
        clientWidth: root.clientWidth,
        scrollWidth: root.scrollWidth,
        scrollX,
        scrollY,
        rootFontSize: getComputedStyle(root).fontSize,
        extendingPastViewport,
      };
    });
    const bounds = await target.boundingBox({ timeout: 500 }).catch(() => null);
    throw new Error(`Reflow at ${page.url()}: ${JSON.stringify({ ...viewport, bounds })}`, {
      cause: error,
    });
  }
}
