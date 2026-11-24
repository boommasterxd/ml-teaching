import { createTopographyContext } from './topography-context';
import type { FieldFrame, initializeTopographyRenderer } from './topography-renderer';
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
let renderer: ReturnType<typeof initializeTopographyRenderer>;

function reportUnavailable() {
  scope.postMessage({ type: 'drawn', result: false });
}

async function startRenderer(surface: OffscreenCanvas, shape: GlassShape) {
  const gl = createTopographyContext(surface);
  if (!gl) return reportUnavailable();
  canvas = surface;
  surface.addEventListener('webglcontextlost', reportUnavailable, { once: true });
  // Signal unsupported WebGL without first loading and evaluating the shader module.
  const { initializeTopographyRenderer } = await import('./topography-renderer');
  if (gl.isContextLost()) return reportUnavailable();
  renderer = initializeTopographyRenderer(gl, shape);
  if (!renderer) return reportUnavailable();
  scope.postMessage({
    type: 'ready',
    maxRasterDimension: renderer.maxRasterDimension,
    rippleCapacity: renderer.rippleCapacity,
  });
}

scope.onmessage = ({ data }) => {
  if (data.type === 'start') {
    void startRenderer(data.canvas, data.shape).catch(reportUnavailable);
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
