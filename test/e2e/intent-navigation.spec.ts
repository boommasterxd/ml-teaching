import { expect, test, type Locator, type Page, type Request } from '@playwright/test';
import { diagnostics, expectAccessible, settleEntryAnimations } from './browser-checks';

function isLearningPayload(request: Request) {
  return new URL(request.url()).pathname === '/lernen' && request.headers().rsc === '1';
}

function resourceKey(request: Request) {
  const url = new URL(request.url());
  url.searchParams.delete('_rsc');
  // Next can request the route tree and individual segments independently.
  return `${url.pathname}${url.search}:${request.headers()['next-router-segment-prefetch'] ?? 'full'}`;
}

async function holdLearningPayloads(page: Page, baseURL: string) {
  const payloads: Request[] = [];
  const prefetches: Request[] = [];
  const unexpected: string[] = [];
  let documents = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++;
    if (url.origin !== new URL(baseURL).origin || /model\.json|\.bin$/.test(url.pathname))
      unexpected.push(request.url());
    if (isLearningPayload(request)) payloads.push(request);
    if (isLearningPayload(request) && request.headers()['next-router-prefetch'] === '1')
      prefetches.push(request);
  });
  await page.route('**/lernen?*', async (route) => {
    if (isLearningPayload(route.request())) await pending;
    await route.continue();
  });
  return { payloads, prefetches, unexpected, documents: () => documents, release };
}

async function focusByKeyboard(page: Page, target: Locator) {
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((node) => node === document.activeElement)) return;
  }
  throw new Error('Learning link is unreachable by keyboard.');
}

for (const intent of ['hover', 'keyboard', 'touch'] as const) {
  test.describe(`learning navigation with ${intent} intent`, () => {
    test.use({
      hasTouch: intent === 'touch',
      viewport: intent === 'touch' ? { width: 390, height: 844 } : { width: 1280, height: 900 },
      colorScheme: intent === 'hover' ? 'dark' : 'light',
    });

    test('defers learning payloads until intent and keeps pending navigation usable', async ({
      page,
      baseURL,
    }) => {
      const failures = diagnostics(page);
      const network = await holdLearningPayloads(page, baseURL!);
      try {
        await page.goto('/');
        await settleEntryAnimations(page);
        const link = page.getByRole('link', { name: 'Lernlabor öffnen', exact: true });
        await expect(link).toBeInViewport();
        expect(network.payloads).toEqual([]);
        const original = await link.elementHandle();
        await page.locator('html').evaluate((node) => {
          node.dataset.navigationProbe = 'intent';
        });
        if (intent === 'hover') await link.hover();
        else if (intent === 'keyboard') await focusByKeyboard(page, link);
        else await link.tap();
        await expect.poll(() => network.prefetches.length).toBeGreaterThan(0);
        if (intent !== 'touch') {
          await link.focus();
          await expect(link).toBeFocused();
          await link.hover();
          expect(await link.evaluate((node, original) => node === original, original)).toBe(true);
          if (intent === 'keyboard') await page.keyboard.press('Enter');
          else await link.click();
        }
        expect(network.documents()).toBe(1);
        network.release();
        const consent = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
        await expect(consent).toBeVisible();
        await expect(page).toHaveURL(/\/lernen$/);
        expect(await page.locator('html').getAttribute('data-navigation-probe')).toBe('intent');
        await expect(
          consent.getByRole('button', { name: 'Zustimmen', exact: true }),
        ).toBeDisabled();
        await page.keyboard.press('Tab');
        expect(await consent.evaluate((node) => node.contains(document.activeElement))).toBe(true);
        await expect(page).toHaveTitle('Eigenes Bilderkennungsmodell trainieren | ML Teaching');
        await expectAccessible(page);
        const resources = network.prefetches.map(resourceKey);
        expect(new Set(resources).size).toBe(resources.length);
        expect(network.documents()).toBe(1);
        expect(network.unexpected).toEqual([]);
        expect(failures).toEqual([]);
      } finally {
        network.release();
      }
    });
  });
}
