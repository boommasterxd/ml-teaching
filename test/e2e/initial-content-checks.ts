import { expect, type Locator } from '@playwright/test';
import { learningPaths } from '../../src/lib/learning-paths';

export async function expectReadable(content: Locator) {
  await content.scrollIntoViewIfNeeded();
  await expect(content).toBeVisible();
  expect(
    await content.evaluate((element) => {
      for (let node: Element | null = element; node; node = node.parentElement) {
        if (Number(getComputedStyle(node).opacity) === 0) return false;
      }
      return element.getClientRects().length > 0;
    }),
  ).toBe(true);
}

export async function expectReadableLink(link: Locator, href: string) {
  await expectReadable(link);
  await expect(link).toHaveAttribute('href', href);
}

export async function expectHomeLearningAreas(main: Locator) {
  const learningAreas = main.getByRole('region', { name: 'Zwei Arten, wie KI lernt', exact: true });
  await expectReadable(learningAreas.getByRole('heading', { name: 'Zwei Arten, wie KI lernt' }));

  const images = learningAreas.getByRole('region', { name: 'Bilderkennung', exact: true });
  await expectReadable(images.getByRole('heading', { name: 'Bilderkennung', exact: true }));
  const practice = images.getByRole('link', { name: 'Eigenes Bildmodell trainieren', exact: true });
  await expectReadableLink(practice, learningPaths.imagePractice);
  await expect(practice).toBeEnabled();

  const rewards = learningAreas.getByRole('region', {
    name: 'Lernen durch Belohnung',
    exact: true,
  });
  await expectReadable(
    rewards.getByRole('heading', { name: 'Lernen durch Belohnung', exact: true }),
  );
  const pending = rewards.getByRole('button', { name: 'Coming Soon', exact: true });
  await expectReadable(pending);
  await expect(pending).toBeDisabled();
  await expect(rewards.getByRole('link')).toHaveCount(0);
}
