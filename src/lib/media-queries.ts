/** Tailwind's md breakpoint, shared by runtime layout and responsive artwork. */
const mediumWidth = '48rem';
export const mediumViewport = `(width >= ${mediumWidth})`;
export const belowMediumViewport = `(width < ${mediumWidth})`;
/** Tailwind's lg breakpoint, shared with the two-column homepage previews. */
const largeViewport = '(width >= 64rem)';
export const reducedMotionMedia = '(prefers-reduced-motion: reduce)';

export function subscribeToMediumViewport(notify: () => void) {
  const media = window.matchMedia(mediumViewport);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
}

export function isMediumViewport() {
  return window.matchMedia(mediumViewport).matches;
}

export function subscribeToLargeViewport(notify: () => void) {
  const media = window.matchMedia(largeViewport);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
}

export function isLargeViewport() {
  return window.matchMedia(largeViewport).matches;
}
