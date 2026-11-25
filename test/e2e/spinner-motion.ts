import { expect, type Locator } from '@playwright/test';

function spinnerMotion(glyph: Locator, frames = 1) {
  return glyph.evaluate(async (element, frames) => {
    const motion = { rotated: false, faded: false };
    for (let frame = 0; frame < frames; frame++) {
      if (frame > 0) await new Promise(requestAnimationFrame);
      const { transform, opacity } = getComputedStyle(element);
      motion.rotated ||= transform !== 'none' && !new DOMMatrixReadOnly(transform).isIdentity;
      motion.faded ||= Number(opacity) < 0.99;
    }
    return motion;
  }, frames);
}

export async function expectVisibleSpinnerMotion(link: Locator, reducedMotion: boolean) {
  const spinner = link.locator('[data-slot="spinner"]');
  const glyph = spinner.locator('path');
  await expect(spinner).toBeVisible();
  await expect
    .poll(() => spinnerMotion(glyph))
    .toEqual({ rotated: !reducedMotion, faded: reducedMotion });

  await link.page().getByRole('contentinfo').scrollIntoViewIfNeeded();
  await expect(spinner).not.toBeInViewport();
  await expect.poll(() => spinnerMotion(glyph, 8)).toEqual({ rotated: false, faded: false });
  await link.scrollIntoViewIfNeeded();
  await expect
    .poll(() => spinnerMotion(glyph))
    .toEqual({ rotated: !reducedMotion, faded: reducedMotion });
  await expect(link).toBeFocused();
}
