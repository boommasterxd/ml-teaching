import { expect, test, type Locator } from '@playwright/test';
import { diagnostics, expectAccessible } from './browser-checks';
import { learningPaths } from '../../src/lib/learning-paths';

function trackPreviewSteps(previews: Locator) {
  return previews.evaluateHandle((section) => {
    const steps: (string | number)[][] = [];
    const exits: { panel: string; faded: boolean; removed: boolean }[] = [];
    let previous: Element | undefined;
    let observing = true;
    const panelFor = (overlay: Element) =>
      overlay.classList.contains('home-signal-active') ? 'image' : 'reward';

    function trackExit(overlay: Element) {
      const exit = { panel: panelFor(overlay), faded: false, removed: false };
      const highlights =
        exit.panel === 'image'
          ? '.home-signal-active'
          : '.reward-experiment-route, .reward-experiment-traveler, [data-rewarded="true"]';
      exits.push(exit);
      function sample() {
        if (!observing) return;
        if (!overlay.isConnected) {
          exit.removed = !section.querySelector(highlights);
          return;
        }
        const opacity = Number(getComputedStyle(overlay).opacity);
        if (opacity > 0 && opacity < 1) exit.faded = true;
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    }

    const record = () => {
      const active = section.querySelectorAll('[data-preview-active="true"]');
      const overlay = active[0];
      const started = overlay !== previous;
      if (started && previous) trackExit(previous);
      previous = overlay;
      if (!overlay) return;

      const output = section.querySelector('.home-signal-output')?.textContent ?? '';
      const src = section.querySelector('.home-example-photo')?.getAttribute('src') ?? '';
      const image = src.includes('dog') ? 'dog' : src.includes('cat') ? 'cat' : '';
      const goal = overlay.querySelector('[data-rewarded="true"]');
      const destination = goal?.querySelector('rect') ? 'treasure' : goal ? 'star' : '';
      const step = [panelFor(overlay), output, image, destination, active.length];
      if (started || step.some((value, index) => value !== steps.at(-1)?.[index])) steps.push(step);
    };
    const observer = new MutationObserver(record);
    observer.observe(section, {
      childList: true,
      subtree: true,
      characterData: true,
      attributeFilter: ['src', 'data-preview-active', 'data-rewarded'],
    });
    record();
    return {
      steps,
      exits,
      disconnect() {
        observing = false;
        observer.disconnect();
      },
    };
  });
}

test('visible home previews alternate automatically without model requests', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });
  const failures = diagnostics(page);
  const unexpectedRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== new URL(baseURL!).origin || /model\.json|\.bin$/.test(url.pathname))
      unexpectedRequests.push(request.url());
  });
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Du probierst. Deine KI lernt.', exact: true });
  await hero.getByRole('link', { name: 'Mini-Experimente', exact: true }).focus();
  const previews = page.getByRole('region', { name: 'Zwei Arten, wie KI lernt', exact: true });
  const playback = await trackPreviewSteps(previews);
  const scrollPositions = await page.evaluateHandle(() => {
    const positions = new Set<number>();
    function record() {
      positions.add(window.scrollY);
      if (positions.size > 1) window.removeEventListener('scroll', record);
    }
    window.addEventListener('scroll', record);
    return positions;
  });
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/#lernbereiche');
  await expect(previews).toBeFocused();
  await expect.poll(() => scrollPositions.evaluate((positions) => positions.size)).toBe(2);
  await scrollPositions.dispose();
  await expect(previews.getByRole('button')).toHaveCount(1);
  await expect(previews.locator('[aria-live], [role="status"]')).toHaveCount(0);

  const images = previews.getByRole('region', { name: 'Bilderkennung', exact: true });
  const rewards = previews.getByRole('region', { name: 'Lernen durch Belohnung', exact: true });
  const rewardAction = rewards.getByRole('button', {
    name: 'Belohnungen ausprobieren',
    exact: true,
  });
  await expect(rewardAction).toBeDisabled();
  await expect(rewardAction).toHaveAccessibleDescription('Coming Soon');
  await expect(images.getByRole('img')).toBeInViewport({ ratio: 1 });
  await expect(rewards.getByRole('img')).toBeInViewport({ ratio: 1 });
  await expect
    .poll(() => playback.evaluate(({ steps }) => steps.slice(0, 5)), { timeout: 26_000 })
    .toEqual([
      ['image', 'Hund', 'dog', '', 1],
      ['reward', 'Hund', 'dog', 'star', 1],
      ['image', 'Katze', 'cat', '', 1],
      ['reward', 'Katze', 'cat', 'treasure', 1],
      ['image', 'Hund', 'dog', '', 1],
    ]);
  await expect
    .poll(() => playback.evaluate(({ exits }) => exits.slice(0, 4)))
    .toEqual([
      { panel: 'image', faded: true, removed: true },
      { panel: 'reward', faded: true, removed: true },
      { panel: 'image', faded: true, removed: true },
      { panel: 'reward', faded: true, removed: true },
    ]);
  await playback.evaluate(({ disconnect }) => disconnect());
  await playback.dispose();
  await expect(previews).toBeFocused();
  await expectAccessible(page);
  expect(unexpectedRequests).toEqual([]);
  expect(failures).toEqual([]);
});

test('the reward experiment opens from the learning hub and keeps keyboard focus', async ({
  page,
}) => {
  const failures = diagnostics(page);
  await page.goto(learningPaths.hub);
  const practiceLink = { name: 'Belohnungen ausprobieren', exact: true };
  await page.getByRole('link', practiceLink).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(learningPaths.qLearningPractice);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Belohnungen ausprobieren', exact: true }),
  ).toBeVisible();
  const robots = page.locator('meta[name="robots"]');
  await expect
    .poll(() => robots.evaluateAll((tags) => tags.map((tag) => tag.getAttribute('content'))))
    .toEqual([expect.stringMatching(/noindex/)]);

  const star = page.getByRole('button', { name: 'Stern belohnen', exact: true });
  const treasure = page.getByRole('button', { name: 'Schatz belohnen', exact: true });
  const reset = page.getByRole('button', { name: 'Zurücksetzen', exact: true });
  const reward = page.getByRole('main').getByRole('status');
  await star.focus();
  await page.keyboard.press('Enter');
  await expect(reward).toContainText('Stern: +10');
  await expect(star).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(treasure).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(reward).toContainText('Schatz: +10');
  await page.keyboard.press('Tab');
  await expect(reset).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(reward).toContainText('Noch kein Ziel');
  await expect(star).toBeFocused();
  await expectAccessible(page);

  await page.getByRole('link', { name: 'Zum Lernlabor', exact: true }).click();
  await expect(page).toHaveURL(learningPaths.hub);
  expect(failures).toEqual([]);
});
