import type { FieldFrame } from './topography-renderer';
import type { RenderRequest, RenderResponse } from './topography-renderer.worker';
import type { GlassShape } from './topography-gl';

export function createTopographyWorker(
  canvas: HTMLCanvasElement,
  shape: GlassShape,
  onUnavailable: () => void,
) {
  if (typeof Worker !== 'function' || typeof canvas.transferControlToOffscreen !== 'function')
    return null;

  let worker: Worker | undefined;
  let surface: OffscreenCanvas;
  try {
    worker = new Worker(new URL('./topography-renderer.worker.ts', import.meta.url));
    surface = canvas.transferControlToOffscreen();
  } catch {
    worker?.terminate();
    return null;
  }

  const bridge = worker;
  let ready: Extract<RenderResponse, { type: 'ready' }> | undefined;
  let inFlight = false;
  let painted = false;
  let failed = false;
  let queuedFrame: FieldFrame | undefined;
  function fail() {
    if (failed) return;
    failed = true;
    onUnavailable();
  }
  function sendFrame(frame: FieldFrame) {
    inFlight = true;
    const request: RenderRequest = { type: 'draw', frame };
    bridge.postMessage(request);
  }
  bridge.onerror = (event) => {
    event.preventDefault();
    fail();
  };
  bridge.onmessage = ({ data }: MessageEvent<RenderResponse>) => {
    if (data.type === 'ready') {
      ready = data;
      return;
    }
    inFlight = false;
    if (data.result === false) return fail();
    painted ||= data.result === true;
    if (queuedFrame) {
      const frame = queuedFrame;
      queuedFrame = undefined;
      sendFrame(frame);
    }
  };
  const start: RenderRequest = { type: 'start', canvas: surface, shape };
  bridge.postMessage(start, [surface]);

  return {
    get busy() {
      return inFlight;
    },
    get maxRasterDimension() {
      return ready?.maxRasterDimension ?? 8192;
    },
    get rippleCapacity() {
      return ready?.rippleCapacity ?? 0;
    },
    draw(frame: FieldFrame) {
      if (failed) return false;
      if (ready) {
        if (inFlight) queuedFrame = frame;
        else sendFrame(frame);
      }
      return painted ? true : ('pending' as const);
    },
    dispose() {
      bridge.onmessage = null;
      bridge.onerror = null;
      bridge.terminate();
    },
  };
}
