/** Tailwind's md breakpoint, shared by runtime layout and responsive artwork. */
export const mediumViewport = '(width >= 48rem)';
export const reducedMotionMedia = '(prefers-reduced-motion: reduce)';

export function subscribeToMediumViewport(notify: () => void) {
  const media = window.matchMedia(mediumViewport);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
}

export function isMediumViewport() {
  return window.matchMedia(mediumViewport).matches;
}
