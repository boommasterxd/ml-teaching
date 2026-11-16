// Adapted from Animate UI Topography; the application uses its WebGL path only.
// See docs/third-party-notices.md for the upstream license.
import { FRAGMENT, VERTEX } from './topography-shaders';

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

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (vertex && fragment && program) {
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
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

function initializeTexture(gl: WebGLRenderingContext, texture: WebGLTexture) {
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
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

/** No 2D fallback loop: unsupported or lost contexts leave the server-rendered poster visible. */
export function createTopographyRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', {
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    antialias: false,
  });
  if (!gl || !gl.getExtension('OES_standard_derivatives')) return null;
  const program = createProgram(gl);
  if (!program) return null;
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    gl.deleteBuffer(buffer);
    gl.deleteTexture(texture);
    gl.deleteProgram(program);
  };
  if (!buffer || !texture) {
    dispose();
    return null;
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  initializeTexture(gl, texture);
  const at = (name: string) => gl.getUniformLocation(program, name);
  const names = ['size', 'dpr', 'z', 'lift', 'hill', 'ripples', 'reach', 'color'] as const;
  const uniforms = Object.fromEntries(names.map((name) => [name, at(name)])) as Record<
    (typeof names)[number],
    WebGLUniformLocation | null
  >;
  gl.uniform1i(at('permutation'), 0);
  gl.uniform1f(at('feature'), 280);
  gl.uniform1f(at('range'), 0.95);
  gl.uniform1f(at('step'), 1.9 / 18);
  gl.uniform1f(at('amount'), 1);
  gl.uniform1f(at('hillRadius'), 90);
  gl.uniform1f(at('rippleWidth'), 60);
  const draw = (field: FieldFrame) => {
    if (disposed || gl.isContextLost()) return false;
    const width = Math.max(1, Math.round(field.width * field.dpr));
    const height = Math.max(1, Math.round(field.height * field.dpr));
    gl.viewport(0, 0, width, height);
    gl.uniform2f(uniforms.size, width, height);
    gl.uniform1f(uniforms.dpr, field.dpr);
    gl.uniform1f(uniforms.z, field.time * 0.000025);
    gl.uniform1f(uniforms.lift, field.lift);
    gl.uniform2f(uniforms.hill, ...field.hill);
    gl.uniform4fv(uniforms.ripples, field.ripples);
    gl.uniform1f(uniforms.reach, Math.hypot(field.width, field.height) * 0.8);
    gl.uniform3f(uniforms.color, ...field.color);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return true;
  };
  return { draw, dispose };
}
