import { vi } from 'vitest';
import { installBrowserHost, restoreBrowserHost } from './browser-host';

const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate');
const originalAnimations = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'getAnimations');

export function installThemeHost() {
  installBrowserHost();
  // JSDOM lacks WAAPI. Keep Animate UI's real menu lifecycle, stubbing only this browser edge.
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    value: vi.fn(() => ({
      finished: Promise.resolve(),
      cancel: vi.fn(),
      finish: vi.fn(),
      playState: 'finished',
    })),
  });
  Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
    configurable: true,
    value: () => [],
  });
  window.localStorage.clear();
  document.documentElement.classList.remove('dark');
  delete document.documentElement.dataset.theme;
  const media = Object.assign(new EventTarget(), {
    matches: false,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  });
  const other = {
    ...media,
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => (query === media.media ? media : other)),
  );
  return {
    setSystemDark(value: boolean) {
      media.matches = value;
      media.dispatchEvent(new Event('change'));
    },
  };
}

export function restoreThemeHost() {
  Reflect.deleteProperty(document, 'startViewTransition');
  Reflect.deleteProperty(document.documentElement, 'animate');
  if (originalAnimate) Object.defineProperty(HTMLElement.prototype, 'animate', originalAnimate);
  else Reflect.deleteProperty(HTMLElement.prototype, 'animate');
  if (originalAnimations)
    Object.defineProperty(HTMLElement.prototype, 'getAnimations', originalAnimations);
  else Reflect.deleteProperty(HTMLElement.prototype, 'getAnimations');
  restoreBrowserHost();
}
