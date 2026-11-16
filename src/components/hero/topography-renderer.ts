// Adapted from Animate UI Topography; see docs/third-party-notices.md.
import { configureTexture, createProgram, initializeTexture, rasterLimit } from './topography-gl';
import { CONTOUR_FRAGMENT, FIELD_FRAGMENT } from './topography-shaders';

interface FieldFrame {
  width: number;
  height: number;
  dpr: number;
  time: number;
  lift: number;
  hill: [number, number];
  ripples: Float32Array;
  color: [number, number, number];
}

function uniforms(gl: WebGLRenderingContext, program: WebGLProgram, names: string[]) {
  return Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)]));
}

function initializePrograms(gl: WebGLRenderingContext, programs: WebGLProgram[]) {
  const field = uniforms(gl, programs[0]!, [
    'size',
    'cssSize',
    'z',
    'lift',
    'hill',
    'ripples',
    'reach',
  ]);
  gl.useProgram(programs[0]!);
  gl.uniform1i(gl.getUniformLocation(programs[0]!, 'permutation'), 0);
  for (const [name, value] of [
    ['feature', 280],
    ['hillRadius', 90],
    ['rippleWidth', 60],
  ] as const)
    gl.uniform1f(gl.getUniformLocation(programs[0]!, name), value);
  const contour = uniforms(gl, programs[1]!, ['size', 'fieldSize', 'dpr', 'color']);
  gl.useProgram(programs[1]!);
  gl.uniform1i(gl.getUniformLocation(programs[1]!, 'field'), 0);
  gl.uniform1f(gl.getUniformLocation(programs[1]!, 'range'), 0.95);
  gl.uniform1f(gl.getUniformLocation(programs[1]!, 'step'), 1.9 / 18);
  return { field, contour };
}

function createResources(gl: WebGLRenderingContext) {
  const fieldProgram = createProgram(gl, FIELD_FRAGMENT);
  const contourProgram = fieldProgram && createProgram(gl, CONTOUR_FRAGMENT);
  if (!fieldProgram || !contourProgram) {
    if (fieldProgram) gl.deleteProgram(fieldProgram);
    return null;
  }
  const buffer = gl.createBuffer();
  const permutation = gl.createTexture();
  const fieldTexture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteBuffer(buffer);
    gl.deleteTexture(permutation);
    gl.deleteTexture(fieldTexture);
    gl.deleteFramebuffer(framebuffer);
    gl.deleteProgram(fieldProgram);
    gl.deleteProgram(contourProgram);
  };
  if (!buffer || !permutation || !fieldTexture || !framebuffer) {
    dispose();
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  initializeTexture(gl, permutation);
  configureTexture(gl, fieldTexture);
  return { fieldProgram, contourProgram, permutation, fieldTexture, framebuffer, dispose };
}

function fieldDimensions(field: FieldFrame, limit: number) {
  const width = Math.max(1, Math.ceil(field.width / 4));
  const height = Math.max(1, Math.ceil(field.height / 4));
  const scale = Math.min(1, Math.sqrt(600_000 / (width * height)), limit / width, limit / height);
  return [Math.max(1, Math.floor(width * scale)), Math.max(1, Math.floor(height * scale))] as const;
}

/** No fallback loop: failed or lost contexts retain the server-rendered poster. */
export function createTopographyRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', {
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl || !gl.getExtension('OES_standard_derivatives')) return null;
  // Dithering would corrupt the packed low byte in the RGBA8 field.
  gl.disable(gl.DITHER);
  const resources = createResources(gl);
  if (!resources) return null;
  const { fieldProgram, contourProgram, permutation, fieldTexture, framebuffer } = resources;
  const locations = initializePrograms(gl, [fieldProgram, contourProgram]);
  const maxRasterDimension = rasterLimit(gl);
  let disposed = false;
  let allocatedWidth = 0;
  let allocatedHeight = 0;
  const resizeField = (width: number, height: number) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    if (width === allocatedWidth && height === allocatedHeight) return true;
    gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fieldTexture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return false;
    allocatedWidth = width;
    allocatedHeight = height;
    return true;
  };
  const draw = (frame: FieldFrame) => {
    if (disposed || gl.isContextLost()) return false;
    const width = Math.max(1, Math.floor(frame.width * frame.dpr));
    const height = Math.max(1, Math.floor(frame.height * frame.dpr));
    if (Math.max(width, height) > maxRasterDimension) return false;
    const [fieldWidth, fieldHeight] = fieldDimensions(frame, maxRasterDimension);
    try {
      if (!resizeField(fieldWidth, fieldHeight)) return false;
      gl.viewport(0, 0, fieldWidth, fieldHeight);
      gl.useProgram(fieldProgram);
      gl.bindTexture(gl.TEXTURE_2D, permutation);
      drawField(gl, locations.field, frame, [fieldWidth, fieldHeight]);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.useProgram(contourProgram);
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.uniform2f(locations.contour.size!, width, height);
      gl.uniform2f(locations.contour.fieldSize!, fieldWidth, fieldHeight);
      gl.uniform1f(locations.contour.dpr!, frame.dpr);
      gl.uniform3f(locations.contour.color!, ...frame.color);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return !gl.isContextLost();
    } finally {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  };
  const dispose = () => {
    disposed = true;
    resources.dispose();
  };
  return { draw, dispose, maxRasterDimension };
}

function drawField(
  gl: WebGLRenderingContext,
  at: ReturnType<typeof uniforms>,
  frame: FieldFrame,
  size: readonly [number, number],
) {
  gl.uniform2f(at.size!, ...size);
  gl.uniform2f(at.cssSize!, frame.width, frame.height);
  gl.uniform1f(at.z!, frame.time * 0.000025);
  gl.uniform1f(at.lift!, frame.lift);
  gl.uniform2f(at.hill!, ...frame.hill);
  gl.uniform4fv(at.ripples!, frame.ripples);
  gl.uniform1f(at.reach!, Math.hypot(frame.width, frame.height) * 0.8);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
