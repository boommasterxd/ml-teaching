import { expect, test, type Locator } from '@playwright/test';
import { diagnostics, expectAccessible } from './browser-checks';
import { learningPaths } from '../../src/lib/learning-paths';

async function expectAgentJourney(board: Locator, destination: 'star' | 'treasure') {
  const sample = () =>
    board.evaluate((svg, destination) => {
      const route = svg.querySelector<SVGPathElement>('.reward-experiment-route');
      const agent = svg.querySelector<SVGCircleElement>('.reward-experiment-traveler');
      const ring = svg.querySelector<SVGCircleElement>('.reward-experiment-start');
      const goal = svg.querySelector<SVGGraphicsElement>(
        `[data-rewarded="true"][data-goal="${destination}"]`,
      );
      if (!route || !agent || !ring || !goal) return null;
      const progress = 1 - Number(route.getAttribute('stroke-dashoffset'));
      const origin = route.getPointAtLength(0);
      const tip = route.getPointAtLength(route.getTotalLength() * progress);
      const dot = new DOMPoint(agent.cx.baseVal.value, agent.cy.baseVal.value);
      const box = goal.getBBox();
      const tile = svg.querySelector('.reward-experiment-arrival rect')?.getBoundingClientRect();
      const target = goal.getBoundingClientRect();
      return {
        startsAtRing:
          Math.hypot(origin.x - ring.cx.baseVal.value, origin.y - ring.cy.baseVal.value) < 1,
        followsTrail:
          !tile &&
          progress > 0.05 &&
          progress < 0.95 &&
          Math.hypot(dot.x - tip.x, dot.y - tip.y) < 1,
        arrived:
          progress === 1 &&
          Math.hypot(dot.x - box.x - box.width / 2, dot.y - box.y - box.height / 2) < 3,
        confirmsDestination:
          !!tile &&
          tile.left < target.left &&
          tile.top < target.top &&
          tile.right > target.right &&
          tile.bottom > target.bottom &&
          !!svg.querySelector('.reward-experiment-arrival svg path'),
      };
    }, destination);
  const options = { timeout: 12_000, intervals: [90] };
  await expect.poll(sample, options).toMatchObject({ startsAtRing: true, followsTrail: true });
  await expect.poll(sample, options).toMatchObject({ arrived: true, confirmsDestination: true });
}

function trackPreviewSteps(previews: Locator) {
  return previews.evaluateHandle((section) => {
    const steps: (string | number)[][] = [];
    const exits: {
      panel: string;
      faded: boolean;
      removed: boolean;
      removedAt: number | null;
      pauseMs: number | null;
    }[] = [];
    let previous: Element | undefined;
    let observing = true;
    const panelFor = (overlay: Element) =>
      overlay.classList.contains('home-signal-active') ? 'image' : 'reward';

    function trackExit(overlay: Element) {
      const exit: (typeof exits)[number] = {
        panel: panelFor(overlay),
        faded: false,
        removed: false,
        removedAt: null,
        pauseMs: null,
      };
      const highlights =
        exit.panel === 'image'
          ? '.home-signal-active'
          : '.reward-experiment-route, .reward-experiment-traveler, [data-rewarded="true"]';
      exits.push(exit);
      function sample() {
        if (!observing) return;
        if (!overlay.isConnected) {
          exit.removed = !section.querySelector(highlights);
          exit.removedAt = performance.now();
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
      const exit = exits.at(-1);
      if (started && exit && exit.removedAt !== null) {
        exit.pauseMs = performance.now() - exit.removedAt;
      }

      const example = section.querySelector('[data-current-example="true"]');
      const output = example?.querySelector('.home-signal-output')?.textContent ?? '';
      const src = example?.querySelector('.home-example-photo')?.getAttribute('src') ?? '';
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
      attributeFilter: ['src', 'data-current-example', 'data-preview-active', 'data-rewarded'],
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

test('desktop home previews alternate with a pause after each fade and without model requests', async ({
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
    name: 'Coming Soon',
    exact: true,
  });
  await expect(rewardAction).toBeDisabled();
  await expect(rewardAction).toHaveText('Coming Soon');
  await expect(images.getByRole('img')).toBeInViewport({ ratio: 1 });
  await expect(rewards.getByRole('img')).toBeInViewport({ ratio: 1 });
  await expectAgentJourney(rewards.getByRole('img'), 'star');
  await expectAgentJourney(rewards.getByRole('img'), 'treasure');
  await expect
    .poll(() => playback.evaluate(({ steps }) => steps.slice(0, 5)), { timeout: 26_000 })
    .toEqual([
      ['image', 'Hund', 'dog', '', 1],
      ['reward', 'Hund', 'dog', 'star', 1],
      ['image', 'Katze', 'cat', '', 1],
      ['reward', 'Katze', 'cat', 'treasure', 1],
      ['image', 'Hund', 'dog', '', 1],
    ]);
  const exits = await playback.evaluate(({ exits }) => exits.slice(0, 4));
  expect(exits.map(({ panel, faded, removed }) => [panel, faded, removed])).toEqual([
    ['image', true, true],
    ['reward', true, true],
    ['image', true, true],
    ['reward', true, true],
  ]);
  for (const { pauseMs } of exits) {
    expect(pauseMs ?? 0).toBeGreaterThanOrEqual(850);
  }
  await playback.evaluate(({ disconnect }) => disconnect());
  await playback.dispose();
  await expect(previews).toBeFocused();
  await expectAccessible(page);
  expect(unexpectedRequests).toEqual([]);
  expect(failures).toEqual([]);
});

test('stacked home previews loop together and continue independently when scrolled', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  const failures = diagnostics(page);
  await page.goto('/');
  const previews = page.getByRole('region', { name: 'Zwei Arten, wie KI lernt', exact: true });
  const image = previews.getByRole('region', { name: 'Bilderkennung', exact: true });
  const reward = previews.getByRole('region', { name: 'Lernen durch Belohnung', exact: true });
  const active = '[data-preview-active="true"]';
  const photo = image.getByRole('img');
  const board = reward.getByRole('img');
  await photo.evaluate((element) =>
    element.scrollIntoView({ block: 'start', behavior: 'instant' }),
  );
  await expect(photo).toBeInViewport();
  await expect(board).toBeInViewport({ ratio: 0.2 });
  await expect(previews.locator(active)).toHaveCount(2);
  await expect(photo.locator('[data-current-example="true"]')).toContainText('Katze');
  await expect(photo.locator('[data-current-example="true"]')).toContainText('Hund');
  await expect(photo.locator(active)).toHaveCount(1);
  await expectAgentJourney(board, 'treasure');

  await board.evaluate((element) =>
    element.scrollIntoView({ block: 'start', behavior: 'instant' }),
  );
  await expect(photo).not.toBeInViewport();
  await expect(image.locator(active)).toHaveCount(0);
  await expectAgentJourney(board, 'star');
  await expectAccessible(page);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(previews.locator(active)).toHaveCount(0);
  expect(failures).toEqual([]);
});

test('the unpublished reward practice explains its availability and returns to the hub by keyboard', async ({
  page,
}) => {
  const failures = diagnostics(page);
  await page.goto(learningPaths.qLearningPractice);
  const main = page.getByRole('main');
  await expect(main.getByText('Coming Soon', { exact: true })).toBeVisible();
  await expect(main.getByRole('button')).toHaveCount(0);
  const robots = page.locator('meta[name="robots"]');
  await expect
    .poll(() => robots.evaluateAll((tags) => tags.map((tag) => tag.getAttribute('content'))))
    .toEqual([expect.stringMatching(/noindex/)]);

  await expectAccessible(page);

  await main.getByRole('link', { name: 'Zum Lernlabor', exact: true }).press('Enter');
  await expect(page).toHaveURL(learningPaths.hub);
  const unavailable = main.getByRole('button', { name: 'Coming Soon', exact: true });
  await expect(unavailable).toBeDisabled();
  await expect(unavailable).toHaveText('Coming Soon');
  await expect(main.getByText('Coming Soon', { exact: true })).toHaveCount(1);
  expect(failures).toEqual([]);
});
