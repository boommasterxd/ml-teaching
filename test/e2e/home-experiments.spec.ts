import { expect, test } from '@playwright/test';
import { diagnostics, expectAccessible } from './browser-checks';

test('home experiments explain inputs and rewards without model requests or focus loss', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark' });
  const failures = diagnostics(page);
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:3100')
      externalRequests.push(request.url());
  });
  await page.goto('/');
  const result = page.locator('.home-input-experiment [role="status"]');
  await expect(result).toContainText('Katze erkannt');
  const dog = page.getByRole('button', { name: 'Hundebild zeigen', exact: true });
  await dog.click();
  await expect(result).toContainText('Hund erkannt');
  await expect(page.locator('.home-input-experiment img')).toHaveAttribute('src', /dog/);
  await expect(dog).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(result).toContainText('Hund erkannt');
  await expect(dog).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Bilderkennung selbst ausprobieren', exact: true }),
  ).toBeFocused();
  const cat = page.getByRole('button', { name: 'Katzenbild zeigen', exact: true });
  await cat.focus();
  await page.keyboard.press('Enter');
  await expect(result).toContainText('Katze erkannt');
  await expect(page.locator('.home-input-experiment img')).toHaveAttribute('src', /cat/);
  await expect(cat).toBeFocused();
  const star = page.getByRole('button', { name: 'Stern belohnen', exact: true });
  await star.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.reward-experiment-readout')).toContainText('Stern: +10');
  await expect(star).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('.reward-experiment-readout')).toContainText('Schatz: +10');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('.reward-experiment-readout')).toContainText('Noch kein Ziel');
  await expect(star).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Q-Learning selbst ausprobieren', exact: true }),
  ).toBeFocused();
  await expectAccessible(page);
  expect(externalRequests).toEqual([]);
  expect(failures).toEqual([]);
});
