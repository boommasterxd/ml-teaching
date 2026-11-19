// Adapted from Animate UI Topography; see docs/third-party-notices.md.
import {
  configureTexture,
  queueGlassPrograms,
  rasterLimit,
  type GlassShape,
} from './topography-gl';

interface FieldFrame {
  width: number;
  height: number;
  dpr: number;
  fieldScale: number;
  fieldTexels: number;
  time: number;
  lift: number;
  hill: [number, number];
  ripples: Float32Array;
}

function uniforms(gl: WebGLRenderingContext, program: WebGLProgram, names: string[]) {
  return Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)]));
}

type Programs = NonNullable<ReturnType<typeof queueGlassPrograms>>;

function initializePrograms(gl: WebGLRenderingContext, programs: Programs) {
  const field = uniforms(gl, programs.field, [
    'size',
    'cssSize',
    'phase',
    'lift',
    'hill',
    'ripples',
    'reach',
  ]);
  gl.useProgram(programs.field);
  for (const [name, value] of [
    ['hillRadius', 90],
    ['rippleWidth', 60],
  ] as const)
    gl.uniform1f(gl.getUniformLocation(programs.field, name), value);
  const glass = uniforms(gl, programs.glass, ['size']);
  gl.useProgram(programs.glass);
  gl.uniform1i(gl.getUniformLocation(programs.glass, 'field'), 0);
  return { field, glass };
}

function createResources(gl: WebGLRenderingContext, shape: GlassShape) {
  const programs = queueGlassPrograms(gl, shape);
  if (!programs) return null;
  const buffer = gl.createBuffer();
  const fieldTexture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteBuffer(buffer);
    gl.deleteTexture(fieldTexture);
    gl.deleteFramebuffer(framebuffer);
    programs.dispose();
  };
  if (!buffer || !fieldTexture || !framebuffer) {
    dispose();
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  configureTexture(gl, fieldTexture);
  return { programs, fieldTexture, framebuffer, dispose };
}

function fieldDimensions(field: FieldFrame, limit: number) {
  // Resolve narrow studio highlights on compact stages without tracing at device density.
  const stride = Math.min(4, Math.max(1.5, Math.min(field.width, field.height) / 330));
  const width = Math.max(1, Math.ceil((field.width / stride) * field.fieldScale));
  const height = Math.max(1, Math.ceil((field.height / stride) * field.fieldScale));
  const scale = Math.min(
    1,
    Math.sqrt(field.fieldTexels / (width * height)),
    limit / width,
    limit / height,
  );
  return [Math.max(1, Math.floor(width * scale)), Math.max(1, Math.floor(height * scale))] as const;
}

/** No fallback loop: failed or lost contexts retain the server-rendered poster. */
export function createTopographyRenderer(canvas: HTMLCanvasElement, shape: GlassShape = 'ring') {
  const gl = canvas.getContext('webgl', {
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl || !gl.getExtension('OES_standard_derivatives')) return null;
  // The reconstruction pass reads the signed silhouette from the alpha channel.
  gl.disable(gl.DITHER);
  const maxRasterDimension = rasterLimit(gl);
  const resources = createResources(gl, shape);
  if (!resources) return null;
  const { programs, fieldTexture, framebuffer } = resources;
  let locations: ReturnType<typeof initializePrograms> | undefined;
  let disposed = false;
  const dispose = () => {
    disposed = true;
    resources.dispose();
  };
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
    if (!locations) {
      const linked = programs.poll();
      if (linked === 'pending') return linked;
      if (!linked) {
        dispose();
        return false;
      }
      locations = initializePrograms(gl, programs);
    }
    const [fieldWidth, fieldHeight] = fieldDimensions(frame, maxRasterDimension);
    try {
      if (!resizeField(fieldWidth, fieldHeight)) return false;
      gl.viewport(0, 0, fieldWidth, fieldHeight);
      gl.useProgram(programs.field);
      drawField(gl, locations.field, frame, [fieldWidth, fieldHeight]);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.useProgram(programs.glass);
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.uniform2f(locations.glass.size!, width, height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return !gl.isContextLost();
    } finally {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  };
  return { draw, dispose, maxRasterDimension, rippleCapacity: programs.rippleCapacity };
}

function drawField(
  gl: WebGLRenderingContext,
  at: ReturnType<typeof uniforms>,
  frame: FieldFrame,
  size: readonly [number, number],
) {
  gl.uniform2f(at.size!, ...size);
  gl.uniform2f(at.cssSize!, frame.width, frame.height);
  gl.uniform1f(at.phase!, (frame.time * 2 * Math.PI) / 10_000);
  gl.uniform1f(at.lift!, frame.lift);
  gl.uniform2f(at.hill!, ...frame.hill);
  gl.uniform4fv(at.ripples!, frame.ripples);
  gl.uniform1f(at.reach!, Math.hypot(frame.width, frame.height) * 0.8);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
