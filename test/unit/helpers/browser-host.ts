import { vi } from 'vitest';

const pointerMethods = ['setPointerCapture', 'releasePointerCapture', 'hasPointerCapture'] as const;
const originalPointerMethods = pointerMethods.map(
  (name) => [name, Object.getOwnPropertyDescriptor(HTMLElement.prototype, name)] as const,
);

export function restoreBrowserHost() {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const [name, descriptor] of originalPointerMethods) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, name);
  }
}

/** JSDOM has no layout engine: supply a fixed gallery viewport, keeping Virtual's logic real. */
export function installBrowserHost() {
  for (const name of pointerMethods)
    Object.defineProperty(HTMLElement.prototype, name, {
      configurable: true,
      value: vi.fn(() => false),
    });
  vi.stubGlobal('SVGGeometryElement', class extends SVGElement {});
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.classList.contains('gallery-region') ? 320 : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.classList.contains('gallery-region') ? 220 : 0;
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private callback: ResizeObserverCallback) {}
      observe(target: Element) {
        this.callback(
          [
            {
              target,
              borderBoxSize: [{ inlineSize: target.clientWidth, blockSize: target.clientHeight }],
            },
          ] as unknown as ResizeObserverEntry[],
          this as unknown as ResizeObserver,
        );
      }
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.callback(
          [{ target, isIntersecting: true, intersectionRatio: 1 }] as IntersectionObserverEntry[],
          this as unknown as IntersectionObserver,
        );
      }
      unobserve() {}
      disconnect() {}
    },
  );
}
