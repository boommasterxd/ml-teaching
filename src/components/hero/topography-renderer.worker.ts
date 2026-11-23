import { createTopographyRenderer, type FieldFrame } from './topography-renderer';
import type { GlassShape } from './topography-gl';

export type RenderRequest =
  | { type: 'start'; canvas: OffscreenCanvas; shape: GlassShape }
  | { type: 'draw'; frame: FieldFrame };

export type RenderResponse =
  | { type: 'ready'; maxRasterDimension: number; rippleCapacity: number }
  | { type: 'drawn'; result: boolean | 'pending' };

const scope = globalThis as unknown as {
  onmessage: (message: MessageEvent<RenderRequest>) => void;
  postMessage(message: RenderResponse): void;
};
let canvas: OffscreenCanvas | undefined;
let renderer: ReturnType<typeof createTopographyRenderer>;

scope.onmessage = ({ data }) => {
  if (data.type === 'start') {
    canvas = data.canvas;
    renderer = createTopographyRenderer(canvas, data.shape);
    if (!renderer) {
      scope.postMessage({ type: 'drawn', result: false });
      return;
    }
    canvas.addEventListener(
      'webglcontextlost',
      () => scope.postMessage({ type: 'drawn', result: false }),
      { once: true },
    );
    scope.postMessage({
      type: 'ready',
      maxRasterDimension: renderer.maxRasterDimension,
      rippleCapacity: renderer.rippleCapacity,
    });
    return;
  }
  if (!canvas || !renderer) return;
  const { frame } = data;
  const width = Math.max(1, Math.floor(frame.width * frame.dpr));
  const height = Math.max(1, Math.floor(frame.height * frame.dpr));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  scope.postMessage({ type: 'drawn', result: renderer.draw(frame) });
};
