import { VERTEX } from './topography-shaders';

const PERMUTATION = (() => {
  const table = Array.from({ length: 256 }, (_, index) => index);
  let seed = 1013;
  for (let index = 255; index > 0; index--) {
    seed = (seed * 16807) % 2147483647;
    const next = seed % (index + 1);
    [table[index], table[next]] = [table[next]!, table[index]!];
  }
  return Uint8Array.from(table);
})();

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

export function createProgram(gl: WebGLRenderingContext, fragmentSource: string) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (vertex && fragment && program) {
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'position');
    gl.linkProgram(program);
    gl.detachShader(program, vertex);
    gl.detachShader(program, fragment);
  }
  if (vertex) gl.deleteShader(vertex);
  if (fragment) gl.deleteShader(fragment);
  if (program && vertex && fragment && gl.getProgramParameter(program, gl.LINK_STATUS))
    return program;
  if (program) gl.deleteProgram(program);
  return null;
}

export function initializeTexture(gl: WebGLRenderingContext, texture: WebGLTexture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    256,
    1,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    PERMUTATION,
  );
  configureTexture(gl, texture);
}

export function rasterLimit(gl: WebGLRenderingContext) {
  const viewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array | null;
  const candidates = [
    gl.getParameter(gl.MAX_TEXTURE_SIZE),
    gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    ...(viewport ?? []),
  ];
  return Math.min(8192, ...candidates.filter((value) => Number.isFinite(value) && value > 0));
}

export function configureTexture(gl: WebGLRenderingContext, texture: WebGLTexture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}
