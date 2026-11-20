import { ML } from '../constants';

/** One bounded image preparation for training thumbnails and live inference. */
export function drawFeatureFrame(
  source: HTMLVideoElement | HTMLImageElement,
  canvas: HTMLCanvasElement,
  mirror: boolean,
): boolean {
  const width = 'videoWidth' in source ? source.videoWidth : source.naturalWidth || source.width;
  const height =
    'videoHeight' in source ? source.videoHeight : source.naturalHeight || source.height;
  if (width <= 0 || height <= 0) return false;
  if (canvas.width !== ML.FEATURE_CANVAS_SIZE) canvas.width = ML.FEATURE_CANVAS_SIZE;
  if (canvas.height !== ML.FEATURE_CANVAS_SIZE) canvas.height = ML.FEATURE_CANVAS_SIZE;
  const context = canvas.getContext('2d');
  if (!context) return false;
  context.setTransform(1, 0, 0, 1, 0, 0);
  if (mirror) {
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
  }
  const size = Math.min(width, height);
  context.drawImage(
    source,
    (width - size) / 2,
    (height - size) / 2,
    size,
    size,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return true;
}
