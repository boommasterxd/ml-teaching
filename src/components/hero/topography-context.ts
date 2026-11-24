export function createTopographyContext(canvas: HTMLCanvasElement | OffscreenCanvas) {
  const gl = canvas.getContext('webgl', {
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    antialias: false,
    depth: false,
    stencil: false,
  });
  return gl?.getExtension('OES_standard_derivatives') ? gl : null;
}
