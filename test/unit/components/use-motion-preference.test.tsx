import { ReducedMotionContext } from '@animate-ui/react/utils/motion';
import { act, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useMotionPreference } from '@/components/ui/use-motion-preference';

function Setting({ label }: { label: string }) {
  const { reduce } = useMotionPreference();
  return <output aria-label={label}>{reduce ? 'Bewegung reduziert' : 'Bewegung aktiviert'}</output>;
}

afterEach(vi.unstubAllGlobals);

it('shares a live system preference and unsubscribes when the last consumer leaves', () => {
  const media = Object.assign(new EventTarget(), { matches: false });
  const subscribe = vi.spyOn(media, 'addEventListener');
  const unsubscribe = vi.spyOn(media, 'removeEventListener');
  const matchMedia = vi.fn(() => media);
  vi.stubGlobal('matchMedia', matchMedia);

  const { unmount } = render(
    <>
      <Setting label="Seiteneinstieg" />
      <Setting label="Glasgrafik" />
      <ReducedMotionContext value="never">
        <Setting label="Vorschau" />
      </ReducedMotionContext>
    </>,
  );
  expect(matchMedia).toHaveBeenCalledExactlyOnceWith('(prefers-reduced-motion: reduce)');
  expect(subscribe).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Seiteneinstieg').textContent).toBe('Bewegung aktiviert');

  act(() => {
    media.matches = true;
    media.dispatchEvent(new Event('change'));
  });
  expect(screen.getByLabelText('Seiteneinstieg').textContent).toBe('Bewegung reduziert');
  expect(screen.getByLabelText('Glasgrafik').textContent).toBe('Bewegung reduziert');
  expect(screen.getByLabelText('Vorschau').textContent).toBe('Bewegung aktiviert');

  unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});
