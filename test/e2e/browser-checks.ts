import { expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export async function holdApplicationScripts(page: Page) {
  let held = 0;
  let delivered = 0;
  const pending = Promise.withResolvers<void>();
  await page.route('**/_next/static/**/*.js', async (route) => {
    held++;
    await pending.promise;
    delivered++;
    await route.continue();
  });
  return {
    release: pending.resolve,
    async expectHeld() {
      await expect.poll(() => held).toBeGreaterThan(0);
      expect(delivered).toBe(0);
    },
  };
}

export async function observePositionShift(target: Locator, selectors: readonly string[]) {
  const movement = await target.evaluateHandle((root, selectors) => {
    const readTargets = () => selectors.map((selector) => [...root.querySelectorAll(selector)]);
    const initialGroups = readTargets();
    const initial = initialGroups.flatMap((group, groupIndex) =>
      group.flatMap((element, index) => {
        const { x, y, top, bottom, width } = element.getBoundingClientRect();
        return width > 0 && bottom > 0 && top < innerHeight
          ? [{ element, id: element.id, groupIndex, index, x, y: y + scrollY }]
          : [];
      }),
    );
    if (!initial.length) throw new Error('No initially visible position targets.');

    let largestShift = 0;
    let missingTarget = '';
    function sample() {
      const groups = readTargets();
      for (const { element, id, groupIndex, index, x, y } of initial) {
        const group = groups[groupIndex];
        const originals = initialGroups[groupIndex];
        let current = element;
        if (!group.includes(element)) {
          const replacement = id
            ? group.find((candidate) => candidate.id === id)
            : group.length === originals.length
              ? group[index]
              : undefined;
          if (
            !replacement ||
            replacement.tagName !== element.tagName ||
            originals.includes(replacement)
          ) {
            missingTarget = `${selectors[groupIndex]} at index ${index}`;
            return;
          }
          current = replacement;
        }
        const rect = current.getBoundingClientRect();
        if (!rect.width || !rect.height) {
          missingTarget = `${selectors[groupIndex]} at index ${index}`;
          return;
        }
        largestShift = Math.max(largestShift, Math.abs(rect.x - x), Math.abs(rect.y + scrollY - y));
      }
    }
    function tick() {
      sample();
      if (!missingTarget) frame = requestAnimationFrame(tick);
    }
    let frame = requestAnimationFrame(tick);
    return {
      finish() {
        cancelAnimationFrame(frame);
        if (!missingTarget) sample();
        if (missingTarget) throw new Error(`Position target disappeared: ${missingTarget}.`);
        return largestShift;
      },
    };
  }, selectors);

  return async () => {
    try {
      return await movement.evaluate(({ finish }) => finish());
    } finally {
      await movement.dispose();
    }
  };
}

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

export async function expectNoStoredTrainingData(page: Page) {
  expect(await page.context().cookies()).toEqual([]);
  expect(
    await page.evaluate(async () => ({
      local: localStorage.length,
      session: sessionStorage.length,
      databases: (await indexedDB.databases()).length,
      caches: (await caches.keys()).length,
    })),
  ).toEqual({ local: 0, session: 0, databases: 0, caches: 0 });
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

export async function expectLiveSystemThemeChanges(page: Page, theme: Locator) {
  await theme.focus();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(theme).toBeChecked();
  await expect(theme).toBeFocused();
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(theme).not.toBeChecked();
  await expect(theme).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
}

export async function expectThemeWipe(page: Page) {
  await page.waitForFunction(() =>
    document.getAnimations().some(({ effect }) => {
      if (
        !(effect instanceof KeyframeEffect) ||
        effect.pseudoElement !== '::view-transition-new(root)'
      )
        return false;
      const progress = effect.getComputedTiming().progress;
      const [start, end] = effect.getKeyframes();
      return (
        typeof progress === 'number' &&
        progress > 0 &&
        progress < 1 &&
        /^inset\(0(?:px)? 100%(?: 0(?:px)?){0,2}\)$/.test(String(start?.clipPath)) &&
        /^inset\(0(?:px)?(?: 0(?:px)?){0,3}\)$/.test(String(end?.clipPath))
      );
    }),
  );
}

type TransitionSnapshot = {
  root: boolean;
  outgoingPages: number;
  incomingPages: number;
  back: boolean;
  setupDialog?: 'enter' | 'exit';
  dialogPresentAtStart?: true;
};
type TransitionObserver = typeof window & {
  observedTransitions: Promise<TransitionSnapshot | { skipped: string }>[];
};

export async function observeViewTransitions(page: Page, { checkDialogExit = false } = {}) {
  await page.addInitScript((checkDialogExit) => {
    const observedTransitions: TransitionObserver['observedTransitions'] = [];
    Object.assign(window, { observedTransitions });
    const start = document.startViewTransition;
    if (!start) return;
    document.startViewTransition = new Proxy(start, {
      apply(target, thisArg, args) {
        const dialogPresentAtStart =
          checkDialogExit &&
          [...document.querySelectorAll('[data-slot="dialog-viewport"], dialog[open]')].some(
            (surface) => surface.getClientRects().length > 0,
          );
        const transition = Reflect.apply(target, thisArg, args) as ViewTransition;
        observedTransitions.push(
          transition.ready.then(
            () => {
              const effects = document
                .getAnimations()
                .map((animation) => animation.effect)
                .filter((effect) => effect instanceof KeyframeEffect);
              const pageLayers = (side: 'old' | 'new') => {
                const prefix = `::view-transition-${side}(`;
                return effects.filter(
                  ({ pseudoElement }) =>
                    pseudoElement?.startsWith(prefix) &&
                    pseudoElement !== `${prefix}root)` &&
                    pseudoElement !== `${prefix}training-setup)`,
                );
              };
              const outgoing = pageLayers('old');
              const incoming = pageLayers('new');
              const setupDialog = effects.some(
                ({ pseudoElement }) => pseudoElement === '::view-transition-new(training-setup)',
              )
                ? 'enter'
                : effects.some(
                      ({ pseudoElement }) =>
                        pseudoElement === '::view-transition-old(training-setup)',
                    )
                  ? 'exit'
                  : undefined;
              // The browser assigns a width to the captured root group even without an animation.
              const rootGroup = getComputedStyle(
                document.documentElement,
                '::view-transition-group(root)',
              );
              return {
                root: Number.isFinite(Number.parseFloat(rootGroup.width)),
                outgoingPages: new Set(outgoing.map(({ pseudoElement }) => pseudoElement)).size,
                incomingPages: new Set(incoming.map(({ pseudoElement }) => pseudoElement)).size,
                back: transition.types.has('nav-back'),
                ...(setupDialog && { setupDialog }),
                ...(dialogPresentAtStart && { dialogPresentAtStart: true }),
              };
            },
            (error: unknown) => ({ skipped: String(error) }),
          ),
        );
        return transition;
      },
    });
  }, checkDialogExit);
  return () => page.evaluate(() => Promise.all((window as TransitionObserver).observedTransitions));
}
