import { expect, type Page } from '@playwright/test';
import { expectAccessible } from './browser-checks';

export async function classLayout(page: Page) {
  const names = page.getByRole('textbox', { name: /^Name für Klasse / });
  return names.evaluateAll((inputs) => {
    const cards = inputs.map((input) => input.closest('[data-slot="card"]')!);
    const [first, next] = cards.map((card) => card.getBoundingClientRect());
    if (!first || !next) throw new Error('The training workspace is incomplete.');
    return {
      heights: [Math.round(first.height), Math.round(next.height)],
      spacing: Math.round(next.top - first.top),
      actions: cards.map((card) =>
        Math.round(
          card.querySelector('[data-slot="card-content"]')!.getBoundingClientRect().top -
            card.getBoundingClientRect().top,
        ),
      ),
    };
  });
}

export async function expectStableNameValidation(page: Page) {
  const names = page.getByRole('textbox', { name: /^Name für Klasse / });
  const first = names.nth(0);
  const second = names.nth(1);
  const originalName = await first.inputValue();
  const layout = await classLayout(page);
  const tooltips = page.locator('[data-slot="tooltip-content"]');

  await first.fill('');
  await first.press('Tab');
  await expect(first).toHaveAccessibleDescription('Gib der Klasse einen Namen');
  await expect(second).not.toHaveAttribute('aria-invalid', 'true');
  const emptyError = tooltips.filter({ hasText: 'Gib der Klasse einen Namen' });
  await expect(emptyError).toBeVisible();
  await expect
    .poll(async () => {
      const [field, tooltip] = await Promise.all([first.boundingBox(), emptyError.boundingBox()]);
      return !!(field && tooltip && tooltip.y + tooltip.height <= field.y);
    })
    .toBe(true);
  expect(await classLayout(page)).toEqual(layout);

  await first.fill(await second.inputValue());
  await first.press('Tab');
  await expect(page.getByRole('button', { name: 'Bilder auswählen' }).first()).toBeFocused();
  await expect(first).toHaveAccessibleDescription('Dieser Name wird schon verwendet');
  await expect(second).toHaveAccessibleDescription('Dieser Name wird schon verwendet');
  const errors = tooltips.filter({ hasText: 'Dieser Name wird schon verwendet' });
  await expect(errors).toHaveCount(2);
  for (const error of await errors.all()) {
    await expect(error).toBeVisible();
  }
  expect(await classLayout(page)).toEqual(layout);
  await expectAccessible(page);

  await first.fill(originalName);
  await expect(first).not.toHaveAttribute('aria-describedby');
  await expect(second).not.toHaveAttribute('aria-describedby');
  await expect(errors).toHaveCount(0);
  expect(await classLayout(page)).toEqual(layout);
}
